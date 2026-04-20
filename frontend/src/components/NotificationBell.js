"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unreadCount());
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleOpen = () => {
    if (!open && unread > 0) markAllRead();
    setOpen(!open);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative text-white hover:opacity-80 p-1"
        title="Notifications"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 rounded shadow-xl w-80 max-h-96 overflow-hidden flex flex-col z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-bold text-sm">Notifications</h3>
            {items.length > 0 && (
              <button onClick={clear} className="text-xs text-gray-500 hover:text-red-600">
                Clear all
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
            ) : (
              items.map((n) => {
                const href = n.order_id ? `/orders/${n.order_id}` : "#";
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block p-3 border-b hover:bg-gray-50 text-sm"
                  >
                    <p className="text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(n.created_at).toLocaleTimeString()}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
