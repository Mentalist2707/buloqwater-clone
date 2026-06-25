/**
 * Zayavka holati tekshirish
 * Telefon raqami orqali zayavka statusini ko'rish
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants";
import { api } from "@/services/api";

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

const STATUS_CONFIG: Record<AppStatus, {
  icon: string; label: string; color: string; bg: string; desc: string;
}> = {
  PENDING: {
    icon: "⏳",
    label: "Ko'rib chiqilmoqda",
    color: Colors.warning,
    bg: Colors.warningLight,
    desc: "Zayavkangiz super admin tomonidan ko'rib chiqilmoqda. Odatda 1-2 ish kuni ichida javob beriladi.",
  },
  APPROVED: {
    icon: "✅",
    label: "Tasdiqlandi!",
    color: Colors.success,
    bg: Colors.successLight,
    desc: "Tabriklaymiz! Zayavkangiz tasdiqlandi. Admin siz bilan bog'lanib login ma'lumotlarini yuboradi.",
  },
  REJECTED: {
    icon: "❌",
    label: "Rad etildi",
    color: Colors.danger,
    bg: Colors.dangerLight,
    desc: "Afsuski, zayavkangiz rad etildi. Quyida sabab ko'rsatilgan bo'lishi mumkin.",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ApplicationStatusScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();

  const [suffix, setSuffix]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [appData, setAppData]     = useState<AppData | null>(null);
  const [focused, setFocused]     = useState(false);
  const phoneRef = useRef<TextInput>(null);

  // Agar phone param kelsa — avtomatik tekshir
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
    else if (text.length === 0)  setSuffix("");
    else                         setSuffix(formatSuffix(text));
  };

  const checkStatus = async (phone?: string) => {
    const p = phone ?? fullPhone;
    const digits = p.replace(/\D/g, "");
    if (digits.length < 11) { setError("Telefon raqamni to'liq kiriting"); return; }

    setError("");
    setLoading(true);
    setAppData(null);

    const r = await api.get<AppData>("/applications", { phone: p });
    setLoading(false);

    if (r.success && r.data) {
      setAppData(r.data);
    } else {
      setError((r as any).error || "Zayavka topilmadi");
    }
  };

  const cfg = appData ? STATUS_CONFIG[appData.status] : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Zayavka holati</Text>
            <Text style={styles.subtitle}>Telefon raqamingizni kiriting</Text>
          </View>
        </View>

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
            <View style={styles.prefixDivider} />
            <TextInput
              ref={phoneRef}
              style={styles.phoneSuffix}
              value={suffix}
              onChangeText={handleSuffixChange}
              keyboardType="phone-pad"
              placeholder="90 123 45 67"
              placeholderTextColor={Colors.gray[400]}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={12}
              returnKeyType="search"
              onSubmitEditing={() => checkStatus()}
            />
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
            onPress={() => checkStatus()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.searchBtnText}>🔍 Tekshirish</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Result */}
        {appData && cfg && (
          <View style={styles.resultCard}>
            {/* Status banner */}
            <View style={[styles.statusBanner, { backgroundColor: cfg.bg }]}>
              <Text style={styles.statusIcon}>{cfg.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                <Text style={styles.statusDesc}>{cfg.desc}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.detailsBlock}>
              <DetailRow label="Kompaniya" value={appData.companyName} />
              <DetailRow label="Rahbar" value={appData.ownerName} />
              <DetailRow label="Telefon" value={appData.phone} />
              <DetailRow
                label="Yuborilgan"
                value={formatDate(appData.createdAt)}
                last
              />
            </View>

            {/* Admin note — rad etilganda */}
            {appData.status === "REJECTED" && appData.adminNote && (
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Admin izohi:</Text>
                <Text style={styles.noteText}>{appData.adminNote}</Text>
              </View>
            )}

            {/* Tasdiqlangan — login tugmasi */}
            {appData.status === "APPROVED" && (
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.loginBtnText}>🔑 Tizimga kirish</Text>
              </TouchableOpacity>
            )}

            {/* Rad etilgan — qayta ariza */}
            {appData.status === "REJECTED" && (
              <TouchableOpacity
                style={styles.reapplyBtn}
                onPress={() => router.replace("/(auth)/register")}
              >
                <Text style={styles.reapplyBtnText}>📨 Qayta ariza yuborish</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.backToLoginText}>← Kirish sahifasiga qaytish</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  row:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  label:  { fontSize: 13, color: Colors.gray[500] },
  value:  { fontSize: 13, fontWeight: "600", color: Colors.gray[800], flex: 1, textAlign: "right" },
});

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  scroll:     { padding: 20, paddingBottom: 48 },

  header:     { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn:    { padding: 4 },
  backIcon:   { fontSize: 32, color: Colors.gray[700], lineHeight: 36 },
  title:      { fontSize: 22, fontWeight: "800", color: Colors.gray[900] },
  subtitle:   { fontSize: 13, color: Colors.gray[500], marginTop: 2 },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: Colors.gray[700], marginBottom: 8 },

  // Phone
  phoneBox:   { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: 12, backgroundColor: Colors.white, overflow: "hidden", marginBottom: 12 },
  phoneBoxFocused: { borderColor: Colors.primary },
  prefixBox:  { paddingHorizontal: 14, paddingVertical: 13, backgroundColor: Colors.gray[50] },
  prefixText: { fontSize: 15, fontWeight: "700", color: Colors.gray[700] },
  prefixDivider: { width: 1.5, height: 24, backgroundColor: Colors.gray[200] },
  phoneSuffix: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.gray[900] },

  // Error
  errorBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.dangerLight, padding: 12, borderRadius: 10, marginBottom: 12 },
  errorIcon:  { fontSize: 16 },
  errorText:  { flex: 1, fontSize: 13, color: Colors.danger },

  // Search button
  searchBtn:  { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  searchBtnDisabled: { opacity: 0.7 },
  searchBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

  // Result card
  resultCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
    marginBottom: 16,
  },
  statusBanner: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 14, borderRadius: 14, marginBottom: 16 },
  statusIcon:   { fontSize: 32 },
  statusLabel:  { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  statusDesc:   { fontSize: 12, color: Colors.gray[600], lineHeight: 17 },

  detailsBlock: { marginBottom: 12 },

  noteBox:    { backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.danger + "30" },
  noteTitle:  { fontSize: 13, fontWeight: "700", color: Colors.danger, marginBottom: 4 },
  noteText:   { fontSize: 13, color: Colors.gray[700], lineHeight: 18 },

  loginBtn:   { backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  loginBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

  reapplyBtn: { backgroundColor: Colors.primaryLight, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.primary + "40" },
  reapplyBtnText: { fontSize: 15, fontWeight: "600", color: Colors.primaryDark },

  backToLogin:     { alignItems: "center", paddingVertical: 8 },
  backToLoginText: { fontSize: 14, color: Colors.gray[500] },
});
