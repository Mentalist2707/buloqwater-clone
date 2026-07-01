/**
 * Companies Service — mijoz uchun kompaniya qidirish va a'zo bo'lish
 */
import { api } from "./api";
import type { CompanySearchResult } from "@/types";

export const companiesService = {
  // Kompaniya qidirish (a'zolik holati bilan)
  async search(query: string) {
    return api.get<CompanySearchResult[]>("/companies/search", query ? { query } : undefined);
  },

  // Kompaniyaga a'zo bo'lish
  async join(companyId: string, address?: string) {
    return api.post<{ customerId: string; companyId: string; companyName: string }>("/companies/join", {
      companyId,
      address,
    });
  },
};
