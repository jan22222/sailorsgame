// public/js/client.js

let lastTurnPlayer = null;
let inGame = false;          // ✅ Aktionen erst nach init erlauben
let mapCache = null;         // Map cache

function getOrCreatePlayerId() {
  let playerId = sessionStorage.getItem("playerId");
  console.log("playerId gefunden?", playerId);
  if (!playerId) {
    playerId = crypto.randomUUID();
    sessionStorage.setItem("playerId", playerId);
    console.log("playerId neu erstellt", playerId);
  }
  return playerId;
}

const playerId = getOrCreatePlayerId();

// 1) URL params
const params = Qs.parse(location.search, { ignoreQueryPrefix: true });
const username = params.username || "anon";
const room = params.room || "room1";
const quantity = params.quantity;           // nur bei create vorhanden
const landscape = params.landscape || "normal";
const isCreate = quantity !== undefined && quantity !== null && quantity !== "";

// 2) socket erstellen
const socket = io({ autoConnect: true });
window.socket = socket;

// ✅ Listener VOR connect/enter registrieren
socket.on("init", handleInit);
socket.on("gameState", handleGameState);

socket.on("gameOver", handleGameOver);

socket.on("message", (message) => {
  console.log("[client] got message", message);
  outputMessage(message);
  const chatMessages = document.querySelector(".chat-messages");
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("userError", (e) => {
  techLog(toEnglishError(e), "error");
});
socket.on("error", (e) => {
  techLog(toEnglishError(e), "error");
});
// 3) enter-flow als Funktion (wird bei jedem connect benutzt)
function runEnterFlow() {
  console.log("[client] runEnterFlow", { socketId: socket.id, playerId, username, room, isCreate });

  socket.emit(
    "enter",
    {
      intent: isCreate ? "create" : "join",
      requestedRoom: room,
      username,
      quantity,
      landscape,
      playerId,
    },
    (res) => {
      console.log("[client] enter cb", res);

      if (res?.session === "clear") sessionStorage.removeItem("playerId");

      if (res?.action === "reject") {
        alert(res.reason);
        location.href = "index.html";
        return;
      }

      if (res?.action === "rejoin") {
        socket.emit("joinRoom", { playerId, room: res.room, username });
        return;
      }

      if (res?.action === "create") {
        socket.emit("createRoom", {
          playerId,
          room,
          username,
          quantity: Number(quantity),
          landscape,
        });
        return;
      }

      if (res?.action === "join") {
        socket.emit("joinRoom", { playerId, room: res.room, username });
      }
    }
  );
}

// ✅ WICHTIG: bei JEDEM connect enter erneut starten
socket.on("connect", () => {
  console.log("[client] CONNECT socket.id =", socket.id);
  inGame = false;          // bis init wieder da ist
  runEnterFlow();
});

// optional: debug
socket.on("disconnect", (reason) => {
  console.log("[client] DISCONNECT", reason);
  inGame = false;
});
socket.on("tech", (msg) => {
  techLog(String(msg));
});
socket.on("tech", (msg) => {
  if (Array.isArray(msg)) msg.forEach(m => techLog(String(m)));
  else techLog(String(msg));
});

socket.on("roomUsers", ({ room, users }) => {
  console.log("[client] roomUsers", room, users);
  app.$data.room = room;
  app.$data.userlisto = users;   // Vue rendert daraus die Namen
});
socket.on("skipTurn", () => {
  const user = getCurrentUser(socket.id);
  if (!user) return;

  const room = user.room;

  const roomState = state[room];
  if (!roomState) return;

  roomState.turnTime = timeGetter();
  roomState.activePlayerNumber =
    (roomState.activePlayerNumber % roomState.quantity) + 1;

  io.to(room).emit("roomUsers", {
    room,
    users: getRoomUsers(room),
  });
});
// --- canvas init ---
function handleInit(map) {
  console.log("[client] INIT received", map ? Object.keys(map).length : map);
  mapCache = map;
  inGame = true;                 // ✅ ab jetzt darf man bauen/chatten
  window.setupCanvas(map);
}

// --- game render ---
function handleGameState(gameState) {
  const state = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(state));
}

function paintGame(state) {
  // UI values
  app.$data.time = Math.floor(state.timeDif);
  app.$data.recPlayer = state.activePlayerNumber;

  // ✅ Turn-Name stabil aus STATE, nicht aus userlisto
  const activeName = state[state.activePlayerNumber]?.username || "";
  if (activeName && activeName !== lastTurnPlayer) {
    lastTurnPlayer = activeName;
    showTurnToast(activeName);
  }

  app.$data.Wurf = state.Wurf;

  // eigene slotId bestimmen (per playerId)
  const slotId = (() => {
    const pc = Number(state.playerCount || 0);
    for (let i = 1; i <= pc; i++) {
      if (state[i]?.playerId === playerId) return String(i);
    }
    return null;
  })();

  if (!slotId) {
    console.log("[paint] slotId NOT FOUND", {
      socketId: socket.id,
      playerId,
      playerCount: state.playerCount,
    });
    return;
  }

  app.$data.usernumber = slotId;

  // Ressourcen
  app.$data.erz = state[slotId][1];
  app.$data.weizen = state[slotId][2];
  app.$data.lehm = state[slotId][3];
  app.$data.schaf = state[slotId][4];
  app.$data.holz = state[slotId][5];
  app.$data.points = state[slotId].points;

  // Gebäude zeichnen
  for (let placeId = 1; placeId <= 240; placeId++) {
    const cell = state.net?.[placeId];
    if (!cell) continue;

    if (cell.value === 1) {
      const owner = cell.playerNumber;
      const color = state[owner]?.color || "gray";
      window.drawHouse(color, placeId);
    } else if (cell.value === 2) {
      const owner = cell.playerNumber;
      const color = state[owner]?.color || "gray";
      window.drawVilla(color, placeId);
    }
  }
}

// --- build from UI button (+) ---
function buildSelectedHouse() {
  if (!inGame) return console.warn("[client] build blocked: not inGame yet");
  const placeId = window.getSelectedPlaceId();
  if (!placeId) return console.log("No place selected");
  socket.emit("house", placeId);
}
window.buildSelectedHouse = buildSelectedHouse;
window.houseBuild = buildSelectedHouse;

function buildSelectedShip() {
  if (!inGame) return console.warn("[client] ship blocked: not inGame yet");
  const placeId = window.getSelectedPlaceId();
  if (!placeId) return alert("Bitte wähle zuerst einen Bauplatz!");
  socket.emit("ship", placeId);
}
window.shipBuild = buildSelectedShip;

function trade4to1(fromRes, toRes) {
  if (!inGame) return;
  socket.emit("trade4to1", { fromRes, toRes }, (res) => {
    console.log("[trade ACK]", res);
  });
}
window.trade4to1 = trade4to1;

// --- chat ---
function chatten(e) {
  if (!inGame) return console.warn("[client] chat blocked: not inGame yet");
  let msg = e.target.elements.msg.value.trim();
  if (!msg) return;
  socket.emit("chatMessage", msg);
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
}
window.chatten = chatten;

function outputMessage(message) {
  const box = document.querySelector(".chat-messages");
  if (!box) return console.warn("[chat] .chat-messages not found");

  const div = document.createElement("div");
  div.classList.add("message");

  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);

  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);

  box.appendChild(div);
}

function handleGameOver(data) {
  try { JSON.parse(data); } catch {}
  alert("Game Over");
}

function showTurnToast(name) {
  const el = document.getElementById("turnToast");
  if (!el) return;
  el.innerHTML = `${name}<span class="sub">ist am Zug</span>`;
  el.classList.add("show");
  clearTimeout(showTurnToast._t);
  showTurnToast._t = setTimeout(() => el.classList.remove("show"), 1200);
}

function techLog(message, kind = "error") {
  const box = document.getElementById("techLog");
  if (!box) return console.log("[techLog missing]", message);

  const ts = new Date().toLocaleTimeString();
  const row = document.createElement("div");
  row.className = "row";

  const tsEl = document.createElement("div");
  tsEl.className = "ts";
  tsEl.textContent = ts;

  const kindEl = document.createElement("div");
  kindEl.className = `kind ${kind}`;
  kindEl.textContent = kind.toUpperCase();

  const msgEl = document.createElement("div");
  msgEl.className = "msg";
  msgEl.textContent = String(message);

  row.appendChild(tsEl);
  row.appendChild(kindEl);
  row.appendChild(msgEl);

  box.appendChild(row);
  box.scrollTop = box.scrollHeight;

  // optional: nicht unendlich wachsen
  const MAX = 80;
  while (box.children.length > MAX) box.removeChild(box.firstChild);
}

// deutsche/unklare server-texte -> englische, technische messages
function toEnglishError(e) {
  const raw = (e && (e.text || e.message || e.reason)) ? String(e.text || e.message || e.reason) : "Unknown error";

  const map = {
    "Not logged in.": "Not authenticated (no user session on server).",
    "Not your turn.": "Action rejected: not your turn.",
    "Room state not found.": "Room state missing on server (state[room] not found).",
    "Game is not active yet.": "Game not active yet (waiting for players/start).",
    "Invalid or occupied location.": "Invalid build location or already occupied.",
    "You cannot build there (distance rule).": "Build blocked by distance/connection rule.",
    "You cannot build there (distance/connection rule).": "Build blocked by distance/connection rule.",
    "Not enough resources to build a boat.": "Not enough resources to build a house.",
    "Not enough resources for a ship (3 Wheat, 5 Ore).": "Not enough resources for a ship.",
  };

  return map[raw] || raw;
}
