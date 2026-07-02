/**
 * Language Store — ilova tili (uz/ru/en), tanlov saqlanadi.
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Lang = "uz" | "ru" | "en";
const LANG_KEY = "buloqwater_lang";

interface LangState {
  lang: Lang;
  ready: boolean;
  setLang: (lang: Lang) => Promise<void>;
  load: () => Promise<void>;
}

export const useLangStore = create<LangState>((set) => ({
  lang: "uz",
  ready: false,
  setLang: async (lang) => {
    set({ lang });
    try {
      await AsyncStorage.setItem(LANG_KEY, lang);
    } catch {}
  },
  load: async () => {
    try {
      const saved = (await AsyncStorage.getItem(LANG_KEY)) as Lang | null;
      if (saved === "uz" || saved === "ru" || saved === "en") {
        set({ lang: saved, ready: true });
        return;
      }
    } catch {}
    set({ ready: true });
  },
}));
