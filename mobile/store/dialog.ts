/**
 * Dialog Store — global maxsus alert/confirm oynasi holati.
 * Native Alert o'rniga ishlatiladi (chiroyli, brendga mos dizayn).
 */
import { create } from "zustand";

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface DialogState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: DialogButton[];
  show: (title: string, message?: string, buttons?: DialogButton[]) => void;
  hide: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  visible: false,
  title: "",
  message: undefined,
  buttons: [],
  show: (title, message, buttons) =>
    set({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length ? buttons : [{ text: "OK" }],
    }),
  hide: () => set({ visible: false }),
}));
