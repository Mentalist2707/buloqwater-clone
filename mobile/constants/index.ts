// API base URL — production'da o'zgartiring
export const API_BASE_URL = __DEV__
  ? "http://192.168.1.107:3000/api/v1" // Local development
  : "https://buloqwater.uz/api/v1";     // Production

// Colors
export const Colors = {
  primary: "#0EA5E9",       // sky-500
  primaryDark: "#0284C7",   // sky-600
  primaryLight: "#E0F2FE",  // sky-100
  secondary: "#6366F1",     // indigo-500
  success: "#22C55E",       // green-500
  successLight: "#DCFCE7",  // green-100
  warning: "#F59E0B",       // amber-500
  warningLight: "#FEF3C7",  // amber-100
  danger: "#EF4444",        // red-500
  dangerLight: "#FEE2E2",   // red-100
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8FAFC",
};

// Order Status labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ASSIGNED: "Tayinlangan",
  IN_TRANSIT: "Yo'lda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilingan",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: Colors.warning,
  ASSIGNED: Colors.secondary,
  IN_TRANSIT: Colors.primary,
  DELIVERED: Colors.success,
  CANCELLED: Colors.danger,
};

// Payment Type labels
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: "Naqd",
  CLICK: "Click/Payme",
  CREDIT: "Qarz",
};
