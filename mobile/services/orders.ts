/**
 * Orders Service — buyurtmalar bilan ishlash
 */

import { api } from "./api";
import type { Order, PaginatedResponse, Driver } from "@/types";

export const ordersService = {
  // Buyurtmalar ro'yxati
  async getOrders(params?: { status?: string; page?: string; limit?: string }) {
    return api.get<PaginatedResponse<Order>>("/orders", params);
  },

  // Yangi buyurtma yaratish
  async createOrder(data: { customerId: string; items: { productId: string; quantity: number }[] }) {
    return api.post<Order>("/orders", data);
  },

  // Haydovchi biriktirish
  async assignDriver(orderId: string, driverId: string) {
    return api.post("/orders/assign", { orderId, driverId });
  },

  // Buyurtmani yetkazish
  async deliverOrder(data: { orderId: string; paymentType: string; bottlesReturned: number }) {
    return api.post("/orders/deliver", data);
  },

  // Haydovchilar ro'yxati (assign uchun)
  async getDrivers() {
    return api.get<Driver[]>("/drivers");
  },
};
