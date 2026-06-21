// ── Rollar ──────────────────────────────────────────────────
export type Role = "SUPER_ADMIN" | "DIRECTOR" | "OPERATOR" | "DRIVER" | "CUSTOMER";
export type OrderStatus = "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
export type PaymentType = "CASH" | "CLICK" | "CREDIT";
export type ProductCategory = "WATER" | "PROMO" | "ACCESSORIES";
export type ProductUnit = "PIECE" | "LITER";

// ── API Response ────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ── Auth ────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string | null;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  company: Company | null;
}

export interface LoginResponse {
  type: "authenticated" | "select_company";
  token?: string;
  user?: User;
  message?: string;
  companies?: CompanyOption[];
}

export interface CompanyOption {
  userId: string;
  role: Role;
  company: Company;
}

// ── Customer ────────────────────────────────────────────────
export interface Customer {
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
  _count?: { orders: number };
}

// ── Product ─────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  category: ProductCategory;
  unit: ProductUnit;
  isBottle: boolean;
}

// ── Order ───────────────────────────────────────────────────
export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: { id: string; name: string; unit?: ProductUnit };
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentType: PaymentType | null;
  totalAmount: number;
  paidAmount: number;
  bottlesDelivered: number;
  bottlesReturned: number;
  notes: string | null;
  deliveredAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone1: string;
    phone2?: string | null;
    address: string;
    landmark?: string | null;
    locationLink?: string | null;
    bottleBalance?: number;
  };
  driver?: { id: string; name: string; phone: string } | null;
  operator?: { id: string; name: string } | null;
  items: OrderItem[];
}

// ── Driver ──────────────────────────────────────────────────
export interface Driver {
  id: string;
  name: string;
  phone: string;
  activeOrdersCount: number;
}

export interface DriverTasksResponse {
  tasks: Order[];
  stats: {
    pendingCount: number;
    deliveredToday: number;
    totalAmountToday: number;
    bottlesDeliveredToday: number;
    bottlesReturnedToday: number;
  };
}

// ── Paginated ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
