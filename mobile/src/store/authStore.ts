import { create } from "zustand";
import {
  fetchMe,
  loginWithPassword,
  logoutCurrentSession,
} from "@/src/services/auth/authApi";
import { getAccessToken } from "@/src/services/storage/secureStore";
import { getApiErrorMessage } from "@/src/services/api/client";
import type { MobileUser } from "@/src/types/auth";

type AuthState = {
  user: MobileUser | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ user: null, hydrated: true, loading: false });
        return;
      }
      const user = await fetchMe();
      set({ user, hydrated: true, loading: false, error: null });
    } catch {
      set({ user: null, hydrated: true, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const result = await loginWithPassword({ email, password });
      set({ user: result.user, loading: false, error: null, hydrated: true });
    } catch (error) {
      set({
        loading: false,
        error: getApiErrorMessage(error, "Unable to sign in"),
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await logoutCurrentSession();
    } finally {
      set({ user: null, loading: false, hydrated: true });
    }
  },
}));
