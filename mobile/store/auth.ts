/**
 * Auth Store — Zustand bilan global auth holat boshqaruvi
 * Token SecureStore'da saqlanadi (xavfsiz)
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User, CompanyOption } from "@/types";

const TOKEN_KEY = "buloqwater_token";
const USER_KEY = "buloqwater_user";

interface AuthState {
  // State
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Kompaniya tanlash uchun vaqtinchalik
  pendingCompanies: CompanyOption[] | null;
  pendingPhone: string | null;
  pendingPassword: string | null;

  // Actions
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setPendingSelection: (companies: CompanyOption[], phone: string, password: string) => void;
  clearPendingSelection: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  pendingCompanies: null,
  pendingPhone: null,
  pendingPassword: null,

  setAuth: async (token: string, user: User) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (e) {
      // SecureStore bo'lmasa (web), davom etamiz
    }
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      // Ignore
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      pendingCompanies: null,
      pendingPhone: null,
      pendingPassword: null,
    });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },

  setPendingSelection: (companies, phone, password) => {
    set({ pendingCompanies: companies, pendingPhone: phone, pendingPassword: password });
  },

  clearPendingSelection: () => {
    set({ pendingCompanies: null, pendingPhone: null, pendingPassword: null });
  },
}));
