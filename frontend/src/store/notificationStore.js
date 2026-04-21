import { create } from "zustand";
import api from "@/lib/api";

export const useNotificationStore = create((set, get) => ({
  items: [],
  loading: false,
  pagination: { total: 0, page: 1, totalPages: 1 },

  fetch: async (query = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.append(k, v);
      });
      const res = await api.get(`/notifications?${params.toString()}`);
      set({
        items: res.data.data || [],
        pagination: res.data.pagination || { total: 0, page: 1, totalPages: 1 },
      });
    } finally {
      set({ loading: false });
    }
  },

  prepend: (notification) => {
    set({ items: [notification, ...get().items] });
  },

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set({
      items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
  },

  markAllRead: async () => {
    await api.patch(`/notifications/read-all`);
    set({ items: get().items.map((n) => ({ ...n, read: true })) });
  },

  remove: async (id) => {
    await api.delete(`/notifications/${id}`);
    set({ items: get().items.filter((n) => n.id !== id) });
  },

  clear: async () => {
    await api.delete(`/notifications/all`);
    set({ items: [] });
  },

  reset: () => set({ items: [], pagination: { total: 0, page: 1, totalPages: 1 } }),

  unreadCount: () => get().items.filter((n) => !n.read).length,
}));
