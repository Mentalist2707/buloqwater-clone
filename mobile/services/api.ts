/**
 * API Service — barcha HTTP so'rovlar uchun markaziy joy
 * Token boshqaruvi va xato handling
 */

import { API_BASE_URL } from "@/constants";
import { useAuthStore } from "@/store/auth";
import type { ApiResponse } from "@/types";

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = useAuthStore.getState().token;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      let url = `${this.baseUrl}${endpoint}`;
      if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        redirect: "manual", // Redirectlarni o'zimiz boshqaramiz
      });

      // Redirect statuslarini handle qilish
      if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
        return { 
          success: false, 
          error: `Server redirect qilyapti (${response.status}). API manzili to'g'ri ekanligini tekshiring` 
        };
      }

      if (response.status === 401) {
        useAuthStore.getState().logout();
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error: "Tarmoq xatosi. Internet aloqasini tekshiring" };
    }
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual", // Redirectlarni o'zimiz boshqaramiz
      });

      // Redirect statuslarini handle qilish
      if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
        return { 
          success: false, 
          error: `Server redirect qilyapti (${response.status}). API manzili to'g'ri ekanligini tekshiring` 
        };
      }

      if (response.status === 401) {
        useAuthStore.getState().logout();
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error: "Tarmoq xatosi. Internet aloqasini tekshiring" };
    }
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual",
      });

      if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
        return { 
          success: false, 
          error: `Server redirect qilyapti (${response.status}). API manzili to'g'ri ekanligini tekshiring` 
        };
      }

      if (response.status === 401) {
        useAuthStore.getState().logout();
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error: "Tarmoq xatosi. Internet aloqasini tekshiring" };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        redirect: "manual",
      });

      if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
        return { 
          success: false, 
          error: `Server redirect qilyapti (${response.status}). API manzili to'g'ri ekanligini tekshiring` 
        };
      }

      if (response.status === 401) {
        useAuthStore.getState().logout();
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error: "Tarmoq xatosi. Internet aloqasini tekshiring" };
    }
  }
}

export const api = new ApiService();
