const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// static files
app.use(express.static(path.join(__dirname, "../public")));

// sanity check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

require("./sockets/game.socket")(io);

// ✅ WICHTIG
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log("Backend running on", PORT);
});
