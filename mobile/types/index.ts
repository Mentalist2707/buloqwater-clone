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
  /** Ko'p-kompaniyali ko'rinishda mahsulot qaysi kompaniyaga tegishli */
  companyId?: string;
  company?: { id: string; name: string } | null;
}

// ── Kompaniya qidiruvi (mijoz uchun) ────────────────────────
export interface CompanySearchResult {
  id: string;
  name: string;
  subdomain: string;
  address?: string | null;
  logoUrl?: string | null;
  productCount: number;
  isMember: boolean;
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
  contactPhone?: string | null;
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
    latitude?: number | null;
    longitude?: number | null;
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

// ── Notifications ───────────────────────────────────────────
export type NotificationType =
  | "INVITATION"          // mijozga taklif keldi (customer ko'radi)
  | "INVITATION_ACCEPTED" // taklif qabul qilindi (director/operator ko'radi)
  | "INVITATION_REJECTED"
  | "ORDER"               // buyurtma bilan bog'liq
  | "SYSTEM";             // tizim xabari

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  /** Qo'shimcha ma'lumot: invitationId, orderId, companyName, phone, va h.k. */
  data?: Record<string, any> | null;
}

// ── Global odam qidiruvi (operator new-order uchun) ─────────
export type Membership = "none" | "mine" | "other";

/**
 * Bazadan qidirilgan odam natijasi.
 * Backend `GET /customers/search?query=&scope=all|mine` shu shaklda qaytarishi kutiladi.
 */
export interface PersonSearchResult {
  id: string;
  userId?: string | null;
  customerId?: string | null;
  name: string;
  phone: string;
  address?: string | null;
  /** none = hech qaysi kompaniyada emas, mine = mening mijozim, other = boshqa kompaniya(lar)da */
  membership: Membership;
  /** other bo'lsa — bitta kompaniya nomi */
  companyName?: string | null;
  /** other bo'lsa — nechta kompaniyaga a'zo */
  companyCount?: number;
  bottleBalance?: number;
  debtBalance?: number;
}
