// backend/src/sockets/game.socket.js

const formatMessage = require("../utils/messages");
const { buildingPossible, findPlacesAroundArea } = require("../utils/netz");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("../utils/users");

const botName = "AutoBot";

// ====== STEP 1 CONFIG (small steps) ======
const TURN_SECONDS = 60;     // ✅ was 30
const TOTAL_ROUNDS = 17;     // ✅ neues Spielziel
const MAX_PLAYERS = 4;       // ✅ cap
const USERNAME_MAX = 12;     // ✅ cap

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

// ---------------- SOCKET REGISTRATION ----------------

module.exports = function registerGameSockets(io) {
  io.on("connection", (socket) => {
    console.log("[socket] connect", socket.id);

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

      const playerNum = keyByVal(roomState, user.id);
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

    socket.on("trade4to1", ({ fromRes, toRes }, cb) => {
      const user = getCurrentUser(socket.id);
      if (!user) return cb?.({ ok: false, error: "no user" });

      const roomState = state[user.room];
      if (!roomState) return cb?.({ ok: false, error: "no roomState" });

      const playerNum = keyByVal(roomState, user.id);
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
        socket.emit(
          "message",
          formatMessage(botName, `Not enough resources for 4:1 trade.`)
        );
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
      if (!user) return;
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    // -------- HOUSE (global) --------
  socket.on("house", (id) => {
  const user = getCurrentUser(socket.id);
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



    // -------- CREATE ROOM --------
    socket.on("createRoom", ({ username, room, quantity, landscape }) => {
      username = sanitizeUsername(username);
      quantity = clampInt(quantity, 2, MAX_PLAYERS);

      console.log("[createRoom]", { username, room, quantity, landscape });

      const user = userJoin(socket.id, username, room);
      socket.join(room);

      state = createState(user, state, room, Number(quantity));
      map = createMap(map, room, landscape);

      socket.emit("back", "start creating room");
      socket.emit(
        "message",
        formatMessage(botName, "Welcome to Sailors & Islands, Creator!")
      );

      // ✅ wichtig: Creator bekommt die Map direkt
      socket.emit("init", map[room]);

      io.to(room).emit(
        "message",
        formatMessage(botName, `${username} created room "${room}"`)
      );

      io.to(room).emit("roomUsers", {
        room,
        users: getRoomUsers(room),
      });

      emitRooms(io);
    });

    // -------- JOIN ROOM --------
    socket.on("joinRoom", ({ username, room }) => {
      username = sanitizeUsername(username);

      console.log("[joinRoom]", { username, room });

      if (!state[room]) {
        console.log("[joinRoom] rejected: room does not exist", room);
        socket.emit(
          "message",
          formatMessage(
            botName,
            `Room "${room}" does not exist (create it first).`
          )
        );
        emitRooms(io);
        return;
      }

      // ✅ NEW: room full reject
      if (state[room].playerCount >= state[room].quantity) {
        console.log("[joinRoom] rejected: room is full", room);
        socket.emit(
          "message",
          formatMessage(botName, `Room "${room}" is full.`)
        );
        emitRooms(io);
        return;
      }

      const user = userJoin(socket.id, username, room);
      socket.join(room);

      const extended = checkExtendState(user, state);
      console.log("[joinRoom] extend state result", extended);

      socket.emit(
        "message",
        formatMessage(botName, "Welcome to Sailors & Islands!")
      );

      // ✅ wichtig: Joiner bekommt die Map
      socket.emit("init", map[room]);

      // bot: joined
      socket.broadcast
        .to(room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the game`)
        );

      io.to(room).emit("roomUsers", {
        room,
        users: getRoomUsers(room),
      });

      console.log(
        "[game] TEAMCHECK:",
        "room=",
        room,
        "playerCount=",
        state[room].playerCount,
        "quantity=",
        state[room].quantity
      );

      emitRooms(io);

      if (teamComplete(state[room])) {
        startGameInterval(io, room, map);
      } else {
        console.log(
          "[game] wait room=",
          room,
          "playerCount=",
          state[room].playerCount,
          "quantity=",
          state[room].quantity
        );
      }
    });

    // -------- DISCONNECT --------
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
      if (!user) {
        console.log("[socket] disconnect unknown", socket.id);
        return;
      }

      console.log("[socket] disconnect", user.username, "room=", user.room);

      deletePlayerFromState(state, user);

      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the game`)
      );

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });

      if (getRoomUsers(user.room).length === 0) {
        console.log("[room] empty -> cleanup", user.room);

        // ✅ NEW: stop interval when room is gone
        if (roomIntervals[user.room]) {
          clearInterval(roomIntervals[user.room]);
          delete roomIntervals[user.room];
        }

        delete state[user.room];
        delete map[user.room];
        console.log("[room] deleted", user.room);
      }

      emitRooms(io);
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

  state[room].turnTime = timeGetter();
  state[room].timeDif = TURN_SECONDS;

  // ✅ NEW: rounds left
  state[room].roundsLeft = TOTAL_ROUNDS;

  roomIntervals[room] = setInterval(() => {
  try {
    if (!state[room]) return;

    const result = gameLoop(room, state[room], map);
    if (!result.ended) {
      emitGameState(io, room, state[room]);
    } else {
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
  if (roomState.roundsLeft <= 0) {
    return { ended: true, payload: computeGameOverPayload(roomState) };
  }

  // keep old winner rule (points>=50) for now (doesn't hurt)
  if (watchForWinner(roomState)) {
    return { ended: true, payload: computeGameOverPayload(roomState) };
  }

  const now = timeGetter();
  roomState.timeDif = TURN_SECONDS - (now - roomState.turnTime);

  if (roomState.timeDif <= 0) {
    const prevActive = roomState.activePlayerNumber;

    roomState.turnTime = timeGetter();
    roomState.activePlayerNumber =
      (roomState.activePlayerNumber % roomState.quantity) + 1;

    // ✅ NEW: rounds tick when we wrap back to player 1
    if (prevActive !== 1 && roomState.activePlayerNumber === 1) {
      roomState.roundsLeft -= 1;
      console.log("[round] roundsLeft =", roomState.roundsLeft);
    }

    neuerWurf(roomState, map, room);
  }

  return { ended: false };
}

function neuerWurf(roomState, map, room) {
  // TOTAL_ROUNDS = 17. Runden 17 und 16 sind die Aufbauphasen.
  // Erst ab Runde 15 (roundsLeft <= 15) wird gewürfelt.
  
  if (roomState.roundsLeft > (TOTAL_ROUNDS - 2)) {
    console.log("[game] Aufbauphase: Kein Wurf in Runde", roomState.roundsLeft);
    roomState.Wurf = "Start"; // Text statt 0 anzeigen
    return; // Funktion abbrechen, keine Ressourcen verteilen
  }

  const num = Math.floor(Math.random() * 11 + 2); // Korrektur: 2-12
  roomState.Wurf = num;
  distributeResources(map[room], num, room);
}
// ================= HELPERS FOR SHIP =================
function enoughResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.id);
  // Kosten laut Wunsch: 3 Weizen (ID 2), 5 Erz (ID 1)
  return (
    state[user.room][n][2] >= 3 && 
    state[user.room][n][1] >= 5
  );
}

function takeResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.id);
  state[user.room][n][2] -= 3; // Weizen abziehen
  state[user.room][n][1] -= 5; // Erz abziehen
}
// ================= HELPERS FOR SHIP =================

function enoughResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.id);
  // Kosten: 3 Weizen (3), 5 Erz (5)
  return (
    state[user.room][n][3] >= 3 &&
    state[user.room][n][5] >= 5
  );
}

function takeResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.id);
  state[user.room][n][3] -= 3;
  state[user.room][n][5] -= 5;
}
// ================= BUILD SHIP =================

function buildShip(id, state, user) {
  const roomState = state[user.room];
  if (!roomState) return { ok: false, message: "Room state not found." };
  if (!gameActive) return { ok: false, message: "Game is not active yet." };

  if (!checkIfPlayerActive(state, user)) {
    return { ok: false, message: "Not your turn." };
  }

  // Nutzt die gleiche Abstandsregel wie das Haus
  if (!checkBuildingPossible(id, state, user)) {
    return { ok: false, message: "You cannot build there (distance rule)." };
  }

  if (!enoughResourcesShip(state, user)) {
    return { ok: false, message: "Not enough resources for a ship (3 Wheat, 5 Ore)." };
  }

  if (!roomState.net?.[id] || roomState.net[id].value !== 0) {
    return { ok: false, message: "Invalid or occupied location." };
  }

  const number = keyByVal(roomState, user.id);
  roomState.net[id].playerNumber = Number(number);
  roomState.net[id].value = 2; // Ein Schiff zählt doppelt bei Ressourcen-Ertrag
  roomState[number].points += 2; // Mehr Punkte für ein großes Objekt

  takeResourcesShip(state, user);

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

  const number = keyByVal(roomState, user.id);
  roomState.net[id].playerNumber = Number(number);
  roomState.net[id].value = 1;
  roomState[number].points++;

  takeResourcesHouse(state, user);

  return { ok: true };
}



// ================= HELPERS =================

function checkIfPlayerActive(state, user) {
  const number = keyByVal(state[user.room], user.id);
  return state[user.room].activePlayerNumber == number;
}

function takeResourcesHouse(state, user) {
  const n = keyByVal(state[user.room], user.id);
  state[user.room][n][3] -= 2;
  state[user.room][n][4] -= 1;
  state[user.room][n][5] -= 2;
}

function enoughResourcesHouse(state, user) {
  const n = keyByVal(state[user.room], user.id);
  return (
    state[user.room][n][3] >= 2 &&
    state[user.room][n][4] >= 1 &&
    state[user.room][n][5] >= 2
  );
}

function checkBuildingPossible(id, state, user) {
  const n = keyByVal(state[user.room], user.id);
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
    roundsLeft: TOTAL_ROUNDS, // ✅ new
    net: createNet(),
    1: {
      username: sanitizeUsername(user.username),
      clientID: user.id,
      1: 10,
      2: 9,
      3: 8,
      4: 7,
      5: 6,
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

function extendState(user, state) {
  const room = user.room;
  state[room].playerCount++;
  const n = state[room].playerCount;

  state[room][n] = {
    username: sanitizeUsername(user.username),
    clientID: user.id,
    1: 10,
    2: 9,
    3: 8,
    4: 7,
    5: 6,
    points: 0,
    color: color(n),
  };
}

function deletePlayerFromState(state, user) {
  if (!state[user.room]) return;
  const n = keyByVal(state[user.room], user.id);
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
  return Object.keys(obj).find((k) => obj[k]?.clientID === val);
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
        }
      });
    }
  });
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
