/**
 * Customers Service — mijozlar bilan ishlash
 */

import { api } from "./api";
import type { Customer, PaginatedResponse } from "@/types";

export const customersService = {
  // Mijozlar ro'yxati
  async getCustomers(params?: { search?: string; page?: string; limit?: string }) {
    return api.get<PaginatedResponse<Customer>>("/customers", params);
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
};
