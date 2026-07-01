/**
 * PIN Store — ilovaga kirish uchun mahalliy PIN-kod qulfi
 * ────────────────────────────────────────────────────────────
 * PIN SecureStore'da (shifrlangan) saqlanadi. Yoqilgan bo'lsa,
 * ilova har ochilganda va fon'dan qaytganda qulflanadi.
 */
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "buloqwater_app_pin";

interface PinState {
  pinEnabled: boolean;
  isLocked: boolean;
  isReady: boolean;

  load: () => Promise<void>;
  setPin: (code: string) => Promise<void>;
  removePin: () => Promise<void>;
  verify: (code: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
}

export const usePinStore = create<PinState>((set, get) => ({
  pinEnabled: false,
  isLocked: false,
  isReady: false,

  load: async () => {
    try {
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      set({ pinEnabled: !!pin, isLocked: !!pin, isReady: true });
    } catch {
      set({ pinEnabled: false, isLocked: false, isReady: true });
    }
  },

  setPin: async (code: string) => {
    await SecureStore.setItemAsync(PIN_KEY, code);
    set({ pinEnabled: true, isLocked: false });
  },

  removePin: async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    set({ pinEnabled: false, isLocked: false });
  },

  verify: async (code: string) => {
    try {
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      return pin === code;
    } catch {
      return false;
    }
  },

  unlock: () => set({ isLocked: false }),

  lock: () => {
    if (get().pinEnabled) set({ isLocked: true });
  },
}));
