// backend/src/sockets/game.socket.js

const formatMessage = require("../utils/messages");
const { buildingPossible, findPlacesAroundArea } = require("../utils/netz");
const {
 userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getUserByPlayerId,

  // helpers if you want them elsewhere
  usersByPlayerId,
  setOnline,
  setOffline,
  markAbandoned,
} = require("../utils/users");
let techSeq = 0;   // globale Sequenznummer für Debug

let IO = null;
const botName = "AutoBot";
// ====== STEP 1 CONFIG (small steps) ======
const TURN_SECONDS = 60;     // ✅ was 30

const MAX_PLAYERS = 4;       // ✅ cap
const USERNAME_MAX = 12;     // ✅ cap
const WIN_POINTS = 30;
let gameActive = false; // global (später pro room)
let state = {};
let map = {};

// ✅ pro room Interval IDs, damit nicht mehrfach gestartet wird
const roomIntervals = {}; // room -> intervalId

// ---------------- ROOMS LIST HELPERS ----------------

function getRoomsSnapshot() {
  return Object.entries(state)
    .filter(([room, s]) => s && typeof s === "object")
    .map(([room, s]) => ({
      room,
      playerCount: s.playerCount ?? 0,
      quantity: s.quantity ?? 0,
      joinable: (s.playerCount ?? 0) < (s.quantity ?? 0),
    }))
    .sort((a, b) => a.room.localeCompare(b.room));
}

function emitRooms(io) {
  io.emit("roomsList", getRoomsSnapshot());
}



// ---------------- SMALL HELPERS ----------------

function sanitizeUsername(name) {
  return String(name || "Player").trim().slice(0, USERNAME_MAX);
}

function clampInt(n, min, max) {
  n = Number(n);
  if (!Number.isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

function emitTech(IO, room, msg) {
  IO.to(room).emit("tech", msg);
}

function emitTechToSocket(socket, msg) {
  socket.emit("tech", msg);
}


// ---------------- SOCKET REGISTRATION ----------------

module.exports = function registerGameSockets(io) {
  IO = io;
  io.on("connection", (socket) => {
    console.log("[client] CONNECT socket.id =", socket.id);

    socket.onAny((event, ...args) => {
      console.log("[socket] EVENT IN:", event, args);
    });

    // Lobby: sofort Liste schicken
    socket.emit("roomsList", getRoomsSnapshot());
    socket.on("listRooms", () => socket.emit("roomsList", getRoomsSnapshot()));
// -------- SHIP --------
    socket.on("ship", (id) => {
      const user = getCurrentUser(socket.id);
      if (!user) {
        socket.emit("userError", { text: "Not logged in." });
        return;
      }

      const res = buildShip(id, state, user);

      if (res && res.ok === false) {
        socket.emit("userError", { text: res.message });
      }
      // Hinweis: Das Game-State-Update wird automatisch durch den Interval (500ms) an alle gesendet
    });
    
    // 4:1 Trade (kompatibel zu deinem Client, der "trade" sendet)
    socket.on("trade", ({ giveRes, getRes, rate }, cb) => {
      const user = getCurrentUser(socket.id);
      if (!user) return cb?.({ ok: false, error: "no user" });

      const roomState = state[user.room];
      if (!roomState) return cb?.({ ok: false, error: "no roomState" });

      const playerNum = keyByVal(roomState, user.playerId);
      if (!playerNum) return cb?.({ ok: false, error: "no playerNum" });

      giveRes = Number(giveRes);
      getRes = Number(getRes);
      rate = Number(rate || 4);

      // validieren
      if (
        ![1, 2, 3, 4, 5].includes(giveRes) ||
        ![1, 2, 3, 4, 5].includes(getRes) ||
        giveRes === getRes
      ) {
        return cb?.({ ok: false, error: "bad params", giveRes, getRes, rate });
      }

      const beforeGive = roomState[playerNum][giveRes];
      const beforeGet = roomState[playerNum][getRes];

      if (beforeGive < rate) {
        console.log("[trade] BLOCKED not enough", {
          user: user.username,
          playerNum,
          giveRes,
          getRes,
          rate,
          beforeGive,
        });
        socket.emit(
          "message",
          formatMessage(botName, `Not enough resources for ${rate}:1 trade.`)
        );
        return cb?.({ ok: false, error: "not enough", beforeGive, beforeGet });
      }

      roomState[playerNum][giveRes] -= rate;
      roomState[playerNum][getRes] += 1;

      console.log("[trade] OK", {
        user: user.username,
        room: user.room,
        playerNum,
        giveRes,
        getRes,
        rate,
        before: { give: beforeGive, get: beforeGet },
        after: {
          give: roomState[playerNum][giveRes],
          get: roomState[playerNum][getRes],
        },
      });

      // sofort neuen state pushen
      emitGameState(io, user.room, roomState);

      cb?.({ ok: true });
    });
socket.on("skipTurn", () => {
  const user = getCurrentUser(socket.id);
  if (!user) return;

  const room = user.room;
  const roomState = state[room];
  if (!roomState) return;
  const mySlot = keyByVal(roomState, user.playerId);  
  if (!mySlot) return;

  // ✅ nur aktiver Spieler darf skippen
  if (Number(mySlot) !== Number(roomState.activePlayerNumber)) {
    socket.emit("userError", { text: "Not your turn." }); // optional
    return;
  }
  advanceTurn(roomState, room);            // Turn wechseln
  // ✅ Wenn wir im normalen Spiel sind: sofort würfeln für den neuen aktiven Spieler
  if (roomState.phase === "main") {
    neuerWurf(roomState, map, room);
  }

  emitGameState(io, room, roomState); // sofort aktualisieren
  emitTech(io, room, `SKIP: ${user.username} skipped the turn.`);

});

    socket.on("trade4to1", ({ fromRes, toRes }, cb) => {
      const user = getCurrentUser(socket.id);
      if (!user) return cb?.({ ok: false, error: "no user" });

      const roomState = state[user.room];
      if (!roomState) return cb?.({ ok: false, error: "no roomState" });

      const playerNum = keyByVal(roomState, user.playerId);
      if (!playerNum) return cb?.({ ok: false, error: "no playerNum" });

      fromRes = Number(fromRes);
      toRes = Number(toRes);

      if (
        ![1, 2, 3, 4, 5].includes(fromRes) ||
        ![1, 2, 3, 4, 5].includes(toRes) ||
        fromRes === toRes
      ) {
        return cb?.({ ok: false, error: "bad params", fromRes, toRes });
      }

      const before = {
        from: roomState[playerNum][fromRes],
        to: roomState[playerNum][toRes],
      };

      if (before.from < 4) {
        console.log("[trade] BLOCKED not enough", {
          user: user.username,
          room: user.room,
          playerNum,
          fromRes,
          toRes,
          before,
        });
        emitTech(IO, room, "Not enough resources for 4:1 trade.");
        return cb?.({ ok: false, error: "not enough", before });
      }

      roomState[playerNum][fromRes] -= 4;
      roomState[playerNum][toRes] += 1;

      const after = {
        from: roomState[playerNum][fromRes],
        to: roomState[playerNum][toRes],
      };

      console.log("[trade] OK", {
        user: user.username,
        room: user.room,
        playerNum,
        fromRes,
        toRes,
        before,
        after,
      });

      // sofort pushen
      emitGameState(io, user.room, roomState);

      cb?.({ ok: true, before, after, playerNum, fromRes, toRes });
    });

    // -------- CHAT (global) --------
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
      console.log("[chatMessage] socket", socket.id, "rooms:", Array.from(socket.rooms));
      console.log("[chatMessage] known users socketIds:", Array.from(usersByPlayerId.values()).map(u => ({playerId:u.playerId, socketId:u.socketId, room:u.room, online:u.isOnline})));

      if (!user) return;
      io.to(user.room).emit("message", formatMessage(user.username, msg));

    });

    // -------- HOUSE (global) --------
  socket.on("house", (id) => {
  const user = getCurrentUser(socket.id);
  console.log("[house] socket", socket.id, "rooms:", Array.from(socket.rooms));
  console.log("[house] known users socketIds:", Array.from(usersByPlayerId.values()).map(u => ({playerId:u.playerId, socketId:u.socketId, room:u.room, online:u.isOnline})));

  if (!user) {
    console.log("[house] ignored: no user");
    socket.emit("userError", { text: "Not logged in / no user session." });
    return;
  }

  const res = buildHouse(id, state, user);

  if (res && res.ok === false) {
    socket.emit("userError", { text: res.message });
  }
});

// Einstiegspunkt

socket.on("enter", (payload, cb) => {
  const {
    intent,          // "join" | "create"
    requestedRoom,
    username,
    quantity,
    landscape,
    playerId
  } = payload;

  // 1) playerId existiert?
  const existingUser = usersByPlayerId.get(playerId);

  // 2) User existiert schon
  if (existingUser) {
    const room = existingUser.room;

    // Spiel existiert nicht mehr
    if (!state[room]) {
      cb({ action: "reject", reason: "game_over", session: "clear" });
      return;
    }

    // Spieler gehört zu diesem Room → Rejoin
    if (!existingUser.abandoned) {
      cb({ action: "rejoin", room, session: "keep" });
      return;
    }

    // abandoned → Session ungültig
    cb({ action: "reject", reason: "abandoned", session: "clear" });
    return;
  }

  // 3) Neuer Spieler
  if (intent === "create") {
    cb({ action: "create", room: requestedRoom, session: "keep" });
    return;
  }

  if (intent === "join") {
    if (!state[requestedRoom]) {
      cb({ action: "reject", reason: "no_room", session: "keep" });
      return;
    }
    if (state[requestedRoom].playerCount >= state[requestedRoom].quantity) {
      cb({ action: "reject", reason: "room_full", session: "keep" });
      return;
    }
    cb({ action: "join", room: requestedRoom, session: "keep" });
    return;
  }
});


    // -------- CREATE ROOM --------
    socket.on("createRoom", ({ playerId, username, room, quantity, landscape }) => {
      username = sanitizeUsername(username);
      quantity = clampInt(quantity, 2, MAX_PLAYERS);

      console.log("[createRoom]", { username, room, quantity, landscape });

      
      const res = userJoin(playerId, socket.id, username, room);
      //anmerkung: user.id ist die socket.id während playerId generiert ist für die session, room ist der room name und kein zeiger. 
      // n ist die laufende nummer im state, wird nicht im user gespeichert. 
      if(res.ok === true){

        socket.join(room);
        console.log("[rooms]", socket.id, Array.from(socket.rooms));
        if(res.kind == "new"){

          let user = res.user
          state = createState(user, state, room, Number(quantity));
          map = createMap(map, room, landscape);
    
          socket.emit("back", "start creating room");
          socket.emit(
            "message",
            formatMessage(botName, "Welcome to Sailors & Islands, Creator!")
          );
    
          // ✅ wichtig: Creator bekommt die Map direkt
          socket.emit("init", map[room]);
           io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

          io.to(room).emit(
            "message",
            formatMessage(botName, `${username} created room "${room}"`)
          );
    
          io.to(room).emit("roomUsers", {
            room,
            users: getRoomUsers(room),
          });
    
          emitRooms(io);
        }
      }
      else
      {
        socket.emit("userError", { text: "Already connected in another tab." })
      }
    });

    // -------- JOIN ROOM --------
// joinRoom handler (game.socket.js) – minimal pattern with userJoin {ok, kind, user}

socket.on("joinRoom", ({ playerId, username, room }, cb) => {
  username = sanitizeUsername(username);

  if (!state[room]) {
    cb?.({ ok:false, error:"no_room" });
    return;
  }

  // ✅ 1) ZUERST userJoin
  const res = userJoin(playerId, socket.id, username, room);

  if (!res.ok) {
    cb?.({ ok:false, error: res.reason || "conflict" });
    return;
  }

  const user = res.user;

  // ✅ 2) reconnect darf IMMER rein – auch bei full
  if (res.kind === "reconnect") {
    socket.join(room);
    console.log("[rooms]", socket.id, Array.from(socket.rooms));
    socket.emit("init", map[room]);
    socket.emit("gameState", JSON.stringify(state[room]));
     io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });
    cb?.({ ok:true, kind:"reconnect" });
    return;
  }

  // ✅ 3) nur NEW joins sind kapazitätsrelevant
  if (state[room].playerCount >= state[room].quantity) {
    cb?.({ ok:false, error:"full" });
    return;
  }

  // kind === "new" -> extend + init wie gehabt
  socket.join(room);
  console.log("[rooms]", socket.id, Array.from(socket.rooms));
  checkExtendState(user, state);
  socket.emit("init", map[room]);
   io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });
  if (teamComplete(state[room])) startGameInterval(io, room, map);
  cb?.({ ok:true, kind:"new" });
});


    // -------- DISCONNECT --------
socket.on("leaveRoom", () => {
  const user = getCurrentUser(socket.id);
  if (!user) return;

  const room = user.room;

  markAbandoned(user);
  socket.leave(room);

  io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

  // ✅ NEW: wenn alle im Room abandoned -> room löschen
  const roomUsers = getRoomUsers(room);
  const allAbandoned = roomUsers.length > 0 && roomUsers.every(u => u.abandoned === true);

  if (allAbandoned) {
    cleanupRoom(io, room);
    return;
  }

  emitRooms(io);
});

function cleanupRoom(io, room) {
  if (roomIntervals[room]) {
    clearInterval(roomIntervals[room]);
    delete roomIntervals[room];
  }
  delete state[room];
  delete map[room];
  emitRooms(io);
  console.log("[room] deleted", room);
}

 socket.on("disconnect", () => {
  const user = getCurrentUser(socket.id);
  if (!user) return;

  const room = user.room;   // ✅ WICHTIG

  // Connection lost -> Rejoin möglich
  setOffline(user);

  io.to(room).emit("roomUsers", {
    room,
    users: getRoomUsers(room)
  });

  console.log("[disconnect] OFFLINE", user.username, user.playerId);
});




  });
};

// ================= GAME LOOP =================

function startGameInterval(io, room, map) {
  console.log("[game] start game interval -> active");
  gameActive = true;

  if (!state[room]) return;

  // ✅ NEW: do not start twice
  if (roomIntervals[room]) {
    console.log("[game] interval already running for", room);
    return;
  }

state[room].phase = "setup";

emitTech(IO, room, "MODE: SETUP");

state[room].setupIndex = 0;
state[room].setupBuiltThisTurn = false;
state[room].setupOrder = getSetupOrder(state[room].quantity); // z.B. [1,2,2,1]
state[room].activePlayerNumber = state[room].setupOrder[0];
state[room].Wurf = "Start";
state[room].turnTime = timeGetter();
state[room].timeDif = TURN_SECONDS;



  roomIntervals[room] = setInterval(() => {
  try {
    if (!state[room]) return;

    const result = gameLoop(room, state[room], map);
    if (!result.ended) {
      emitGameState(io, room, state[room]);
    } else {
      emitTech(IO, room, "GAME OVER");
      if (payload.draw) {
        emitTech(io, room, `RESULT: DRAW (${payload.bestPoints} points)`);
      } else {
        const w = payload.winnerNumber;
        const name = state[room]?.[w]?.username || `Player ${w}`;
        emitTech(io, room, `WINNER: ${name} (${payload.bestPoints} points)`);
      }

      emitGameOver(io, room, result.payload);

      clearInterval(roomIntervals[room]);
      delete roomIntervals[room];
    }
  } catch (err) {
    console.error("!!! CRITICAL ERROR IN GAMELOOP !!!", err);
    // Das verhindert, dass der Loop lautlos stirbt
  }
}, 500);
}

function gameLoop(room, roomState, map) {
  if (!roomState) return { ended: false };

  // ✅ NEW: end by rounds
  if (watchForWinner(roomState)) {
    return { ended: true, payload: computeGameOverPayload(roomState) };
  }

  // keep old winner rule (points>=50) for now (doesn't hurt)
function watchForWinner(roomState) {
  for (let i = 1; i <= roomState.playerCount; i++) {
    if (roomState[i]?.points >= WIN_POINTS) return true;
  }
  return false;
}


  const now = timeGetter();
  roomState.timeDif = TURN_SECONDS - (now - roomState.turnTime);

if (roomState.timeDif <= 0) {
  advanceTurn(roomState, room);

  // ✅ nur im MAIN würfeln
  if (roomState.phase === "main") {
    // hier kannst du deine bestehende roundsLeft / neuerWurf Logik lassen
    // oder nur "neuerWurf" callen wie bisher
    neuerWurf(roomState, map, room);
  }

  
}

return { ended: false };
 
}

function roll2to12() {
  return Math.floor(Math.random() * 11) + 2; // 2..12
}

function neuerWurf(roomState, map, room) {
  if (roomState.phase === "setup") {
    roomState.Wurf = "Start";
    return;
  }

  let num = roll2to12();

  if (num === 7) {
    const reroll = roll2to12();
    num = (reroll === 7) ? 7 : reroll;

    // optional tech info
    // emitTech(io, room, reroll === 7 ? "7 confirmed (double roll)" : `7 rerolled to ${num}`);
  }

  roomState.Wurf = num;
  distributeResources(map[room], num, room);
}
// ================= HELPERS FOR SHIP =================
function enoughResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.playerId);
  return (
    state[user.room][n][2] >= 5 &&  // wheat
    state[user.room][n][1] >= 5     // ore
  );
}

function takeResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.playerId);
  state[user.room][n][2] -= 5; // wheat
  state[user.room][n][1] -= 5; // ore
}

// ================= BUILD SHIP =================

function buildShip(id, state, user) {
  const roomState = state[user.room];
  if (!roomState) return { ok: false, message: "Room state not found." };
  if (!gameActive) return { ok: false, message: "Game is not active yet." };

  if (!checkIfPlayerActive(state, user)) {
    return { ok: false, message: "Not your turn." };
  }

  // ✅ SETUP: nur 1 Build pro Zug
  if (roomState.phase === "setup" && roomState.setupBuiltThisTurn) {
    return { ok: false, message: "Setup: only 1 build per turn." };
  }

  if (!checkBuildingPossible(id, state, user)) {
    return { ok: false, message: "You cannot build there (distance rule)." };
  }
  const n = keyByVal(roomState, user.playerId);
  console.log("[ship cost check]", {
    player: user.username,
    n,
    wheat: roomState[n][2],
    ore: roomState[n][1],
    needWheat: 5,
    needOre: 5,
  });

  if (!enoughResourcesShip(state, user)) {
    return { ok: false, message: "Not enough resources for a ship (3 Wheat, 5 Ore)." };
  }

  if (!roomState.net?.[id] || roomState.net[id].value !== 0) {
    return { ok: false, message: "Invalid or occupied location." };
  }

  const number = keyByVal(roomState, user.playerId);
  roomState.net[id].playerNumber = Number(number);
  roomState.net[id].value = 2;
  roomState[number].points += 2;

  takeResourcesShip(state, user);

  // ✅ SETUP: markieren, dass in diesem Zug gebaut wurde
  if (roomState.phase === "setup") {
    roomState.setupBuiltThisTurn = true;
  }

  return { ok: true };
}

// ================= BUILD HOUSE =================

function buildHouse(id, state, user) {
  const roomState = state[user.room];
  if (!roomState) return { ok: false, message: "Room state not found." };

  if (!gameActive) return { ok: false, message: "Game is not active yet." };

  if (!checkIfPlayerActive(state, user)) {
    return { ok: false, message: "Not your turn." };
  }

  // ✅ SETUP: nur 1 Build pro Zug
  if (roomState.phase === "setup" && roomState.setupBuiltThisTurn) {
    return { ok: false, message: "Setup: only 1 build per turn." };
  }

  if (!checkBuildingPossible(id, state, user)) {
    return { ok: false, message: "You cannot build there (distance/connection rule)." };
  }

  if (!enoughResourcesHouse(state, user)) {
    return { ok: false, message: "Not enough resources to build a boat." };
  }

  if (!roomState.net?.[id]) {
    return { ok: false, message: "Invalid build location." };
  }

  if (roomState.net[id].value !== 0) {
    return { ok: false, message: "Cannot build there: already occupied." };
  }

  const number = keyByVal(roomState, user.playerId);
  roomState.net[id].playerNumber = Number(number);
  roomState.net[id].value = 1;
  roomState[number].points++;

  takeResourcesHouse(state, user);

  // ✅ SETUP: markieren, dass in diesem Zug gebaut wurde
  if (roomState.phase === "setup") {
    roomState.setupBuiltThisTurn = true;
  }

  return { ok: true };
}
// ================= HELPERS =================

function checkIfPlayerActive(state, user) {
  const number = keyByVal(state[user.room], user.playerId);
  return state[user.room].activePlayerNumber == number;
}

function takeResourcesHouse(state, user) {
  const n = keyByVal(state[user.room], user.playerId);
  state[user.room][n][3] -= 2;
  state[user.room][n][4] -= 1;
  state[user.room][n][5] -= 2;
}

function enoughResourcesHouse(state, user) {
  const n = keyByVal(state[user.room], user.playerId);
  return (
    state[user.room][n][3] >= 2 &&
    state[user.room][n][4] >= 1 &&
    state[user.room][n][5] >= 2
  );
}

function checkBuildingPossible(id, state, user) {
  const n = keyByVal(state[user.room], user.playerId);
  if (state[user.room][n].points < 2) return true;

  const places = buildingPossible(id);
  return places.some((p) => state[user.room].net[p].playerNumber == n);
}

// ================= STATE =================

function createState(user, state, room, quantity) {
  state[room] = {
    Wurf: 0,
    timeDif: TURN_SECONDS,  // ✅ was 30
    turnTime: 0,
    activePlayerNumber: 1,
    playerCount: 1,
    quantity,

    net: createNet(),
    1: {
      username: sanitizeUsername(user.username),
      socketId: user.socketId,
      playerId: user.playerId,
      1: 5,
      2: 5,
      3: 2,
      4: 2,
      5: 2,
      points: 0,
      color: color(1),
    },
  };
  return state;
}

function checkExtendState(user, state) {
  if (!state[user.room]) return false;
  if (state[user.room].playerCount < state[user.room].quantity) {
    extendState(user, state);
    return true;
  }
  return false;
}
function getSetupOrder(n) {
  const fwd = Array.from({ length: n }, (_, i) => i + 1);
  const bwd = Array.from({ length: n }, (_, i) => n - i);
  return fwd.concat(bwd);
}
function advanceTurn(roomState, room) {
  roomState.turnTime = timeGetter();
  roomState.timeDif = TURN_SECONDS;

  if (roomState.phase === "setup") {
    roomState.setupBuiltThisTurn = false;
    roomState.Wurf = "Start";

    roomState.setupIndex += 1;

    // Setup fertig?
    if (roomState.setupIndex >= roomState.setupOrder.length) {
      roomState.phase = "main";
      emitTech(IO, room, "MODE: MAIN");

      roomState.activePlayerNumber = 1;
      roomState.turnTime = timeGetter();
      roomState.timeDif = TURN_SECONDS;
      return;
    }

    roomState.activePlayerNumber =
      roomState.setupOrder[roomState.setupIndex];

    return;
  }

  // normal game
  roomState.activePlayerNumber =
    (roomState.activePlayerNumber % roomState.quantity) + 1;
}

function extendState(user, state) {
  const room = user.room;

  state[room].playerCount++;
  const n = state[room].playerCount;

  state[room][n] = {
    username: sanitizeUsername(user.username),

    // Identität (stabil für Rejoin)
    playerId: user.playerId,

    // optional (nur Debug/Info; NICHT für Identität verwenden)
    socketId: user.socketId,

    // Ressourcen (1..5) konsistent wie in createState
    1: 5,
    2: 5,
    3: 2,
    4: 2,
    5: 2,

    points: 0,
    color: color(n),
  };
}


function deletePlayerFromState(state, user) {
  if (!state[user.room]) return;
  const n = keyByVal(state[user.room], user.playerId);
  if (n) delete state[user.room][n];
}

function teamComplete(roomState) {
  return roomState.playerCount === roomState.quantity;
}

function watchForWinner(roomState) {
  for (let i = 1; i <= roomState.playerCount; i++) {
    if (roomState[i]?.points >= 50) return true;
  }
  return false;
}

// ✅ NEW: compute end-game winner/draw by points
function computeGameOverPayload(roomState) {
  let best = -Infinity;
  let winners = [];

  for (let i = 1; i <= roomState.playerCount; i++) {
    const p = roomState[i];
    if (!p) continue;
    const pts = Number(p.points || 0);

    if (pts > best) {
      best = pts;
      winners = [i];
    } else if (pts === best) {
      winners.push(i);
    }
  }

  const draw = winners.length !== 1;
  const winnerNumber = draw ? null : winners[0];

  return {
    draw,
    winnerNumber,
    winners,
    bestPoints: best,
  };
}

// ================= UTIL =================

function keyByVal(obj, val) {
  return Object.keys(obj).find((k) => obj[k]?.playerId === val);
}

function timeGetter() {
  return Date.now() / 1000;
}

function createNet() {
  const net = {};
  for (let i = 1; i <= 240; i++) {
    net[i] = { playerNumber: 0, value: 0 };
  }
  return net;
}

function createMap(map, room, landscape) {
  map[room] = {};
  for (let i = 1; i < 144; i++) {
    map[room][i] = algoNormal(); // landscape kann später rein
  }
  return map;
}

function distributeResources(roomMap, num, room) {
  const areas = findAreas(roomMap, num);
  areas.forEach(({ index, res }) => {
    if (res < 6) {
      findPlacesAroundArea(index).forEach((p) => {
        const pn = state[room].net[p].playerNumber;
        if (pn > 0) {
          state[room][pn][res] += state[room].net[p].value;
          emitTech(IO, room, `HARVEST: ${state[room].net[p].value} + ${resName(res)} (roll ${num})`);

        }
      });
    }
  });
}
function resName(res) {
  switch (Number(res)) {
    case 1: return "MUD";
    case 2: return "WHEAT";
    case 3: return "SHEEP";
    case 4: return "WOOD";
    case 5: return "ORE";
    default: return "UNKNOWN";
  }
}

function findAreas(roomMap, num) {
  return Object.entries(roomMap)
    .filter(([, v]) => v.num == num)
    .map(([k, v]) => ({ index: Number(k), res: v.res }));
}

function emitGameState(io, room, gameState) {
  io.to(room).emit("gameState", JSON.stringify(gameState));
}

// ✅ changed: allow object payload (not just {winner})
function emitGameOver(io, room, payload) {
  io.to(room).emit("gameOver", JSON.stringify(payload));
}

function algoNormal() {
  return {
    num: Math.floor(Math.random() * 10 + 2),
    res: Math.floor(Math.random() * 6 + 1),
  };
}

function color(n) {
  return ["red", "green", "blue", "orange", "pink"][n - 1] || "gray";
}
