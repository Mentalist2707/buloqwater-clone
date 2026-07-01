/**
 * Notifications Service — bildirishnomalar bilan ishlash
 * ────────────────────────────────────────────────────────────
 * Kutilayotgan backend endpointlari:
 *   GET  /notifications                → AppNotification[] yoki PaginatedResponse<AppNotification>
 *   GET  /notifications/unread-count   → { count: number }
 *   POST /notifications/:id/read       → o'qilgan deb belgilash
 *   POST /notifications/read-all       → hammasini o'qilgan deb belgilash
 */
import { api } from "./api";
import type { AppNotification, PaginatedResponse } from "@/types";

export const notificationsService = {
  async getNotifications(params?: { page?: string; limit?: string }) {
    return api.get<AppNotification[] | PaginatedResponse<AppNotification>>("/notifications", params);
  },

  async getUnreadCount() {
    return api.get<{ count: number }>("/notifications/unread-count");
  },

  async markRead(id: string) {
    return api.post(`/notifications/${id}/read`);
  },

  async markAllRead() {
    return api.post("/notifications/read-all");
  },
};
