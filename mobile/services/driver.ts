/**
 * Driver Service — haydovchi uchun maxsus API'lar
 */

import { api } from "./api";
import type { DriverTasksResponse } from "@/types";

export const driverService = {
  // Tayinlangan buyurtmalar + statistika
  async getTasks(includeDelivered = false) {
    const params: Record<string, string> = {};
    if (includeDelivered) params.delivered = "true";
    return api.get<DriverTasksResponse>("/driver/tasks", params);
  },

  // Yetkazishni boshlash (IN_TRANSIT)
  async startDelivery(orderId: string) {
    return api.post("/driver/start-delivery", { orderId });
  },

  // Buyurtmani yetkazish
  async deliverOrder(data: { orderId: string; paymentType: string; bottlesReturned: number }) {
    return api.post("/orders/deliver", data);
  },
};
