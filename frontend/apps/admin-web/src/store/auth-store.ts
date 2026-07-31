import { create } from "zustand";

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  roles: string[];
  setAuth: (token: string, userId: string, username: string, roles: string[]) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("medicore_token") : null,
  userId: typeof window !== "undefined" ? localStorage.getItem("medicore_userId") : null,
  username: typeof window !== "undefined" ? localStorage.getItem("medicore_username") : null,
  roles: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("medicore_roles") || "[]") : [],

  setAuth: (token, userId, username, roles) => {
    localStorage.setItem("medicore_token", token);
    localStorage.setItem("medicore_userId", userId);
    localStorage.setItem("medicore_username", username);
    localStorage.setItem("medicore_roles", JSON.stringify(roles));
    set({ token, userId, username, roles });
  },

  logout: () => {
    localStorage.removeItem("medicore_token");
    localStorage.removeItem("medicore_userId");
    localStorage.removeItem("medicore_username");
    localStorage.removeItem("medicore_roles");
    set({ token: null, userId: null, username: null, roles: [] });
  },

  hasRole: (role: string) => get().roles.includes(role),
}));
