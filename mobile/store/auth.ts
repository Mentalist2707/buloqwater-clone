/**
 * Auth Store — Zustand bilan global auth holat boshqaruvi
 * Token SecureStore'da saqlanadi (xavfsiz)
 * Impersonate: Super Admin firma nomidan kirishi mumkin
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User, CompanyOption } from "@/types";

const TOKEN_KEY       = "buloqwater_token";
const USER_KEY        = "buloqwater_user";
const SA_TOKEN_KEY    = "buloqwater_sa_token";   // Super Admin asl tokeni (impersonate paytida)
const SA_USER_KEY     = "buloqwater_sa_user";    // Super Admin asl user (impersonate paytida)

interface AuthState {
  // State
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Impersonate — Super Admin firma sifatida kirdi
  isImpersonating: boolean;
  originalToken: string | null;
  originalUser: User | null;

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

  // Impersonate actions
  startImpersonate: (companyToken: string, companyUser: User) => Promise<void>;
  stopImpersonate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isImpersonating: false,
  originalToken: null,
  originalUser: null,
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
      await SecureStore.deleteItemAsync(SA_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SA_USER_KEY);
    } catch (e) {
      // Ignore
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      originalToken: null,
      originalUser: null,
      pendingCompanies: null,
      pendingPhone: null,
      pendingPassword: null,
    });
  },

  loadStoredAuth: async () => {
    try {
      const token    = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      const saToken  = await SecureStore.getItemAsync(SA_TOKEN_KEY);
      const saUser   = await SecureStore.getItemAsync(SA_USER_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        if (saToken && saUser) {
          // Ilova qayta ochildi, impersonate session tiklash
          set({
            token, user, isAuthenticated: true, isLoading: false,
            isImpersonating: true,
            originalToken: saToken,
            originalUser: JSON.parse(saUser) as User,
          });
        } else {
          set({ token, user, isAuthenticated: true, isLoading: false });
        }
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

  /**
   * Super Admin firma sifatida kiradi.
   * Asl SA token saqlangan holda companyToken bilan ishlaydi.
   */
  startImpersonate: async (companyToken: string, companyUser: User) => {
    const { token: saToken, user: saUser } = get();
    if (!saToken || !saUser) return;

    try {
      await SecureStore.setItemAsync(SA_TOKEN_KEY, saToken);
      await SecureStore.setItemAsync(SA_USER_KEY, JSON.stringify(saUser));
      await SecureStore.setItemAsync(TOKEN_KEY, companyToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(companyUser));
    } catch (e) {
      // ignore
    }

    set({
      token: companyToken,
      user: companyUser,
      isImpersonating: true,
      originalToken: saToken,
      originalUser: saUser,
    });
  },

  /**
   * Impersonateni to'xtatib, Super Admin sessiyasiga qaytadi.
   */
  stopImpersonate: async () => {
    const { originalToken, originalUser } = get();
    if (!originalToken || !originalUser) return;

    try {
      await SecureStore.setItemAsync(TOKEN_KEY, originalToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(originalUser));
      await SecureStore.deleteItemAsync(SA_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SA_USER_KEY);
    } catch (e) {
      // ignore
    }

    set({
      token: originalToken,
      user: originalUser,
      isImpersonating: false,
      originalToken: null,
      originalUser: null,
    });
  },
}));
