"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import Pagination from "@/components/Pagination";

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const pagination = useNotificationStore((s) => s.pagination);
  const fetch = useNotificationStore((s) => s.fetch);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);
  const clearAll = useNotificationStore((s) => s.clear);

  const [filter, setFilter] = useState("all"); // all | unread
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const formatTime = (notification) => {
    const raw = notification.created_at || notification.createdAt;
    if (!raw) return "";
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetch({ page, limit, ...(filter === "unread" ? { unread_only: "true" } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filter, page, limit]);

  if (!user) return null;

  const handleItemClick = async (n) => {
    if (!n.read) {
      try { await markRead(n.id); } catch {}
    }
    if (n.order_id) {
      const route = user.role === "admin" ? `/admin/orders` : `/orders/${n.order_id}`;
      router.push(route);
    }
  };

  const handleRemove = async (e, id) => {
    e.stopPropagation();
    try {
      await remove(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete all notifications?")) return;
    try {
      await clearAll();
      toast.success("All cleared");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell size={24} /> Notifications
        </h1>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="unread">Unread only</option>
          </select>
          <button onClick={markAllRead} className="bg-white border px-3 py-2 rounded text-sm hover:bg-gray-50 flex items-center gap-1">
            <CheckCheck size={16} /> Mark all read
          </button>
          <button onClick={handleClearAll} className="bg-white border px-3 py-2 rounded text-sm hover:bg-red-50 text-red-600 flex items-center gap-1">
            <Trash2 size={16} /> Clear all
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications {filter === "unread" ? "unread" : "yet"}.</p>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`flex items-start gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer last:border-0 ${
                n.read ? "" : "bg-orange-50"
              }`}
            >
              {!n.read ? (
                <span className="w-2.5 h-2.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              ) : (
                <Check size={14} className="text-gray-400 mt-1.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-gray-900 ${n.read ? "" : "font-medium"}`}>{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(n)} · {n.type}
                </p>
              </div>
              <button
                onClick={(e) => handleRemove(e, n.id)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(n) => { setLimit(n); setPage(1); }}
      />
    </div>
  );
}
