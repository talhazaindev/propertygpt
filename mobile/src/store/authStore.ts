import { create } from "zustand";
import {
  deleteAccount,
  fetchMe,
  loginWithPassword,
  logoutAllSessions,
  logoutCurrentSession,
  updateProfile,
} from "@/src/services/auth/authApi";
import { getAccessToken } from "@/src/services/storage/secureStore";
import { getApiErrorMessage } from "@/src/services/api/client";
import { setSentryUser } from "@/src/monitoring/sentry";
import type { MobileUser } from "@/src/types/auth";

type AuthState = {
  user: MobileUser | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  updateMyProfile: (input: {
    name?: string;
    phoneNumber?: string;
  }) => Promise<void>;
  deleteMyAccount: (password: string) => Promise<void>;
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
        setSentryUser(null);
        set({ user: null, hydrated: true, loading: false });
        return;
      }
      const user = await fetchMe();
      setSentryUser({ id: user.id });
      set({ user, hydrated: true, loading: false, error: null });
    } catch {
      setSentryUser(null);
      set({ user: null, hydrated: true, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const result = await loginWithPassword({ email, password });
      setSentryUser({ id: result.user.id });
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
      setSentryUser(null);
      set({ user: null, loading: false, hydrated: true });
    }
  },

  logoutEverywhere: async () => {
    set({ loading: true, error: null });
    try {
      await logoutAllSessions();
    } finally {
      setSentryUser(null);
      set({ user: null, loading: false, hydrated: true });
    }
  },

  updateMyProfile: async (input) => {
    set({ loading: true, error: null });
    try {
      const user = await updateProfile(input);
      set({ user, loading: false, error: null });
    } catch (error) {
      set({
        loading: false,
        error: getApiErrorMessage(error, "Could not update profile"),
      });
      throw error;
    }
  },

  deleteMyAccount: async (password) => {
    set({ loading: true, error: null });
    try {
      await deleteAccount(password);
      setSentryUser(null);
      set({ user: null, loading: false, hydrated: true, error: null });
    } catch (error) {
      set({
        loading: false,
        error: getApiErrorMessage(error, "Could not delete account"),
      });
      throw error;
    }
  },
}));
