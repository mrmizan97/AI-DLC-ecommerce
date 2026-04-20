import { io } from "socket.io-client";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/api$/, "");

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
