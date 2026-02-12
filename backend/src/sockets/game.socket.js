// backend/src/sockets/game.socket.js

const formatMessage = require("../utils/messages");
const { buildingPossible, findPlacesAroundArea } = require("../utils/netz");
const {
  userJoin,
  getCurrentUser,
  getRoomUsers,
  usersByPlayerId,
  setOffline,
  markAbandoned,
} = require("../utils/users");

let IO = null;
const botName = "AutoBot";

// ===== CONFIG =====
const TURN_SECONDS = 60;
const MAX_PLAYERS = 4;
const USERNAME_MAX = 12;
const WIN_POINTS = 30;

let gameActive = false; // global (später pro room)
let state = {};
let map = {};
const roomIntervals = {}; // room -> intervalId

// ---------------- ROOMS LIST HELPERS ----------------

function getRoomsSnapshot() {
  return Object.entries(state)
    .filter(([room, s]) => s && typeof s === "object")
    .map(([room, s]) => ({
      room,
      playerCount: s.playerCount ?? 0,
      quantity: s.quantity ?? 0,
      joinable:
        !s.gameOver && (s.playerCount ?? 0) < (s.quantity ?? 0), // ✅ joinable false wenn gameOver
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

function emitTech(io, room, msg) {
  if (!io || !room) return;
  io.to(room).emit("tech", msg);
}

function emitTechToSocket(socket, msg) {
  socket.emit("tech", msg);
}

function roomAllUsersOffline(room) {
  const ru = getRoomUsers(room);
  if (!ru || ru.length === 0) return true;
  return ru.every((u) => u.isOnline === false);
}

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

// ✅ single source of truth for game over
function endGame(io, room, payload) {
  if (!state[room]) return;
  if (state[room].gameOver) return; // ✅ prevent double end

  state[room].gameOver = true;
  state[room].gameOverPayload = payload || {};
  state[room].gameOverAt = Date.now();

  emitTech(io, room, "GAME OVER");

  // winner line (tech)
  const p = state[room].gameOverPayload;
  if (p.draw) {
    emitTech(io, room, `RESULT: DRAW (${p.bestPoints ?? "?"} points)`);
  } else {
    const w = p.winnerNumber;
    const name = state[room]?.[w]?.username || `Player ${w ?? "?"}`;
    emitTech(io, room, `WINNER: ${name} (${p.bestPoints ?? "?"} points)`);
  }

  io.to(room).emit("gameOver", JSON.stringify(state[room].gameOverPayload));
  emitRooms(io); // lobby refresh
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
        emitTechToSocket(socket, "ERROR: Not logged in.");
        return;
      }
      if (state[user.room]?.gameOver) {
        emitTechToSocket(socket, "ERROR: Game is over.");
        return;
      }

      const res = buildShip(id, state, user);
      if (res && res.ok === false) {
        emitTechToSocket(socket, `ERROR: ${res.message}`);
      }
    });

    // 4:1 Trade
    socket.on("trade", ({ giveRes, getRes, rate }, cb) => {
      const user = getCurrentUser(socket.id);
      if (!user) return cb?.({ ok: false, error: "no user" });
      if (state[user.room]?.gameOver) return cb?.({ ok: false, error: "game_over" });

      const roomState = state[user.room];
      if (!roomState) return cb?.({ ok: false, error: "no roomState" });

      const playerNum = keyByVal(roomState, user.playerId);
      if (!playerNum) return cb?.({ ok: false, error: "no playerNum" });

      giveRes = Number(giveRes);
      getRes = Number(getRes);
      rate = Number(rate || 4);

      if (
        ![1, 2, 3, 4, 5].includes(giveRes) ||
        ![1, 2, 3, 4, 5].includes(getRes) ||
        giveRes === getRes
      ) {
        return cb?.({ ok: false, error: "bad params", giveRes, getRes, rate });
      }

      const beforeGive = roomState[playerNum][giveRes];
      if (beforeGive < rate) {
        emitTech(IO, user.room, "Not enough resources for trade.");
        return cb?.({ ok: false, error: "not enough" });
      }

      roomState[playerNum][giveRes] -= rate;
      roomState[playerNum][getRes] += 1;

      emitGameState(io, user.room, roomState);
      cb?.({ ok: true });
    });

    // ✅ SKIP
    socket.on("skipTurn", () => {
      const user = getCurrentUser(socket.id);
      if (!user) return;

      const room = user.room;
      const roomState = state[room];
      if (!roomState) return;

      if (roomState.gameOver) {
        emitTechToSocket(socket, "ERROR: Game is over.");
        return;
      }

      const mySlot = keyByVal(roomState, user.playerId);
      if (!mySlot) return;

      if (Number(mySlot) !== Number(roomState.activePlayerNumber)) {
        emitTechToSocket(socket, "ERROR: Not your turn.");
        return;
      }

      advanceTurn(roomState, room);

      if (roomState.phase === "main") {
        neuerWurf(roomState, map, room);
      }

      emitGameState(io, room, roomState);
      emitTech(io, room, `SKIP: ${user.username} skipped the turn.`);
    });

    // 4:1 Trade (simple)
    socket.on("trade4to1", ({ fromRes, toRes }, cb) => {
      const user = getCurrentUser(socket.id);
      if (!user) return cb?.({ ok: false, error: "no user" });
      if (state[user.room]?.gameOver) return cb?.({ ok: false, error: "game_over" });

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

      if (roomState[playerNum][fromRes] < 4) {
        emitTech(IO, user.room, "Not enough resources for 4:1 trade.");
        return cb?.({ ok: false, error: "not enough" });
      }

      roomState[playerNum][fromRes] -= 4;
      roomState[playerNum][toRes] += 1;

      emitGameState(io, user.room, roomState);
      cb?.({ ok: true });
    });

    // -------- CHAT --------
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
      if (!user) return;
      if (state[user.room]?.gameOver) return;

      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    // -------- HOUSE --------
    socket.on("house", (id) => {
      const user = getCurrentUser(socket.id);
      if (!user) {
        emitTechToSocket(socket, "ERROR: Not logged in.");
        return;
      }
      if (state[user.room]?.gameOver) {
        emitTechToSocket(socket, "ERROR: Game is over.");
        return;
      }

      const res = buildHouse(id, state, user);
      if (res && res.ok === false) {
        emitTechToSocket(socket, `ERROR: ${res.message}`);
      }
    });

    // ---------------- ENTER ----------------
    socket.on("enter", (payload, cb) => {
      const { intent, requestedRoom, playerId } = payload;

      // ✅ immediate reject if game over
      if (requestedRoom && state[requestedRoom]?.gameOver) {
        cb?.({
          action: "reject",
          reason: "game_over",
          payload: state[requestedRoom].gameOverPayload || null,
          session: "clear",
        });
        return;
      }

      const existingUser = usersByPlayerId.get(playerId);

      if (existingUser) {
        const room = existingUser.room;

        if (!state[room]) {
          cb({ action: "reject", reason: "game_over", session: "clear" });
          return;
        }

        // ✅ if room is already gameOver -> reject hard
        if (state[room].gameOver) {
          cb({
            action: "reject",
            reason: "game_over",
            payload: state[room].gameOverPayload || null,
            session: "clear",
          });
          return;
        }

        if (!existingUser.abandoned) {
          cb({ action: "rejoin", room, session: "keep" });
          return;
        }

        cb({ action: "reject", reason: "abandoned", session: "clear" });
        return;
      }

      if (intent === "create") {
        cb({ action: "create", room: requestedRoom, session: "keep" });
        return;
      }

      if (intent === "join") {
        if (!state[requestedRoom]) {
          cb({ action: "reject", reason: "no_room", session: "keep" });
          return;
        }
        if (state[requestedRoom].gameOver) {
          cb({
            action: "reject",
            reason: "game_over",
            payload: state[requestedRoom].gameOverPayload || null,
            session: "clear",
          });
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
      console.log("[createRoom] landscape =", landscape);

      const res = userJoin(playerId, socket.id, username, room);
      if (!res.ok) {
        emitTechToSocket(socket, "ERROR: Already connected in another tab.");
        return;
      }

      socket.join(room);

      if (res.kind === "new") {
        const user = res.user;

        state = createState(user, state, room, Number(quantity));
        map = createMap(map, room, landscape);

        socket.emit("message", formatMessage(botName, "Welcome to Sailors & Islands, Creator!"));
        socket.emit("init", map[room]);

        io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

        io.to(room).emit("message", formatMessage(botName, `${username} created room "${room}"`));

        emitRooms(io);
      }
    });

    // -------- JOIN ROOM --------
    socket.on("joinRoom", ({ playerId, username, room }, cb) => {
      username = sanitizeUsername(username);

      if (!state[room]) {
        cb?.({ ok: false, error: "no_room" });
        return;
      }

      // ✅ immediate reject if gameOver
      if (state[room].gameOver) {
        cb?.({ ok: false, error: "game_over", payload: state[room].gameOverPayload || null });
        socket.emit("leave");
        return;
      }

      const res = userJoin(playerId, socket.id, username, room);
      if (!res.ok) {
        cb?.({ ok: false, error: res.reason || "conflict" });
        return;
      }

      const user = res.user;

      // reconnect always allowed (but still block if gameOver handled above)
      if (res.kind === "reconnect") {
        socket.join(room);
        socket.emit("init", map[room]);
        socket.emit("gameState", JSON.stringify(state[room]));
        io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });
        cb?.({ ok: true, kind: "reconnect" });
        return;
      }

      // new join capacity check
      if (state[room].playerCount >= state[room].quantity) {
        cb?.({ ok: false, error: "full" });
        return;
      }

      socket.join(room);
      checkExtendState(user, state);

      socket.emit("init", map[room]);
      io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

      if (teamComplete(state[room])) startGameInterval(io, room, map);

      cb?.({ ok: true, kind: "new" });
    });

    // -------- HARD LEAVE (button) --------
    socket.on("leaveRoom", () => {
      const user = getCurrentUser(socket.id);
      if (!user) return;

      const room = user.room;

      markAbandoned(user);
      socket.leave(room);

      io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

      // ✅ if all abandoned -> delete
      const roomUsers = getRoomUsers(room);
      const allAbandoned = roomUsers.length > 0 && roomUsers.every((u) => u.abandoned === true);
      if (allAbandoned) {
        cleanupRoom(io, room);
        return;
      }

      emitRooms(io);
    });

    // -------- DISCONNECT (soft) --------
    socket.on("disconnect", () => {
      const user = getCurrentUser(socket.id);
      if (!user) return;

      const room = user.room;

      if (state[room]?.gameOver) {
        // nach gameOver ist soft disconnect faktisch "weg"
        markAbandoned(user);
      } else {
        setOffline(user);
      }

      io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

      // ✅ cleanup if gameOver and everyone offline/abandoned
      if (state[room]?.gameOver && roomAllUsersOffline(room)) {
        cleanupRoom(io, room);
      }
        // ✅ NEU: löschen wenn jetzt wirklich alle weg sind (hard ODER soft)
      if (roomAllGone(room)) {
       cleanupRoom(io, room);
       return;
      }
    });
  });
};

// ================= GAME LOOP =================

function startGameInterval(io, room, map) {
  console.log("[game] start game interval -> active");
  gameActive = true;

  if (!state[room]) return;

  if (roomIntervals[room]) {
    console.log("[game] interval already running for", room);
    return;
  }

  // --- SETUP init ---
  state[room].phase = "setup";
  emitTech(io, room, "MODE: SETUP");

  state[room].setupIndex = 0;
  state[room].setupBuiltThisTurn = false;
  state[room].setupOrder = getSetupOrder(state[room].quantity);
  state[room].activePlayerNumber = state[room].setupOrder[0];

  state[room].Wurf = "Start";
  state[room].turnTime = timeGetter();
  state[room].timeDif = TURN_SECONDS;

  roomIntervals[room] = setInterval(() => {
    try {
      if (!state[room]) return;

      // ✅ if already ended, stop interval
      if (state[room].gameOver) {
        clearInterval(roomIntervals[room]);
        delete roomIntervals[room];
        return;
      }

      const result = gameLoop(io, room, state[room], map);

      if (!result || result.ended !== true) {
        emitGameState(io, room, state[room]);
        return;
      }

      // ✅ interval stop is enough; endGame already emitted
      clearInterval(roomIntervals[room]);
      delete roomIntervals[room];
    } catch (err) {
      console.error("!!! CRITICAL ERROR IN GAMELOOP !!!", err);
    }
  }, 500);
}

function gameLoop(io, room, roomState, map) {
  if (!roomState) return { ended: false };

  // ✅ winner check ONCE
  if (watchForWinner(roomState)) {
    const payload = computeGameOverPayload(roomState);
    endGame(io, room, payload);
    return { ended: true, payload };
  }

  const now = timeGetter();
  roomState.timeDif = TURN_SECONDS - (now - roomState.turnTime);

  if (roomState.timeDif <= 0) {
    advanceTurn(roomState, room);

    if (roomState.phase === "main") {
      neuerWurf(roomState, map, room);
    }
  }

  return { ended: false };
}

function roll2to12() {
  return Math.floor(Math.random() * 11) + 2;
}

function neuerWurf(roomState, map, room) {
  if (roomState.phase === "setup") {
    roomState.Wurf = "Start";
    return;
  }

  let num = roll2to12();

  // reduce 7
  if (num === 7) {
    const reroll = roll2to12();
    num = reroll === 7 ? 7 : reroll;
  }

  roomState.Wurf = num;
  distributeResources(map[room], num, room);
}

// ================= BUILDING =================

function enoughResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.playerId);
  return (
    state[user.room][n][2] >= 5 && // wheat
    state[user.room][n][1] >= 5 && // ore
    state[user.room][n][3] >= 2 &&
    state[user.room][n][4] >= 1 &&
    state[user.room][n][5] >= 2
  );
}

function takeResourcesShip(state, user) {
  const n = keyByVal(state[user.room], user.playerId);
  state[user.room][n][2] -= 5;
  state[user.room][n][1] -= 5;
  state[user.room][n][3] -= 2;
  state[user.room][n][4] -= 1;
  state[user.room][n][5] -= 2;
}

function buildShip(id, state, user) {
  const roomState = state[user.room];
  if (!roomState) return { ok: false, message: "Room state not found." };
  if (!gameActive) return { ok: false, message: "Game is not active yet." };
  if (roomState.gameOver) return { ok: false, message: "Game is over." };

  if (!checkIfPlayerActive(state, user)) {
    return { ok: false, message: "Not your turn." };
  }

  if (roomState.phase === "setup" && roomState.setupBuiltThisTurn) {
    return { ok: false, message: "Setup: only 1 build per turn." };
  }

  if (!checkBuildingPossible(id, state, user)) {
    return { ok: false, message: "You cannot build there (distance rule)." };
  }

  if (!enoughResourcesShip(state, user)) {
    return { ok: false, message: "Not enough resources for a ship." };
  }

  if (!roomState.net?.[id] || roomState.net[id].value !== 0) {
    return { ok: false, message: "Invalid or occupied location." };
  }

  const number = keyByVal(roomState, user.playerId);
  roomState.net[id].playerNumber = Number(number);
  roomState.net[id].value = 2;
  roomState[number].points += 2;

  takeResourcesShip(state, user);

  if (roomState.phase === "setup") roomState.setupBuiltThisTurn = true;

  return { ok: true };
}

function buildHouse(id, state, user) {
  const roomState = state[user.room];
  if (!roomState) return { ok: false, message: "Room state not found." };
  if (!gameActive) return { ok: false, message: "Game is not active yet." };
  if (roomState.gameOver) return { ok: false, message: "Game is over." };

  if (!checkIfPlayerActive(state, user)) {
    return { ok: false, message: "Not your turn." };
  }

  if (roomState.phase === "setup" && roomState.setupBuiltThisTurn) {
    return { ok: false, message: "Setup: only 1 build per turn." };
  }

  if (!checkBuildingPossible(id, state, user)) {
    return { ok: false, message: "You cannot build there (distance/connection rule)." };
  }

  if (!enoughResourcesHouse(state, user)) {
    return { ok: false, message: "Not enough resources to build a house." };
  }

  if (!roomState.net?.[id]) return { ok: false, message: "Invalid build location." };
  if (roomState.net[id].value !== 0) return { ok: false, message: "Already occupied." };

  const number = keyByVal(roomState, user.playerId);
  roomState.net[id].playerNumber = Number(number);
  roomState.net[id].value = 1;
  roomState[number].points += 1;

  takeResourcesHouse(state, user);

  if (roomState.phase === "setup") roomState.setupBuiltThisTurn = true;

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
  return state[user.room][n][3] >= 2 && state[user.room][n][4] >= 1 && state[user.room][n][5] >= 2;
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
    timeDif: TURN_SECONDS,
    turnTime: 0,
    activePlayerNumber: 1,
    playerCount: 1,
    quantity,

    phase: "lobby",
    gameOver: false,
    gameOverPayload: null,

    net: createNet(),
    1: {
      username: sanitizeUsername(user.username),
      socketId: user.socketId,
      playerId: user.playerId,
      1: 5,
      2: 5,
      3: 4,
      4: 4,
      5: 4,
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

    if (roomState.setupIndex >= roomState.setupOrder.length) {
      roomState.phase = "main";
      emitTech(IO, room, "MODE: MAIN");
      roomState.activePlayerNumber = 1;
      roomState.turnTime = timeGetter();
      roomState.timeDif = TURN_SECONDS;
      return;
    }

    roomState.activePlayerNumber = roomState.setupOrder[roomState.setupIndex];
    return;
  }

  roomState.activePlayerNumber = (roomState.activePlayerNumber % roomState.quantity) + 1;
}

function extendState(user, state) {
  const room = user.room;

  state[room].playerCount++;
  const n = state[room].playerCount;

  state[room][n] = {
    username: sanitizeUsername(user.username),
    playerId: user.playerId,
    socketId: user.socketId,

    1: 5,
    2: 5,
    3: 4,
    4: 4,
    5: 4,

    points: 0,
    color: color(n),
  };
}

function teamComplete(roomState) {
  return roomState.playerCount === roomState.quantity;
}

function watchForWinner(roomState) {
  for (let i = 1; i <= roomState.playerCount; i++) {
    if (roomState[i]?.points >= WIN_POINTS) return true;
  }
  return false;
}

function computeGameOverPayload(roomState) {
  let best = -Infinity;
  let winners = [];

  const scores = [];
  for (let i = 1; i <= roomState.playerCount; i++) {
    const p = roomState[i];
    if (!p) continue;

    const pts = Number(p.points || 0);
    const name = p.username || `P${i}`;

    scores.push({ n: i, name, points: pts });

    if (pts > best) {
      best = pts;
      winners = [i];
    } else if (pts === best) {
      winners.push(i);
    }
  }

  // sort for display
  scores.sort((a, b) => b.points - a.points || a.n - b.n);

  const draw = winners.length !== 1;
  const winnerNumber = draw ? null : winners[0];

  return {
    draw,
    winnerNumber,
    winners,
    winnerNames: winners.map((n) => roomState[n]?.username || `P${n}`),
    bestPoints: best,
    scores, // ✅ NEW: full scoreboard
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

  const gen = getLandscapeGenerator(landscape);

  for (let i = 1; i < 144; i++) {
    map[room][i] = gen(i);   // ✅ landscape wird jetzt angewendet
  }
  return map;
}

function getLandscapeGenerator(landscape) {
  const key = String(landscape || "normal").toLowerCase();
  console.log("erzeugen landscape" + key)
  switch (key) {
    case "rich":
      return algoRich;
    case "desert":
      return algoDesert;
    case "island":
      return algoIsland;
    case "normal":
    default:
      return algoNormal;
  }
}

function algoNormal() {
  return {
    num: Math.floor(Math.random() * 10 + 2),
    res: Math.floor(Math.random() * 6 + 1),
  };
}
function algoRich() {
  // weighted pick helper (lokal, damit du nichts anderes anlegen musst)
  function pickWeighted(list) {
    let total = 0;
    for (const it of list) total += it.w;
    let r = Math.random() * total;
    for (const it of list) {
      r -= it.w;
      if (r <= 0) return it.v;
    }
    return list[list.length - 1].v;
  }

  // 🎲 Zahlen: selten 2,3,11,12 – häufig 6 & 8
  const num = pickWeighted([
    { v: 2,  w: 1 },
    { v: 3,  w: 1 },
    { v: 4,  w: 3 },
    { v: 5,  w: 4 },
    { v: 6,  w: 9 },  // 🔥
    { v: 8,  w: 9 },  // 🔥
    { v: 9,  w: 4 },
    { v: 10, w: 3 },
    { v: 11, w: 1 },
    { v: 12, w: 1 },
  ]);

  // 🌍 Ressourcen: kaum Wüste/Wasser (ich nehme an: res=6 ist "desert/empty")
  // Falls bei dir Wasser ein anderer res-code ist, sag kurz welchen — dann passe ich nur diese Zeile an.
  const res = pickWeighted([
    { v: 1, w: 6 }, // MUD
    { v: 2, w: 7 }, // WHEAT
    { v: 3, w: 7 }, // SHEEP
    { v: 4, w: 7 }, // WOOD
    { v: 5, w: 7 }, // ORE
    { v: 6, w: 1 }, // DESERT/EMPTY (rare)
  ]);

  return { num, res };
}
// Desert: mehr "leer" (res=6) + etwas weniger hohe Zahlen (optional)
function algoDesert() {
  console.log("desert")
  const desertChance = 0.25; // 25% leer
  const isDesert = Math.random() < desertChance;

  return {
    num: Math.floor(Math.random() * 10 + 2),
    res: isDesert ? 7 : Math.floor(Math.random() * 5 + 1), // 1..5 Ressourcen, 6=leer
  };
}

// Island: z.B. mehr wood/sheep (nur als Beispiel)
function algoIsland() {
  // weights: [mud,wheat,sheep,wood,ore,empty]
  const weights = [1, 1, 2, 3, 1, 0.2];
  const res = weightedPick(weights) + 1; // -> 1..6

  return {
    num: Math.floor(Math.random() * 10 + 2),
    res,
  };
}

function weightedPick(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}


function distributeResources(roomMap, num, room) {
  const areas = findAreas(roomMap, num);
  areas.forEach(({ index, res }) => {
    if (res < 6) {
      findPlacesAroundArea(index).forEach((p) => {
        const pn = state[room].net[p].playerNumber;
        if (pn > 0) {
          const gain = state[room].net[p].value;
          state[room][pn][res] += gain;
          emitTech(IO, room, `HARVEST: +${gain} ${resName(res)} (roll ${num})`);
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

function algoNormal() {
  return {
    num: Math.floor(Math.random() * 10 + 2),
    res: Math.floor(Math.random() * 6 + 1),
  };
}

function color(n) {
  return ["red", "green", "blue", "orange", "pink"][n - 1] || "gray";
}

function roomAllGone(room) {
  const roomUsers = getRoomUsers(room);

  // Edge-case: keine User mehr (z.B. nach cleanup aus usersByPlayerId)
  if (!roomUsers || roomUsers.length === 0) return true;

  // ✅ "egal welcher leave": abandoned ODER offline zählt als weg
  return roomUsers.every(u => u && (u.abandoned === true || u.isOnline === false));
}
