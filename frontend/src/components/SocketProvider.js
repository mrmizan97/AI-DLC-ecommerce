"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export default function SocketProvider({ children }) {
  const { user, token } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.add);

  useEffect(() => {
    if (!user || !token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);

    if (user.role === "admin") {
      socket.on("order:created", (payload) => {
        addNotification({
          type: "order-created",
          message: payload.message,
          order_id: payload.order?.id,
          data: payload.order,
        });
        toast.success(`🔔 ${payload.message}`, { duration: 5000 });
      });
    }

    socket.on("order:status-updated", (payload) => {
      addNotification({
        type: "order-status",
        message: payload.message,
        order_id: payload.order?.id,
        data: payload.order,
      });
      toast.success(`🔔 ${payload.message}`, { duration: 5000 });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => {
      socket.off("order:created");
      socket.off("order:status-updated");
      socket.off("connect_error");
    };
  }, [user, token, addNotification]);

  return children;
}
