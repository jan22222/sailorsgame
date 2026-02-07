// backend/src/utils/users.js

/**
 * Single source of truth:
 * playerId -> user
 */
const usersByPlayerId = new Map();

/**
 * Helper: iterate values
 */
function allUsers() {
  return Array.from(usersByPlayerId.values());
}

function sanitizeUsername(name) {
  return String(name || "Player").trim();
}

function setOnline(user, socketId) {
  user.isOnline = true;
  user.socketId = socketId;
  user.lastSeen = Date.now();
}

function setOffline(user) {
  user.isOnline = false;
  user.lastSeen = Date.now();
  user.socketId = null;
}

function markAbandoned(user) {
  user.abandoned = true;
  // abandoned heißt: absichtlich raus, also nicht online
  setOffline(user);
}

/**
 * Upsert (1 user per playerId)
 * Returns:
 *  - { ok:true, kind:"new"|"reconnect", user }
 *  - { ok:false, reason:"already_online", user }
 */
function userJoin(playerId, socketId, username, room) {
  username = sanitizeUsername(username);

  let user = usersByPlayerId.get(playerId);

  // NEW
  if (!user) {
    user = {
      playerId,
      socketId,
      username,
      room,
      isOnline: true,
      abandoned: false,
      lastSeen: Date.now(),
    };
    usersByPlayerId.set(playerId, user);
    return { ok: true, kind: "new", user };
  }

  // CONFLICT: same playerId already online somewhere
  if (user.isOnline === true) {
    return { ok: false, reason: "already_online", user };
  }

  // RECONNECT (was offline)
  user.username = username;
  user.room = room;
  // abandoned NICHT automatisch zurücksetzen
  setOnline(user, socketId);

  return { ok: true, kind: "reconnect", user };
}

/**
 * Find user by current socketId
 */
function getCurrentUser(socketId) {
  return allUsers().find(u => u.socketId === socketId);
}

/**
 * Soft disconnect:
 * does NOT delete user, only sets offline
 */
function userLeave(socketId) {
  const user = getCurrentUser(socketId);
  if (!user) return undefined;

  setOffline(user);
  return user;
}

/**
 * Room users (online + offline)
 */
function getRoomUsers(room) {
  return allUsers().filter(u => u.room === room);
}

/**
 * Lookup by playerId
 */
function getUserByPlayerId(playerId) {
  return usersByPlayerId.get(playerId);
}

module.exports = {
  // main API (keep names stable)
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
};

