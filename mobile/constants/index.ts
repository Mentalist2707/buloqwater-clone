// API base URL — production'da o'zgartiring
export const API_BASE_URL = __DEV__
  ? "http://192.168.1.107:3000/api/v1" // Local development
  : "https://buloqwater-clone.vercel.app/api/v1";     // Production

// ── Dizayn tizimi (2026) ────────────────────────────────────
export * from "./theme";
import { palette } from "./theme";

// Colors — orqaga muvofiqlik uchun (yangi palitraga bog'langan)
export const Colors = {
  primary: palette.aqua500,       // aqua-500
  primaryDark: palette.ocean600,  // ocean-600
  primaryLight: palette.aqua100,  // aqua-100
  secondary: palette.violet500,   // violet-500
  success: palette.mint500,       // mint-500
  successLight: palette.mint100,
  warning: palette.amber500,
  warningLight: palette.amber100,
  danger: palette.rose500,
  dangerLight: palette.rose100,
  gray: {
    50: palette.slate50,
    100: palette.slate100,
    200: palette.slate200,
    300: palette.slate300,
    400: palette.slate400,
    500: palette.slate500,
    600: palette.slate600,
    700: palette.slate700,
    800: palette.slate800,
    900: palette.slate900,
  },
  white: palette.white,
  black: palette.black,
  background: palette.slate50,
};

// Order Status labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Yangi",
  ASSIGNED: "Haydovchiga berildi",
  IN_TRANSIT: "Yo'lda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
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
