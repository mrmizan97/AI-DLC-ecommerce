import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        }
        set({ user, token });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        set({ user: null, token: null });
      },

      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.token;
      },

      isAdmin: () => {
        const state = useAuthStore.getState();
        return state.user?.role === "admin";
      },
    }),
    { name: "auth-storage" }
  )
);
