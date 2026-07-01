/**
 * Customers Service — mijozlar bilan ishlash
 */

import { api } from "./api";
import type { Customer, PaginatedResponse, PersonSearchResult } from "@/types";

export interface CustomerAddress {
  id: string;
  label: string;
  address: string;
  landmark?: string | null;
  locationLink?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  source: "primary" | "saved" | "app";
}

export interface CustomerOrderHistory {
  id: string;
  orderNumber: number;
  status: string;
  paymentType: string | null;
  totalAmount: number;
  paidAmount: number;
  bottlesDelivered: number;
  bottlesReturned: number;
  createdAt: string;
  deliveredAt: string | null;
  items: { quantity: number; unitPrice: number; totalPrice: number; product: { name: string; isBottle: boolean } }[];
}

export interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    phone1: string;
    phone2?: string | null;
    address: string;
    landmark?: string | null;
    locationLink?: string | null;
    notes?: string | null;
    bottleBalance: number;
    debtBalance: number;
    createdAt: string;
    hasAppAccount: boolean;
  };
  addresses: CustomerAddress[];
  orders: CustomerOrderHistory[];
  stats: { totalOrders: number; deliveredOrders: number; totalSpent: number };
}

export const customersService = {
  // Mijozlar ro'yxati
  async getCustomers(params?: { search?: string; page?: string; limit?: string }) {
    return api.get<PaginatedResponse<Customer>>("/customers", params);
  },

  // Bitta mijoz — to'liq ma'lumot (manzillar, buyurtmalar, qoldiq)
  async getCustomerDetail(id: string) {
    return api.get<CustomerDetail>(`/customers/${id}`);
  },

  /**
   * Global qidiruv — foydalanuvchi/mijozni bazadan a'zolik holati bilan qidiradi.
   * scope: "all" = butun baza, "mine" = faqat kompaniya mijozlari.
   * Backend `GET /customers/search` shu shaklda javob qaytarishi kutiladi.
   */
  async searchPeople(query: string, scope: "all" | "mine" = "all") {
    return api.get<PersonSearchResult[]>("/customers/search", { query, scope });
  },

  // Yangi mijoz yaratish
  async createCustomer(data: {
    name: string;
    phone1: string;
    phone2?: string;
    address: string;
    landmark?: string;
    locationLink?: string;
    notes?: string;
  }) {
    return api.post<Customer>("/customers", data);
  },

  // Mijozga taklif yuborish (boshqa kompaniyadagi userga)
  async sendCustomerInvitation(data: {
    phone: string;
    userId: string;
  }) {
    return api.post("/customers/invite", data);
  },

  // Telefon raqam orqali user mavjudligini tekshirish
  async checkUserByPhone(phone: string) {
    return api.get(`/users/check-phone/${encodeURIComponent(phone)}`);
  },
};
