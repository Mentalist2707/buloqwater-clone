/**
 * BuloqWater — Yangi kompaniya ro'yxatdan o'tish arizasi
 * Premium Glassmorphism & Gradient Design System
 */
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants";
import { api } from "@/services/api";

const { width } = Dimensions.get("window");
const PREFIX = "+998";

function formatSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7)
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

// ─── Glassmorphic Container ─────────────────────────────────
function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={25} tint="light" style={[styles.glassCard, style]}>
        {children}
      </BlurView>
    );
  }
  // Android uchun muqobil (Yumshoq yarim-shaffof fon)
  return <View style={[styles.glassCardAndroid, style]}>{children}</View>;
}

// ─── Input Field Wrapper ─────────────────────────────────────
function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <View style={fieldStyles.labelRow}>
        {icon}
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.req}> *</Text>}
        </Text>
      </View>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.3,
  },
  req: { color: "#FF4D4F" },
});

export default function RegisterScreen() {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const phoneRef = useRef<TextInput>(null);

  const fullPhone = PREFIX + suffix.replace(/\D/g, "");

  const handleSuffixChange = (text: string) => {
    if (text.startsWith(PREFIX))
      setSuffix(formatSuffix(text.slice(PREFIX.length)));
    else if (text.length === 0) setSuffix("");
    else setSuffix(formatSuffix(text));
  };

  const handleSubmit = async () => {
    setError("");
    if (!companyName.trim()) {
      setError("Kompaniya nomi kiritilmadi");
      return;
    }
    if (!ownerName.trim()) {
      setError("Ism familiya kiritilmadi");
      return;
    }
    if (suffix.replace(/\D/g, "").length < 9) {
      setError("Telefon raqamni to'liq kiriting");
      return;
    }

    setLoading(true);
    const r = await api.post<{ id: string; status: string; message: string }>(
      "/applications",
      {
        companyName: companyName.trim(),
        ownerName: ownerName.trim(),
        phone: fullPhone,
        address: address.trim() || undefined,
        description: description.trim() || undefined,
      },
    );
    setLoading(false);

    if (r.success && r.data) {
      Alert.alert("✅ Zayavka yuborildi!", r.data.message, [
        {
          text: "Holatni tekshirish",
          onPress: () =>
            router.replace({
              pathname: "/(auth)/application-status",
              params: { phone: fullPhone },
            }),
        },
      ]);
    } else {
      setError((r as any).error || "Xatolik yuz berdi");
    }
  };

  const getInputStyle = (name: string) => [
    styles.inputBase,
    focusedField === name && styles.inputFocused,
  ];

  return (
    <LinearGradient
      colors={["#0A2540", "#11477C", "#1A6AA3"]} // Premium Deep Water Gradient
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>Firma qo'shish</Text>
              <Text style={styles.subtitle}>
                BuloqWater hamkorlik tizimiga ariza yuborish
              </Text>
            </View>
          </View>

          {/* Premium Modern Stepper */}
          <View style={styles.stepsContainer}>
            {["Ariza", "Tekshiruv", "Tizim"].map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                  {i === 0 ? (
                    <Feather name="edit-3" size={12} color="#0A2540" />
                  ) : (
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  )}
                </View>
                <Text
                  style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>
                  {s}
                </Text>
                {i < 2 && <View style={styles.stepLine} />}
              </View>
            ))}
          </View>

          {/* Main Glassmorphic Form Card */}
          <GlassCard style={styles.cardSpace}>
            <Field
              label="Kompaniya nomi"
              required
              icon={<Feather name="briefcase" size={14} color="#38BDF8" />}>
              <TextInput
                style={getInputStyle("company")}
                placeholder="Masalan: Buloq Toshkent MChJ"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={companyName}
                onChangeText={setCompanyName}
                onFocus={() => setFocusedField("company")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />
            </Field>

            <Field
              label="Rahbarning ismi familiyasi"
              required
              icon={<Feather name="user" size={14} color="#38BDF8" />}>
              <TextInput
                style={getInputStyle("owner")}
                placeholder="Masalan: Firdavs Negmatov"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={ownerName}
                onChangeText={setOwnerName}
                onFocus={() => setFocusedField("owner")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />
            </Field>

            <Field
              label="Telefon raqam"
              required
              icon={<Feather name="phone" size={14} color="#38BDF8" />}>
              <View
                style={[
                  styles.phoneBox,
                  focusedField === "phone" && styles.phoneBoxFocused,
                ]}>
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
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  maxLength={12}
                />
              </View>
            </Field>

            <Field
              label="Geografik manzil"
              icon={<Feather name="map-pin" size={14} color="#38BDF8" />}>
              <TextInput
                style={getInputStyle("address")}
                placeholder="Shahar, tuman, ko'cha..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={address}
                onChangeText={setAddress}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />
            </Field>

            <Field
              label="Qo'shimcha izoh"
              icon={
                <MaterialCommunityIcons
                  name="comment-text-outline"
                  size={14}
                  color="#38BDF8"
                />
              }>
              <TextInput
                style={[getInputStyle("desc"), styles.multiline]}
                placeholder="Suv yetkazish hajmi, transportlar soni..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={description}
                onChangeText={setDescription}
                onFocus={() => setFocusedField("desc")}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={3}
              />
            </Field>

            {/* Error Feedback */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color="#FF4D4F"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Premium Material 3 / iOS Styled Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#0A2540" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Text style={styles.submitText}>Zayavka yuborish</Text>
                  <Feather name="arrow-right" size={16} color="#0A2540" />
                </View>
              )}
            </TouchableOpacity>

            {/* Status Check Link */}
            <TouchableOpacity
              style={styles.checkLink}
              onPress={() => router.push("/(auth)/application-status")}
              activeOpacity={0.7}>
              <Text style={styles.checkLinkText}>
                Avvalgi ariza holatini tekshirish
              </Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Info Glass Card */}
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
              <MaterialCommunityIcons
                name="water-check-outline"
                size={18}
                color="#38BDF8"
              />
              <Text style={styles.infoTitle}>Jarayon qanday ishlaydi?</Text>
            </View>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                ⚡ Ariza zudlik bilan super-admin paneliga tushadi.
              </Text>
              <Text style={styles.infoItem}>
                📞 Operator 1-2 soat ichida ma'lumotlarni tasdiqlash uchun
                bog'lanadi.
              </Text>
              <Text style={styles.infoItem}>
                💎 Tasdiqlangach, kompaniya direktori statusi faollashtiriladi.
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 26,
    marginTop: Platform.OS === "ios" ? 12 : 0,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  // Stepper UI
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 10,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: "#38BDF8" },
  stepNum: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
  stepLine: {
    width: width * 0.14,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 8,
    marginRight: -4,
  },
  stepLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
    marginLeft: 6,
  },
  stepLabelActive: { color: "#38BDF8", fontWeight: "700" },

  // Glassmorphism System Cards
  glassCard: {
    borderRadius: 28,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  glassCardAndroid: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: "rgba(20, 50, 90, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    elevation: 4,
  },
  cardSpace: { marginBottom: 20 },

  // Inputs & Fields (Material 3 Touch)
  inputBase: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#FFF",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  inputFocused: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  multiline: { height: 90, textAlignVertical: "top", paddingTop: 14 },

  // Phone Input Customization
  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  phoneBoxFocused: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  prefixBox: { paddingLeft: 16, paddingRight: 8, justifyContent: "center" },
  prefixText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  phoneSuffix: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    color: "#FFF",
    letterSpacing: 0.5,
  },

  // Error Message Box
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,77,79,0.15)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,77,79,0.25)",
  },
  errorText: { flex: 1, fontSize: 13, color: "#FF4D4F", fontWeight: "600" },

  // Call-To-Action Button (Solid Pop-up)
  submitBtn: {
    backgroundColor: "#38BDF8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.5, backgroundColor: "rgba(255,255,255,0.3)" },
  submitBtnContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  submitText: { fontSize: 16, fontWeight: "700", color: "#0A2540" },

  // Modern Text Buttons
  checkLink: { alignItems: "center", marginTop: 18, paddingVertical: 2 },
  checkLinkText: {
    fontSize: 13,
    color: "#38BDF8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Info Block Design
  infoCard: { padding: 18 },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 0.1,
  },
  infoList: { gap: 10 },
  infoItem: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
    fontWeight: "500",
  },
});
