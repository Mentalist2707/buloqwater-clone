/**
 * Notifications Store — o'qilmagan bildirishnomalar sonini global kuzatish
 * ────────────────────────────────────────────────────────────
 * Tab paneldagi badge shu store'dan o'qiladi. _layout davriy ravishda
 * (poll) va ilova faollashganda yangilaydi; bildirishnomalar sahifasi
 * ochilganda 0 ga tushiriladi.
 */
import { create } from "zustand";
import { notificationsService } from "@/services/notifications";

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n: number) => set({ unreadCount: Math.max(0, n) }),
  fetchUnreadCount: async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      if (res.success && res.data) set({ unreadCount: res.data.count });
    } catch {
      // jim — tarmoq xatosi badge'ni buzmasin
    }
  },
}));
