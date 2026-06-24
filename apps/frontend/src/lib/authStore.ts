import { create } from "zustand";

interface User {
  id: string;
  type: "doctor" | "patient" | "admin";
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AuthState {
  userType: "doctor" | "patient" | "admin" | null;
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;

  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userType: localStorage.getItem("user_type") as "doctor" | "patient" | "admin" | null,
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  login: async () => {
    // Rely on checkAuth to fetch the user state from the server using the httpOnly cookie
    await get().checkAuth();
  },

  logout: async () => {
    try {
      const api = (await import("./api")).default;
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("user_type");
    set({
      userType: null,
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => set({ user }),

  checkAuth: async () => {
    try {
      const api = (await import("./api")).default;
      const res = await api.get('/auth/me');
      if (res.data.logged_in) {
        set({
          isAuthenticated: true,
          userType: res.data.type,
          isInitializing: false,
        });
        localStorage.setItem("user_type", res.data.type);
      } else {
        set({ isAuthenticated: false, userType: null, isInitializing: false });
        localStorage.removeItem("user_type");
      }
    } catch {
      set({ isAuthenticated: false, userType: null, isInitializing: false });
      localStorage.removeItem("user_type");
    }
  },
}));
