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

export interface Address {
  id: string;
  label: string;
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  locationLink?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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
  async placeOrder(
    items: { productId: string; quantity: number }[],
    opts?: { notes?: string; contactPhone?: string; addressId?: string },
  ) {
    return api.post("/customer/orders", { items, ...(opts || {}) });
  },

  // Balans va profil
  async getBalance() {
    return api.get<CustomerBalance>("/customer/balance");
  },

  // Manzil yangilash (eski API, backward compatibility)
  async updateAddress(data: { address: string; landmark?: string; locationLink?: string }) {
    return api.put("/customer/balance", data);
  },

  // Manzillar ro'yxatini olish
  async getAddresses() {
    return api.get<Address[]>("/customer/addresses");
  },

  // Yangi manzil qo'shish
  async createAddress(data: {
    label: string;
    address: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
    locationLink?: string;
    isDefault?: boolean;
  }) {
    return api.post<Address>("/customer/addresses", data);
  },

  // Manzilni yangilash
  async updateAddressById(id: string, data: {
    label?: string;
    address?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
    locationLink?: string;
    isDefault?: boolean;
  }) {
    return api.put<Address>(`/customer/addresses/${id}`, data);
  },

  // Manzilni o'chirish
  async deleteAddress(id: string) {
    return api.delete(`/customer/addresses/${id}`);
  },
};
