/**
 * Firma zayavkasi — yangi kompaniya ro'yxatdan o'tish uchun ariza
 */
import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
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

// ─── Reusable field ──────────────────────────────────────────
function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={field.wrapper}>
      <Text style={field.label}>
        {label}{required && <Text style={field.req}> *</Text>}
      </Text>
      {children}
    </View>
  );
}
const field = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label:   { fontSize: 14, fontWeight: "500", color: Colors.gray[700], marginBottom: 6 },
  req:     { color: Colors.danger },
});

// ─── Text input style ────────────────────────────────────────
const inputStyle = {
  base: {
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.gray[900],
    backgroundColor: Colors.white,
  } as any,
  focused: { borderColor: Colors.primary } as any,
  multiline: { height: 80, textAlignVertical: "top" as any, paddingTop: 12 },
};

export default function RegisterScreen() {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName]     = useState("");
  const [suffix, setSuffix]           = useState("");
  const [address, setAddress]         = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const phoneRef = useRef<TextInput>(null);

  const fullPhone = PREFIX + suffix.replace(/\D/g, "");

  const handleSuffixChange = (text: string) => {
    if (text.startsWith(PREFIX)) setSuffix(formatSuffix(text.slice(PREFIX.length)));
    else if (text.length === 0)  setSuffix("");
    else                         setSuffix(formatSuffix(text));
  };

  const handleSubmit = async () => {
    setError("");

    if (!companyName.trim()) { setError("Kompaniya nomi kiritilmadi"); return; }
    if (!ownerName.trim())   { setError("Ism familiya kiritilmadi"); return; }
    const digits = suffix.replace(/\D/g, "");
    if (digits.length < 9)   { setError("Telefon raqamni to'liq kiriting"); return; }

    setLoading(true);
    const r = await api.post<{ id: string; status: string; message: string }>(
      "/applications",
      {
        companyName: companyName.trim(),
        ownerName:   ownerName.trim(),
        phone:       fullPhone,
        address:     address.trim() || undefined,
        description: description.trim() || undefined,
      }
    );
    setLoading(false);

    if (r.success && r.data) {
      Alert.alert(
        "✅ Zayavka yuborildi!",
        r.data.message,
        [{
          text: "Holati tekshirish",
          onPress: () => router.replace({
            pathname: "/(auth)/application-status",
            params: { phone: fullPhone },
          }),
        }]
      );
    } else {
      setError((r as any).error || "Xatolik yuz berdi");
    }
  };

  const iStyle = (name: string) => [
    inputStyle.base,
    focusedField === name && inputStyle.focused,
  ];

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
          <View style={styles.headerText}>
            <Text style={styles.title}>Firma qo'shish</Text>
            <Text style={styles.subtitle}>
              Zayavkangizni to'ldiring — super admin ko'rib chiqadi
            </Text>
          </View>
        </View>

        {/* Stepper hint */}
        <View style={styles.stepsRow}>
          {["Ariza", "Ko'rib chiqish", "Kirish"].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i === 0 && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
              {i < 2 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Field label="Kompaniya nomi" required>
            <TextInput
              style={iStyle("company")}
              placeholder="Masalan: Toza Suv MChJ"
              placeholderTextColor={Colors.gray[400]}
              value={companyName}
              onChangeText={setCompanyName}
              onFocus={() => setFocusedField("company")}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
          </Field>

          <Field label="Rahbar ismi familiyasi" required>
            <TextInput
              style={iStyle("owner")}
              placeholder="Masalan: Bobur Toshmatov"
              placeholderTextColor={Colors.gray[400]}
              value={ownerName}
              onChangeText={setOwnerName}
              onFocus={() => setFocusedField("owner")}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
          </Field>

          <Field label="Telefon raqam" required>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => phoneRef.current?.focus()}
              style={[
                styles.phoneBox,
                focusedField === "phone" && styles.phoneBoxFocused,
              ]}
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
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                maxLength={12}
                returnKeyType="next"
              />
            </TouchableOpacity>
          </Field>

          <Field label="Manzil">
            <TextInput
              style={iStyle("address")}
              placeholder="Shahar, tuman, ko'cha... (ixtiyoriy)"
              placeholderTextColor={Colors.gray[400]}
              value={address}
              onChangeText={setAddress}
              onFocus={() => setFocusedField("address")}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
          </Field>

          <Field label="Qo'shimcha ma'lumot">
            <TextInput
              style={[iStyle("desc"), inputStyle.multiline]}
              placeholder="Biznesingiz haqida qisqacha... (ixtiyoriy)"
              placeholderTextColor={Colors.gray[400]}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocusedField("desc")}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={3}
            />
          </Field>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.submitText}>📨 Zayavka yuborish</Text>
            }
          </TouchableOpacity>

          {/* Check status link */}
          <TouchableOpacity
            style={styles.checkLink}
            onPress={() => router.push("/(auth)/application-status")}
          >
            <Text style={styles.checkLinkText}>
              Avvalgi zayavka holatini tekshirish →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info block */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Jarayon qanday ishlaydi?</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>📨 Zayavkangiz super adminга yuboriladi</Text>
            <Text style={styles.infoItem}>⏱ Ko'rib chiqish 1-2 ish kuni ichida</Text>
            <Text style={styles.infoItem}>📞 Admin siz bilan telefon orqali bog'lanadi</Text>
            <Text style={styles.infoItem}>✅ Tasdiqlangach login ma'lumotlari yuboriladi</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  scroll:     { padding: 20, paddingBottom: 48 },

  // Header
  header:     { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 24 },
  backBtn:    { padding: 4, marginTop: 2 },
  backIcon:   { fontSize: 32, color: Colors.gray[700], lineHeight: 36 },
  headerText: { flex: 1 },
  title:      { fontSize: 24, fontWeight: "800", color: Colors.gray[900] },
  subtitle:   { fontSize: 13, color: Colors.gray[500], marginTop: 4, lineHeight: 18 },

  // Steps
  stepsRow:   { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  stepItem:   { flexDirection: "row", alignItems: "center" },
  stepDot:    { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gray[200], alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: Colors.primary },
  stepNum:    { fontSize: 12, fontWeight: "700", color: Colors.gray[500] },
  stepNumActive: { color: Colors.white },
  stepLabel:  { fontSize: 11, color: Colors.gray[400], marginHorizontal: 6 },
  stepLabelActive: { color: Colors.primary, fontWeight: "600" },
  stepLine:   { width: 20, height: 2, backgroundColor: Colors.gray[200] },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
    marginBottom: 16,
  },

  // Phone
  phoneBox: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: Colors.gray[200],
    borderRadius: 12, backgroundColor: Colors.white, overflow: "hidden",
  },
  phoneBoxFocused: { borderColor: Colors.primary },
  prefixBox:  { paddingHorizontal: 14, paddingVertical: 13, backgroundColor: Colors.gray[50] },
  prefixText: { fontSize: 15, fontWeight: "700", color: Colors.gray[700], letterSpacing: 0.5 },
  prefixDivider: { width: 1.5, height: 24, backgroundColor: Colors.gray[200] },
  phoneSuffix:{ flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.gray[900], letterSpacing: 0.5 },

  // Error
  errorBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.dangerLight, padding: 12, borderRadius: 10, marginBottom: 14 },
  errorIcon:  { fontSize: 16 },
  errorText:  { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: "500" },

  // Submit
  submitBtn:  { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 16, fontWeight: "700", color: Colors.white },

  // Check link
  checkLink:  { alignItems: "center", marginTop: 14, padding: 4 },
  checkLinkText: { fontSize: 13, color: Colors.primary, fontWeight: "500" },

  // Info card
  infoCard:   { backgroundColor: "#EFF6FF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#BFDBFE" },
  infoTitle:  { fontSize: 14, fontWeight: "700", color: Colors.primary, marginBottom: 10 },
  infoList:   { gap: 6 },
  infoItem:   { fontSize: 13, color: Colors.gray[700], lineHeight: 18 },
});
