/**
 * Products Service — mahsulotlar ro'yxati
 */

import { api } from "./api";
import type { Product } from "@/types";

export const productsService = {
  async getProducts(category?: string) {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    return api.get<Product[]>("/products", params);
  },
};
