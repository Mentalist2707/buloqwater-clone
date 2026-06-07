import type { Role, OrderStatus, PaymentType, CompanyStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      phone: string;
      role: Role;
      companyId: string | null;
      subdomain: string | null;
    };
  }
  interface User {
    id: string;
    name: string;
    phone: string;
    role: Role;
    companyId: string | null;
    subdomain: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    companyId: string | null;
    subdomain: string | null;
    phone: string;
  }
}

export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SuperAdminStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
}

export interface DirectorStats {
  dailySales: number;
  dailyDeliveries: number;
  newCustomers: number;
  unreturnedBottles: number;
  weeklyOrders: WeeklyOrderData[];
}

export interface WeeklyOrderData {
  date: string;
  orders: number;
  amount: number;
}

export interface CompanyWithDirector {
  id: string;
  name: string;
  subdomain: string;
  status: CompanyStatus;
  phone: string | null;
  createdAt: Date;
  director: {
    id: string;
    name: string;
    phone: string;
  } | null;
  _count: {
    users: number;
    customers: number;
    orders: number;
  };
}

export interface OrderWithDetails {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentType: PaymentType | null;
  totalAmount: number;
  bottlesDelivered: number;
  bottlesReturned: number;
  notes: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
  customer: {
    id: string;
    name: string;
    phone1: string;
    address: string;
    landmark: string | null;
    locationLink: string | null;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
  } | null;
  operator: {
    id: string;
    name: string;
  } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
    };
  }[];
}

export interface DriverKPI {
  driverId: string;
  driverName: string;
  driverPhone: string;
  totalAssigned: number;
  totalDelivered: number;
  pendingOrders: number;
}
