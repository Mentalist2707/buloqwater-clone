/**
 * Alert — native `Alert` o'rniga drop-in almashtirish.
 * Bir xil imzo: Alert.alert(title, message?, buttons?)
 * Global maxsus dialog (AppDialog) orqali ko'rsatiladi.
 */
import { useDialogStore, type DialogButton } from "@/store/dialog";

export const Alert = {
  alert(title: string, message?: string, buttons?: DialogButton[]) {
    useDialogStore.getState().show(title, message, buttons);
  },
};
