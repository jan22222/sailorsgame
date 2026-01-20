// backend/public/js/lobby.js
// Renders open games list and allows 1-click join

const socket = io();
const $roomsList = document.getElementById("roomsList");

socket.emit("listRooms");

socket.on("roomsList", (rooms) => {
  renderRooms(rooms);
});

function renderRooms(rooms) {
  if (!$roomsList) return;

  if (!rooms || rooms.length === 0) {
    $roomsList.innerHTML = `<div style="opacity:0.7">No open games right now.</div>`;
    return;
  }

  $roomsList.innerHTML = rooms
    .map((r) => {
      const label = `${escapeHtml(r.room)} (${r.playerCount}/${r.quantity})`;
      return `
        <button class="btn" style="width:100%; text-align:left;"
          data-room="${escapeAttr(r.room)}">
          Join ${label}
        </button>
      `;
    })
    .join("");

  $roomsList.querySelectorAll("button[data-room]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const room = btn.getAttribute("data-room");
      const username = prompt("Your name?");
      if (!username) return;

      // Redirect: settlers.html bekommt params und client.js macht joinRoom automatisch
      const url =
        `settlers.html?mode=join&room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;

      window.location.href = url;
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
