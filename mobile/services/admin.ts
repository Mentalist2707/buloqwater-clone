/**
 * Admin Service — direktor/admin uchun statistika va boshqaruv
 */
import { api } from "./api";

export interface AdminStats {
  dailySales: number;
  salesTrend: number;
  dailyDeliveries: number;
  deliveryTrend: number;
  newCustomersMonth: number;
  pendingOrders: number;
  inTransitOrders: number;
  cancelledToday?: number;
  totalDebt: number;
  unreturnedBottles: number;
  activeDrivers: number;
  totalCustomers?: number;
  totalOrders?: number;
  customersWithDebt?: number;
  customersWithBottles?: number;
  totalCustomerBottles?: number;
  paymentBreakdown?: {
    cash: number;
    click: number;
    credit: number;
  };
  alerts?: Array<{
    type: "warning" | "danger" | "info";
    message: string;
    link?: string;
  }>;
  weeklyData: { day: string; orders: number; revenue: number }[];
}

export const adminService = {
  async getStats() {
    return api.get<AdminStats>("/admin/stats");
  },
};
