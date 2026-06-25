/**
 * Customer Service — mijoz uchun mahsulotlar, buyurtmalar, balans
 */
import { api } from "./api";
import type { Product, Order } from "@/types";

export interface CustomerBalance {
  bottleBalance: number;
  debtBalance: number;
  name: string;
  address?: string;
  landmark?: string;
  locationLink?: string;
}

export const customerService = {
  // Mahsulotlar vitrinasi
  async getProducts() {
    return api.get<Product[]>("/customer/products");
  },

  // Buyurtmalar tarixi
  async getOrders() {
    return api.get<Order[]>("/customer/orders");
  },

  // Yangi buyurtma berish
  async placeOrder(items: { productId: string; quantity: number }[], notes?: string) {
    return api.post("/customer/orders", { items, notes });
  },

  // Balans va profil
  async getBalance() {
    return api.get<CustomerBalance>("/customer/balance");
  },

  // Manzil yangilash
  async updateAddress(data: { address: string; landmark?: string; locationLink?: string }) {
    return api.put("/customer/balance", data);
  },
};
