/**
 * Zayavka holati tekshirish (2026 redesign)
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Header, Screen } from "@/components/ui";
import { api } from "@/services/api";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const PREFIX = "+998";

function formatSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

type AppStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AppData {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  status: AppStatus;
  adminNote: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  AppStatus,
  { icon: keyof typeof Feather.glyphMap; label: string; color: string; bg: string; desc: string }
> = {
  PENDING: {
    icon: "clock",
    label: "Ko'rib chiqilmoqda",
    color: palette.amber500,
    bg: palette.amber100,
    desc: "Zayavkangiz super admin tomonidan ko'rib chiqilmoqda. Odatda 1-2 ish kuni ichida javob beriladi.",
  },
  APPROVED: {
    icon: "check-circle",
    label: "Tasdiqlandi!",
    color: palette.mint500,
    bg: palette.mint100,
    desc: "Tabriklaymiz! Zayavkangiz tasdiqlandi. Admin siz bilan bog'lanib login ma'lumotlarini yuboradi.",
  },
  REJECTED: {
    icon: "x-circle",
    label: "Rad etildi",
    color: palette.rose500,
    bg: palette.rose100,
    desc: "Afsuski, zayavkangiz rad etildi. Quyida sabab ko'rsatilgan bo'lishi mumkin.",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApplicationStatusScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const [suffix, setSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appData, setAppData] = useState<AppData | null>(null);
  const [focused, setFocused] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  useEffect(() => {
    if (params.phone) {
      const digits = params.phone.replace(/\D/g, "").slice(-9);
      setSuffix(formatSuffix(digits));
      checkStatus(params.phone);
    }
  }, []);

  const fullPhone = PREFIX + suffix.replace(/\D/g, "");

  const handleSuffixChange = (text: string) => {
    if (text.startsWith(PREFIX)) setSuffix(formatSuffix(text.slice(PREFIX.length)));
    else if (text.length === 0) setSuffix("");
    else setSuffix(formatSuffix(text));
  };

  const checkStatus = async (phone?: string) => {
    const p = phone ?? fullPhone;
    const digits = p.replace(/\D/g, "");
    if (digits.length < 11) {
      setError("Telefon raqamni to'liq kiriting");
      return;
    }
    setError("");
    setLoading(true);
    setAppData(null);
    const r = await api.get<AppData>("/applications", { phone: p });
    setLoading(false);
    if (r.success && r.data) setAppData(r.data);
    else setError((r as any).error || "Zayavka topilmadi");
  };

  const cfg = appData ? STATUS_CONFIG[appData.status] : null;

  return (
    <Screen>
      <Header title="Zayavka holati" subtitle="Telefon raqamingizni kiriting" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Search card */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Telefon raqam</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => phoneRef.current?.focus()}
              style={[styles.phoneBox, focused && styles.phoneBoxFocused]}
            >
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+998</Text>
              </View>
              <TextInput
                ref={phoneRef}
                style={styles.phoneSuffix}
                value={suffix}
                onChangeText={handleSuffixChange}
                keyboardType="phone-pad"
                placeholder="90 123 45 67"
                placeholderTextColor={theme.textMuted}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={12}
                returnKeyType="search"
                onSubmitEditing={() => checkStatus()}
              />
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={theme.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.searchBtn, loading && { opacity: 0.7 }]} onPress={() => checkStatus()} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="search" size={16} color="#FFF" />
                  <Text style={styles.searchBtnText}>Tekshirish</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Result */}
          {appData && cfg && (
            <View style={styles.card}>
              <View style={[styles.statusBanner, { backgroundColor: cfg.bg }]}>
                <View style={[styles.statusIconBox, { backgroundColor: cfg.color + "22" }]}>
                  <Feather name={cfg.icon} size={22} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.statusDesc}>{cfg.desc}</Text>
                </View>
              </View>

              <View style={styles.detailsBlock}>
                <DetailRow label="Kompaniya" value={appData.companyName} />
                <DetailRow label="Rahbar" value={appData.ownerName} />
                <DetailRow label="Telefon" value={appData.phone} />
                <DetailRow label="Yuborilgan" value={formatDate(appData.createdAt)} last />
              </View>

              {appData.status === "REJECTED" && appData.adminNote && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Admin izohi:</Text>
                  <Text style={styles.noteText}>{appData.adminNote}</Text>
                </View>
              )}

              {appData.status === "APPROVED" && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }]} onPress={() => router.replace("/(auth)/login")}>
                  <Feather name="log-in" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>Tizimga kirish</Text>
                </TouchableOpacity>
              )}

              {appData.status === "REJECTED" && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={() => router.replace("/(auth)/register")}>
                  <Feather name="send" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>Qayta ariza yuborish</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.backToLoginText}>← Kirish sahifasiga qaytish</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[drStyles.row, !last && drStyles.border]}>
      <Text style={drStyles.label}>{label}</Text>
      <Text style={drStyles.value}>{value}</Text>
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11 },
  border: { borderBottomWidth: 1, borderBottomColor: theme.border },
  label: { fontSize: fontSize.sm, color: theme.textSecondary },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.text, flex: 1, textAlign: "right", marginLeft: spacing.md },
});

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    marginBottom: spacing.base,
    ...shadow.sm,
  },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary, marginBottom: spacing.sm },
  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    overflow: "hidden",
    marginBottom: spacing.md,
    height: 52,
  },
  phoneBoxFocused: { borderColor: theme.primary, backgroundColor: theme.primaryTint },
  prefixBox: { paddingHorizontal: 14, height: "100%", justifyContent: "center", backgroundColor: theme.surfaceAlt },
  prefixText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.textSecondary },
  phoneSuffix: { flex: 1, paddingHorizontal: 14, fontSize: fontSize.base, color: theme.text },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: fontSize.sm, color: theme.danger, fontWeight: fontWeight.semibold },

  searchBtn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadow.brandSoft,
  },
  searchBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: "#FFF" },

  statusBanner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.base },
  statusIconBox: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  statusLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 4 },
  statusDesc: { fontSize: fontSize.sm, color: theme.textSecondary, lineHeight: 18 },

  detailsBlock: { marginBottom: spacing.md },

  noteBox: {
    backgroundColor: theme.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.rose400 + "40",
  },
  noteTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.danger, marginBottom: 4 },
  noteText: { fontSize: fontSize.sm, color: theme.text, lineHeight: 18 },

  actionBtn: {
    borderRadius: radius.md,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  actionBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: "#FFF" },

  backToLogin: { alignItems: "center", paddingVertical: spacing.sm },
  backToLoginText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium },
});
