const { Server } = require("socket.io");

let io = null;

/**
 * Initialize Socket.io on the HTTP server
 * @param {import("http").Server} httpServer
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  io.on("connection", (socket) => {
    // Client connected
    socket.on("disconnect", (reason) => {
      // Client disconnected
    });
  });

  console.log("⚡ [Socket.io]: Real-time WebSocket server initialized successfully");
  return io;
}

/**
 * Get active io instance
 */
function getIO() {
  return io;
}

/**
 * Broadcast helper functions
 */
function emitReservationEvent(action, payload) {
  if (!io) return;
  // Specific event e.g. "reservation:created", "reservation:cancelled"
  io.emit(`reservation:${action}`, { action, data: payload, timestamp: new Date().toISOString() });
  // General event for dashboards
  io.emit("system:happening", { module: "reservations", action, data: payload });
}

function emitTransactionEvent(action, payload) {
  if (!io) return;
  io.emit(`transaction:${action}`, { action, data: payload, timestamp: new Date().toISOString() });
  io.emit("system:happening", { module: "transactions", action, data: payload });
}

function emitBookEvent(action, payload) {
  if (!io) return;
  io.emit(`book:${action}`, { action, data: payload, timestamp: new Date().toISOString() });
  io.emit("system:happening", { module: "books", action, data: payload });
}

function emitAnnouncementEvent(action, payload) {
  if (!io) return;
  io.emit(`announcement:${action}`, { action, data: payload, timestamp: new Date().toISOString() });
  io.emit("system:happening", { module: "announcements", action, data: payload });
}

module.exports = {
  initSocket,
  getIO,
  emitReservationEvent,
  emitTransactionEvent,
  emitBookEvent,
  emitAnnouncementEvent
};
