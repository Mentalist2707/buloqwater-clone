/**
 * BuloqWater — Yangi kompaniya ro'yxatdan o'tish arizasi (2026 redesign)
 * Umumiy yorug' "suv" temasi bilan izchil.
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
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button, Input, Header, Screen } from "@/components/ui";
import { api } from "@/services/api";
import { theme, spacing, radius, fontSize, fontWeight } from "@/constants/theme";

const PREFIX = "+998";

function formatSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

const STEPS = ["Ariza", "Tekshiruv", "Tizim"];

export default function RegisterScreen() {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  const fullPhone = PREFIX + suffix.replace(/\D/g, "");

  const handleSuffixChange = (text: string) => {
    if (text.startsWith(PREFIX)) setSuffix(formatSuffix(text.slice(PREFIX.length)));
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
    const r = await api.post<{ id: string; status: string; message: string }>("/applications", {
      companyName: companyName.trim(),
      ownerName: ownerName.trim(),
      phone: fullPhone,
      address: address.trim() || undefined,
      description: description.trim() || undefined,
    });
    setLoading(false);

    if (r.success && r.data) {
      Alert.alert("Zayavka yuborildi!", r.data.message, [
        {
          text: "Holatni tekshirish",
          onPress: () =>
            router.replace({ pathname: "/(auth)/application-status", params: { phone: fullPhone } }),
        },
      ]);
    } else {
      setError((r as any).error || "Xatolik yuz berdi");
    }
  };

  return (
    <Screen>
      <Header title="Firma qo'shish" subtitle="Hamkorlik tizimiga ariza" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Stepper */}
          <View style={styles.stepper}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                    {i === 0 ? (
                      <Feather name="edit-3" size={12} color="#FFF" />
                    ) : (
                      <Text style={styles.stepNum}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </React.Fragment>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input label="Kompaniya nomi" placeholder="Masalan: Buloq Toshkent MChJ" value={companyName} onChangeText={setCompanyName} autoCapitalize="words" icon="briefcase" />
            <Input label="Rahbarning ism familiyasi" placeholder="Masalan: Firdavs Negmatov" value={ownerName} onChangeText={setOwnerName} autoCapitalize="words" icon="user" />

            <View style={{ marginBottom: spacing.base }}>
              <Text style={styles.fieldLabel}>Telefon raqam</Text>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => phoneRef.current?.focus()}
                style={[styles.phoneBox, phoneFocused && styles.phoneBoxFocused]}
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
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  maxLength={12}
                />
              </TouchableOpacity>
            </View>

            <Input label="Geografik manzil (ixtiyoriy)" placeholder="Shahar, tuman, ko'cha..." value={address} onChangeText={setAddress} icon="map-pin" />
            <Input
              label="Qo'shimcha izoh (ixtiyoriy)"
              placeholder="Suv yetkazish hajmi, transportlar soni..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              icon="message-square"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={theme.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={loading ? "Yuborilmoqda..." : "Zayavka yuborish"}
              onPress={handleSubmit}
              loading={loading}
              iconRight={!loading ? <Feather name="arrow-right" size={18} color="#FFF" /> : undefined}
            />

            <TouchableOpacity style={styles.checkLink} onPress={() => router.push("/(auth)/application-status")} activeOpacity={0.7}>
              <Text style={styles.checkLinkText}>Avvalgi ariza holatini tekshirish</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
              <Feather name="info" size={16} color={theme.primaryDark} />
              <Text style={styles.infoTitle}>Jarayon qanday ishlaydi?</Text>
            </View>
            <InfoItem text="Ariza zudlik bilan super-admin paneliga tushadi." />
            <InfoItem text="Operator 1-2 soat ichida ma'lumotlarni tasdiqlash uchun bog'lanadi." />
            <InfoItem text="Tasdiqlangach, direktor statusi faollashtiriladi." />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function InfoItem({ text }: { text: string }) {
  return (
    <View style={styles.infoItemRow}>
      <View style={styles.infoDot} />
      <Text style={styles.infoItem}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: theme.primary },
  stepNum: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: theme.textMuted },
  stepLabel: { fontSize: fontSize.sm, color: theme.textMuted, fontWeight: fontWeight.medium },
  stepLabelActive: { color: theme.primaryDark, fontWeight: fontWeight.bold },
  stepLine: { flex: 1, height: 2, backgroundColor: theme.border, marginHorizontal: spacing.sm },

  form: {
    backgroundColor: theme.surface,
    borderRadius: radius["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary, marginBottom: 6, paddingLeft: 2 },
  phoneBox: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  phoneBoxFocused: { borderColor: theme.primary, backgroundColor: theme.primaryTint },
  prefixBox: { backgroundColor: theme.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, marginLeft: 8 },
  prefixText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.textSecondary },
  phoneSuffix: { flex: 1, height: "100%", fontSize: fontSize.base, color: theme.text, paddingHorizontal: 12 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: fontSize.sm, color: theme.danger, fontWeight: fontWeight.semibold },

  checkLink: { alignItems: "center", marginTop: spacing.base, paddingVertical: spacing.xs },
  checkLinkText: { fontSize: fontSize.sm, color: theme.primaryDark, fontWeight: fontWeight.semibold, textDecorationLine: "underline" },

  infoCard: {
    marginTop: spacing.base,
    backgroundColor: theme.primaryTint,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.primarySoft,
  },
  infoTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  infoTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  infoItemRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  infoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary, marginTop: 7 },
  infoItem: { flex: 1, fontSize: fontSize.sm, color: theme.textSecondary, lineHeight: 20, fontWeight: fontWeight.medium },
});
