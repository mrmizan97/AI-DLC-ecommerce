"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export default function SocketProvider({ children }) {
  const { user, token } = useAuthStore();
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const prepend = useNotificationStore((s) => s.prepend);
  const reset = useNotificationStore((s) => s.reset);

  useEffect(() => {
    if (!user || !token) {
      disconnectSocket();
      reset();
      return;
    }

    fetchNotifications({ limit: 20 });

    const socket = connectSocket(token);

    socket.on("notification:new", (notification) => {
      if (notification && notification.id) {
        prepend(notification);
      }
      toast.success(`🔔 ${notification.message}`, { duration: 5000 });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => {
      socket.off("notification:new");
      socket.off("connect_error");
    };
  }, [user, token, fetchNotifications, prepend, reset]);

  return children;
}
