/**
 * BuloqWater — Mijozlarni ro'yxatdan o'tkazish ekrani
 * Organic Liquid Glassmorphism & Claymorphism Style
 */
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Button, Input } from "@/components/ui";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

const PREFIX = "+998";

function formatSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7)
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

export default function CustomerRegisterScreen() {
  const [name, setName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  const { setAuth } = useAuthStore();
  const fullPhone = PREFIX + suffix.replace(/\D/g, "");

  const handleSuffixChange = (text: string) => {
    if (text.startsWith(PREFIX)) {
      const after = text.slice(PREFIX.length);
      setSuffix(formatSuffix(after));
    } else if (text.length === 0) {
      setSuffix("");
    } else {
      setSuffix(formatSuffix(text));
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }
    const digits = suffix.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Telefon raqamingiz to'liq emas");
      return;
    }
    if (!password.trim()) {
      setError("Yangi parol yarating");
      return;
    }
    if (password.length < 6) {
      setError("Parol o'ta oddiy (kamida 6 belgi)");
      return;
    }
    if (password !== confirmPassword) {
      setError("Tasdiqlash paroli mos kelmadi");
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{
        type: string;
        token: string;
        user: {
          id: string;
          name: string;
          phone: string;
          role: string;
          address: string | null;
        };
      }>("/auth/register", {
        name: name.trim(),
        phone: fullPhone,
        password,
        address: address.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
        return;
      }

      const data = result.data!;
      await setAuth(data.token, data.user);
      router.replace("/(customer)/home");
    } catch (e) {
      setError("Tarmoq ulanishini tekshiring");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#E6FFFA", "#EBF5FF", "#F0Fdf4"]} // Suyuq, juda mayin va toza suvli gradient foni
      style={styles.container}>
      {/* Fonda suzib yuruvchi silliq organik elementlar */}
      <View style={styles.fluidBubble1} />
      <View style={styles.fluidBubble2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backCircle}
              activeOpacity={0.6}>
              <Feather name="arrow-left" size={20} color="#0E7490" />
            </TouchableOpacity>

            <View style={styles.brandWaterBadge}>
              <Ionicons name="water-sharp" size={12} color="#06B6D4" />
              <Text style={styles.brandBadgeText}>BuloqWater</Text>
            </View>
          </View>

          {/* Header Texts */}
          <View style={styles.headerBlock}>
            <Text style={styles.welcomeText}>Sog'lom hayot sari ✨</Text>
            <Text style={styles.mainTitle}>Yangi profil yarating</Text>
          </View>

          {/* Liquid Form Fields Container */}
          <View style={styles.mainForm}>
            {/* Ism */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Ismingiz</Text>
              <Input
                placeholder="Firdavs Negmatov"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#A1A1AA"
                style={styles.clayInput}
              />
            </View>

            {/* Telefon raqam */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Telefon raqamingiz</Text>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => phoneRef.current?.focus()}
                style={[
                  styles.phoneClayBox,
                  phoneFocused && styles.phoneClayBoxFocused,
                ]}>
                <View style={styles.prefixPill}>
                  <Text style={styles.prefixText}>+998</Text>
                </View>
                <TextInput
                  ref={phoneRef}
                  style={styles.phoneInput}
                  value={suffix}
                  onChangeText={handleSuffixChange}
                  keyboardType="phone-pad"
                  placeholder="90 123 45 67"
                  placeholderTextColor="#A1A1AA"
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  maxLength={12}
                />
              </TouchableOpacity>
            </View>

            {/* Parol */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Xavfsiz parol</Text>
              <Input
                placeholder="Kamida 6 ta belgi kiriting"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#A1A1AA"
                style={styles.clayInput}
              />
            </View>

            {/* Parolni tasdiqlash */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Parolni tasdiqlang</Text>
              <Input
                placeholder="Parolingizni qayta yozing"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#A1A1AA"
                style={styles.clayInput}
              />
            </View>

            {/* Manzil */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>
                Yetkazish manzili (ixtiyoriy)
              </Text>
              <Input
                placeholder="Uy yoki ofis manzili"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
                placeholderTextColor="#A1A1AA"
                style={styles.clayInput}
              />
            </View>

            {/* Error Container */}
            {error ? (
              <View style={styles.errorPill}>
                <Feather name="info" size={14} color="#EF4444" />
                <Text style={styles.errorPillText}>{error}</Text>
              </View>
            ) : null}

            {/* Soft Liquid Interactive Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.liquidBtn}>
              <LinearGradient
                colors={["#06B6D4", "#0284C7"]} // Fluid Cyan-Blue gibrid tugma
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liquidBtnGradient}>
                <Text style={styles.liquidBtnText}>
                  {loading ? "Tayyorlanmoqda..." : "Ro'yxatdan o'tish"}
                </Text>
                <Feather name="chevron-right" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Back to Login Redirect */}
          <TouchableOpacity
            style={styles.loginRedirect}
            onPress={() => router.back()}
            activeOpacity={0.6}>
            <Text style={styles.redirectText}>
              Profilingiz bormi?{" "}
              <Text style={styles.redirectTextLink}>Kirish</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Suyuq va dumaloq fon elementlari
  fluidBubble1: {
    position: "absolute",
    top: 120,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(6, 182, 212, 0.06)",
    transform: [{ scaleX: 1.2 }],
  },
  fluidBubble2: {
    position: "absolute",
    bottom: -20,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(34, 197, 94, 0.05)",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 40,
  },

  // Top Row Elements
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0E7490",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  brandWaterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#0E7490",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  brandBadgeText: { fontSize: 12, fontWeight: "700", color: "#155E75" },

  // Header Typography
  headerBlock: { marginBottom: 28 },
  welcomeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0EA5E9",
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.6,
  },

  // Claymorphic Inputs Setup (Yumshoq suv toshlari effekti)
  mainForm: { gap: 18 },
  inputWrapper: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    paddingLeft: 4,
  },

  clayInput: {
    backgroundColor: "#FFF",
    borderColor: "rgba(226, 232, 240, 0.8)",
    borderWidth: 1.5,
    borderRadius: 20, // O'ta yumshoq burchaklar
    height: 52,
    fontSize: 15,
    color: "#0F172A",
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.02,
        shadowRadius: 12,
      },
      android: { elevation: 1 },
    }),
  },

  // Custom Smooth Phone Box
  phoneClayBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "rgba(226, 232, 240, 0.8)",
    borderWidth: 1.5,
    borderRadius: 20,
    height: 52,
  },
  phoneClayBoxFocused: {
    borderColor: "#06B6D4",
    ...Platform.select({
      ios: {
        shadowColor: "#06B6D4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  prefixPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  prefixText: { fontSize: 14, fontWeight: "700", color: "#334155" },
  phoneInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#0F172A",
    paddingHorizontal: 12,
  },

  // Soft Error Pill
  errorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  errorPillText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },

  // Smooth Cloud/Liquid Button
  liquidBtn: {
    marginTop: 8,
    borderRadius: 22,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  liquidBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  liquidBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // Redirect Link
  loginRedirect: { marginTop: 24, alignItems: "center", paddingVertical: 8 },
  redirectText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  redirectTextLink: { color: "#0284C7", fontWeight: "700" },
});
