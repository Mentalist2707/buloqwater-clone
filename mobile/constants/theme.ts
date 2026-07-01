/**
 * BuloqWater — Dizayn Tizimi (Design System) 2026
 * ────────────────────────────────────────────────────────────
 * Butun ilova uchun yagona manba: ranglar, tipografiya, masofa,
 * radius, soyalar va gradientlar. Har bir ekran shu tokenlardan
 * foydalanadi — izchil, zamonaviy va "suvli" (aqua) estetika.
 */
import { Platform, TextStyle, ViewStyle } from "react-native";

// ─── 1. Rang Palitrasi ──────────────────────────────────────
// Suv brendiga mos: chuqur okean ko'kidan toza aquagacha.
export const palette = {
  // Brand — Aqua / Ocean
  aqua50: "#ECFEFF",
  aqua100: "#CFFAFE",
  aqua200: "#A5F3FC",
  aqua300: "#67E8F9",
  aqua400: "#22D3EE",
  aqua500: "#06B6D4", // asosiy brand rang (cyan)
  aqua600: "#0891B2",
  aqua700: "#0E7490",

  ocean400: "#38BDF8",
  ocean500: "#0EA5E9",
  ocean600: "#0284C7", // to'q ko'k urg'u
  ocean700: "#0369A1",

  // Accent — Mint / Emerald (muvaffaqiyat, "toza")
  mint100: "#D1FAE5",
  mint400: "#34D399",
  mint500: "#10B981",
  mint600: "#059669",

  // Warm — Amber (ogohlantirish)
  amber100: "#FEF3C7",
  amber400: "#FBBF24",
  amber500: "#F59E0B",
  amber600: "#D97706",

  // Alert — Coral / Rose (xatolik, qarz)
  rose100: "#FFE4E6",
  rose400: "#FB7185",
  rose500: "#F43F5E",
  rose600: "#E11D48",

  // Violet (ikkilamchi urg'u)
  violet100: "#EDE9FE",
  violet500: "#8B5CF6",
  violet600: "#7C3AED",

  // Neutral — Slate (matn, fon, chegara)
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",

  white: "#FFFFFF",
  black: "#000000",
};

// ─── 2. Semantik Ranglar ────────────────────────────────────
export const theme = {
  // Brand
  primary: palette.aqua500,
  primaryDark: palette.ocean600,
  primaryDarker: palette.ocean700,
  primarySoft: palette.aqua100,
  primaryTint: palette.aqua50,

  accent: palette.ocean500,

  // Holat ranglari
  success: palette.mint500,
  successSoft: palette.mint100,
  warning: palette.amber500,
  warningSoft: palette.amber100,
  danger: palette.rose500,
  dangerSoft: palette.rose100,
  info: palette.ocean500,

  // Yuza (Surface)
  bg: palette.slate50,
  surface: palette.white,
  surfaceAlt: palette.slate100,
  overlay: "rgba(15, 23, 42, 0.45)",

  // Matn
  text: palette.slate900,
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  textInverse: palette.white,

  // Chegara
  border: palette.slate200,
  borderStrong: palette.slate300,
  borderSoft: "rgba(226, 232, 240, 0.7)",
};

// ─── 3. Gradientlar ─────────────────────────────────────────
// LinearGradient tuple sifatida (readonly [c, c, ...c[]]).
export const gradients = {
  // Sahifa foni — mayin suvli
  screen: ["#ECFEFF", "#EFF6FF", "#F0FDF4"] as const,
  screenCool: ["#E6FFFA", "#EBF5FF", "#F4FAFF"] as const,
  // Brand tugma / urg'u
  brand: ["#06B6D4", "#0284C7"] as const,
  brandVivid: ["#22D3EE", "#0EA5E9"] as const,
  ocean: ["#0EA5E9", "#0369A1"] as const,
  mint: ["#34D399", "#059669"] as const,
  rose: ["#FB7185", "#E11D48"] as const,
  amber: ["#FBBF24", "#D97706"] as const,
  violet: ["#A78BFA", "#7C3AED"] as const,
  dark: ["#1E293B", "#0F172A"] as const,
};

// ─── 4. Masofa (Spacing) — 4px shkala ───────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 56,
};

// ─── 5. Radius ──────────────────────────────────────────────
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 28,
  pill: 999,
};

// ─── 6. Tipografiya ─────────────────────────────────────────
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 34,
};

export const fontWeight = {
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  extrabold: "800" as TextStyle["fontWeight"],
  black: "900" as TextStyle["fontWeight"],
};

// ─── 7. Soyalar (Elevation) ─────────────────────────────────
const makeShadow = (
  color: string,
  y: number,
  blur: number,
  opacity: number,
  elevation: number,
): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;

export const shadow = {
  none: {} as ViewStyle,
  xs: makeShadow(palette.slate900, 2, 6, 0.04, 1),
  sm: makeShadow(palette.slate900, 4, 12, 0.06, 2),
  md: makeShadow(palette.slate900, 8, 18, 0.08, 4),
  lg: makeShadow(palette.slate900, 12, 24, 0.1, 8),
  // Brand rangli "glow" soya (asosiy tugmalar uchun)
  brand: makeShadow(palette.ocean600, 10, 18, 0.28, 6),
  brandSoft: makeShadow(palette.ocean600, 6, 12, 0.16, 4),
};

// Qulaylik uchun umumiy eksport
export const T = {
  palette,
  theme,
  gradients,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
};

export default T;
