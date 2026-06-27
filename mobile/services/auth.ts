/**
 * Auth Service — login, logout, token boshqaruvi
 */

import { api } from "./api";
import type { LoginResponse, User } from "@/types";

export const authService = {
  // Telefon + parol bilan kirish (Variant 4: auto-detect)
  async login(phone: string, password: string) {
    return api.post<LoginResponse>("/auth/login", { phone, password });
  },

  // Customer ro'yxatdan o'tish
  async register(name: string, phone: string, password: string, address?: string) {
    return api.post<LoginResponse>("/auth/register", { name, phone, password, address });
  },

  // Kompaniya tanlash (bir nechta kompaniyada bo'lsa)
  async selectCompany(phone: string, password: string, companyId: string) {
    return api.post<LoginResponse>("/auth/select-company", {
      phone,
      password,
      companyId,
    });
  },

  // Joriy foydalanuvchi
  async getMe() {
    return api.get<User>("/auth/me");
  },
};
