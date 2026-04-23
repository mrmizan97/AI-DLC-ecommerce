"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { stopNotificationSound } from "@/lib/notificationSound";

export default function NotificationBell() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unreadCount());
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
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

  const handleItemClick = async (n) => {
    setOpen(false);
    if (!n.read) {
      try {
        await markRead(n.id);
      } catch {}
    }
    if (n.order_id) {
      const targetRoute = user?.role === "admin" ? `/admin/orders` : `/orders/${n.order_id}`;
      router.push(targetRoute);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          stopNotificationSound();
        }}
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
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
            ) : (
              items.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`block w-full text-left p-3 border-b hover:bg-gray-50 text-sm ${
                    n.read ? "" : "bg-orange-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-gray-900">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-primary hover:bg-gray-50 py-2 rounded font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
