const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.user;

    socket.join(`user_${id}`);
    if (role === "admin") {
      socket.join("admins");
    }

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket(httpServer) first.");
  }
  return io;
}

function emitToAdmins(event, payload) {
  if (!io) return;
  io.to("admins").emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToAdmins, emitToUser };
