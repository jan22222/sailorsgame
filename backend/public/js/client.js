// public/js/client.js
// Socket client for Sailors & Islands (local backend)

let lastTurnPlayer = null;

function showTurnToast(name) {
  const el = document.getElementById("turnToast");
  if (!el) return;

  el.innerHTML = `${name}<span class="sub">ist am Zug</span>`;
  el.classList.add("show");

  clearTimeout(showTurnToast._t);
  showTurnToast._t = setTimeout(() => el.classList.remove("show"), 1200);
}

const chatMessages = document.querySelector(".chat-messages");

// URL params
const params = Qs.parse(location.search, { ignoreQueryPrefix: true });
const username = params.username || "anon";
const room = params.room || "room1";
const quantity = params.quantity;     // nur bei create vorhanden
const landscape = params.landscape || "normal";

// ✅ lokal verbinden (gleicher Host/Port)
const socket = io();
window.socket = socket;

// Map cache (für redraw)
let mapCache = null;

// --- socket listeners ---
socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);

socket.on("leave", () => (window.location = "../index.html"));

socket.on("roomUsers", ({ room, users }) => {
  app.$data.room = room;
  app.$data.userlisto = users;
});

socket.on("back", (msg) => console.log("BACK:", msg));

socket.on("message", (message) => {
  outputMessage(message);
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
});

// --- join/create (robust) ---
const isCreate = quantity !== undefined && quantity !== null && quantity !== "";

if (!isCreate) {
  console.log("joinRoom", { username, room });
  socket.emit("joinRoom", { username, room });
} else {
  console.log("createRoom", { username, room, quantity, landscape });
  socket.emit("createRoom", {
    username,
    room,
    quantity: Number(quantity),
    landscape
  });
}

// --- canvas init ---
function handleInit(map) {
  console.log("[client] INIT received", map ? Object.keys(map).length : map);
  const $meta = document.getElementById("debugMeta");
  if ($meta) $meta.textContent = "INIT received (map)";
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
  const myNumber = (() => {
  const pc = Number(state.playerCount || 0);
  for (let i = 1; i <= pc; i++) {
    if (state[i]?.clientID === socket.id) return String(i);
  }
  return null;
})();
if (!myNumber) {
  console.log("[paint] myNumber NOT FOUND", {
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


  if (!myNumber) return;

  app.$data.usernumber = myNumber;
  console.log("[paint] my res", {
  metals: state[myNumber][1],
  grains: state[myNumber][2],
  mud: state[myNumber][3],
  sheep: state[myNumber][4],
  wood: state[myNumber][5],
});
  // Ressourcen
  app.$data.erz = state[myNumber][1];
  app.$data.weizen = state[myNumber][2];
  app.$data.lehm = state[myNumber][3];
  app.$data.schaf = state[myNumber][4];
  app.$data.holz = state[myNumber][5];
  app.$data.points = state[myNumber].points;

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

// Global verfügbar machen für Vue
window.shipBuild = buildSelectedShip;