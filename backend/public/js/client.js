// public/js/client.js

let lastTurnPlayer = null;

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

// 1) URL params ZUERST
const params = Qs.parse(location.search, { ignoreQueryPrefix: true });
const username = params.username || "anon";
const room = params.room || "room1";
const quantity = params.quantity;     // nur bei create vorhanden
const landscape = params.landscape || "normal";
const isCreate = quantity !== undefined && quantity !== null && quantity !== "";

// 2) socket erstellen
const socket = io();
window.socket = socket;

// 3) enter erst JETZT senden
socket.emit("enter", {
  intent: isCreate ? "create" : "join",
  requestedRoom: room,
  username,
  quantity,
  landscape,
  playerId,
}, (res) => {
  if (res.session === "clear") sessionStorage.removeItem("playerId");

  if (res.action === "reject") {
    alert(res.reason);
    location.href = "index.html";
    return;
  }

  if (res.action === "rejoin") {
    socket.emit("joinRoom", { playerId, room: res.room, username });
    return;
  }

  if (res.action === "create") {
    socket.emit("createRoom", { playerId, room, username, quantity: Number(quantity), landscape });
    return;
  }

  if (res.action === "join") {
    socket.emit("joinRoom", { playerId, room: res.room, username });
  }
});

const chatMessages = document.querySelector(".chat-messages");

// Map cache
let mapCache = null;

// listeners
socket.on("init", handleInit);
// ...
function handleInit(map) {
  console.log("[client] INIT received", map ? Object.keys(map).length : map);
  mapCache = map;                 // ✅ WICHTIG
  window.setupCanvas(map);
}



// --- game render ---
function handleGameState(gameState) {
  const state = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(state));
}

function paintGame(state) {
  // RESET board every tick (simple but reliable)
  if (mapCache) window.setupCanvas(mapCache);

  // UI values
  app.$data.time = Math.floor(state.timeDif);
  app.$data.recPlayer = state.activePlayerNumber;
  const names = app.$data.userlisto.map(u => u.username);
const activeName = names[state.activePlayerNumber - 1] || "";
if (activeName && activeName !== lastTurnPlayer) {
  lastTurnPlayer = activeName;
  showTurnToast(activeName);
}

  app.$data.Wurf = state.Wurf;

  // eigene playerNumber bestimmen
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
    playerCount: state.playerCount,
    ids: Array.from({ length: state.playerCount || 0 }, (_, k) => ({
      n: k + 1,
      clientID: state[k + 1]?.clientID,
      username: state[k + 1]?.username
    }))
  });
  return;
}


  if (!slotId) return;

  app.$data.usernumber = slotId;
  console.log("[paint] my res", {
  metals: state[slotId][1],
  grains: state[slotId][2],
  mud: state[slotId][3],
  sheep: state[slotId][4],
  wood: state[slotId][5],
});
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
  const placeId = window.getSelectedPlaceId();
  if (!placeId) {
    console.log("No place selected");
    return;
  }
  socket.emit("house", placeId);
}
function trade4to1(fromRes, toRes) {
  socket.emit("trade4to1", { fromRes, toRes }, (res) => {
    console.log("[trade ACK]", res);
  });
}
window.trade4to1 = trade4to1;

window.buildSelectedHouse = buildSelectedHouse;

// ✅ compatibility: alte Vue/HTML calls
window.houseBuild = buildSelectedHouse;

// --- chat ---
function chatten(e) {
  let msg = e.target.elements.msg.value;
  msg = msg.trim();
  if (!msg) return;

  socket.emit("chatMessage", msg);
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
}
window.chatten = chatten;

// Output message to DOM
function outputMessage(message) {
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

  document.querySelector(".chat-messages").appendChild(div);
}

// GameOver (optional)
function handleGameOver(data) {
  try {
    JSON.parse(data);
  } catch {}
  alert("Game Over");
}
// --- build Ship from UI button (+) ---
function buildSelectedShip() {
  const placeId = window.getSelectedPlaceId(); // Nutzt die existierende Logik vom Board
  if (!placeId) {
    alert("Bitte wähle zuerst einen Bauplatz auf der Karte aus!");
    return;
  }
  socket.emit("ship", placeId);
  console.log("[client] Requesting Ship at:", placeId);
}
function showTurnToast(name) {
  const el = document.getElementById("turnToast");
  if (!el) return;

  el.innerHTML = `${name}<span class="sub">ist am Zug</span>`;
  el.classList.add("show");

  clearTimeout(showTurnToast._t);
  showTurnToast._t = setTimeout(() => el.classList.remove("show"), 1200);
}
// Global verfügbar machen für Vue
window.shipBuild = buildSelectedShip;