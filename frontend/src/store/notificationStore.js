import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  items: [],

  add: (notification) => {
    const entry = {
      id: Date.now() + Math.random(),
      read: false,
      created_at: new Date().toISOString(),
      ...notification,
    };
    set({ items: [entry, ...get().items].slice(0, 50) });
  },

  markAllRead: () => {
    set({ items: get().items.map((n) => ({ ...n, read: true })) });
  },

  clear: () => set({ items: [] }),

  unreadCount: () => get().items.filter((n) => !n.read).length,
}));
