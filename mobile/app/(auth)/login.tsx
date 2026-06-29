/**
 * BuloqWater — Tizimga kirish ekrani
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
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { authService } from "@/services/auth";
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

export default function LoginScreen() {
  const [suffix, setSuffix] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  const { setAuth, setPendingSelection } = useAuthStore();
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

  const handleLogin = async () => {
    setError("");
    const digits = suffix.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Telefon raqamni to'liq kiriting (9 ta raqam)");
      return;
    }
    if (!password.trim()) {
      setError("Parolni kiriting");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(fullPhone, password);
      if (!result.success) {
        setError(result.error || "Xatolik yuz berdi");
        return;
      }

      const data = result.data!;
      if (data.type === "authenticated") {
        await setAuth(data.token!, data.user!);
        navigateByRole(data.user!.role);
      } else if (data.type === "select_company") {
        setPendingSelection(data.companies!, fullPhone, password);
        router.push("/(auth)/select-company");
      }
    } catch (e) {
      setError("Tarmoq xatosi. Qayta urinib ko'ring");
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (role: string) => {
    switch (role) {
      case "DRIVER":
        router.replace("/(driver)/tasks");
        break;
      case "DIRECTOR":
        router.replace("/(admin)/dashboard");
        break;
      case "SUPER_ADMIN":
        router.replace("/(superadmin)/dashboard");
        break;
      case "CUSTOMER":
        router.replace("/(customer)/home");
        break;
      case "OPERATOR":
        router.replace("/(operator)/orders");
        break;
      default:
        router.replace("/(operator)/orders");
    }
  };

  return (
    <LinearGradient
      colors={["#E6FFFA", "#EBF5FF", "#F4FAFF"]} // Bir xil toza, iliq suv muhiti foni
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
          {/* Logo / Header (Yumshoq Organik Tipografika) */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="water" size={42} color="#06B6D4" />
            </View>
            <Text style={styles.logoText}>BuloqWater</Text>
            <Text style={styles.subtitle}>
              Toza ichimlik suvini tez va qulay buyurtma qiling
            </Text>
          </View>

          {/* Form Layer (Claymorphism Oq Quti) */}
          <View style={styles.form}>
            {/* Telefon */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Telefon raqam</Text>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => phoneRef.current?.focus()}
                style={[
                  styles.phoneBox,
                  phoneFocused && styles.phoneBoxFocused,
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
                  placeholderTextColor="#A1A1AA"
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  maxLength={12}
                  returnKeyType="next"
                />
              </TouchableOpacity>
            </View>

            {/* Parol */}
            <View style={styles.inputWrapper}>
              <Input
                label="Parol"
                placeholder="Parolingizni kiriting"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#A1A1AA"
                style={styles.clayInput}
              />
            </View>

            {/* Error Container */}
            {error ? (
              <View style={styles.errorContainer}>
                <Feather name="info" size={14} color="#FF4D4F" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Kirish Tugmasi (Liquid Soft Gradient) */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.loginButtonWrapper}>
              <LinearGradient
                colors={["#06B6D4", "#0284C7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButtonGradient}>
                <Text style={styles.loginButtonText}>
                  {loading ? "Kirilmoqda..." : "Kirish"}
                </Text>
                <Feather name="chevron-right" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer Informational Text */}
          <Text style={styles.footer}>
            Kompaniya kodini bilmasangiz, shunchaki telefon va parol bilan
            kiring
          </Text>

          {/* Navigatsiya Havolalari (Nafis silliq tugmalar) */}
          <View style={styles.actionLinksContainer}>
            <TouchableOpacity
              style={styles.customerRegisterBtn}
              onPress={() => router.push("/(auth)/customer-register")}
              activeOpacity={0.7}>
              <Feather
                name="user"
                size={16}
                color="#10B981"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.customerRegisterBtnText}>
                Yangi mijoz — Ro'yxatdan o'tish
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.7}>
              <Feather
                name="briefcase"
                size={16}
                color="#0284C7"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.registerBtnText}>
                Yangi firma qo'shish — Zayavka
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Orqa fondagi harakatlanuvchi havorang "suyuqlik" pufakchalari
  fluidBubble1: {
    position: "absolute",
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(6, 182, 212, 0.05)",
  },
  fluidBubble2: {
    position: "absolute",
    bottom: 80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(59, 130, 246, 0.04)",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Header dizayni
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 30, // Silliq claymorphic burchak
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#06B6D4",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
    }),
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
    paddingHorizontal: 20,
  },

  // Claymorphic Oq Quti (Form)
  form: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.03,
        shadowRadius: 24,
      },
      android: { elevation: 4 },
    }),
  },

  inputWrapper: { gap: 4 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    paddingLeft: 4,
  },

  // Telefon kirish maydoni
  phoneBox: {
    height: 52,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.8)",
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  phoneBoxFocused: {
    borderColor: "#06B6D4",
    ...Platform.select({
      ios: {
        shadowColor: "#06B6D4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  prefixBox: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  phoneSuffix: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#0F172A",
  },

  // Parol uchun mukammal Claymorphic qobiq
  passwordBox: {
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.8)",
    backgroundColor: "#FFF",
    overflow: "hidden",
    height: 52,
    justifyContent: "center",
  },
  passwordBoxFocused: {
    borderColor: "#06B6D4",
    ...Platform.select({
      ios: {
        shadowColor: "#06B6D4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },

  // Error xabari
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },

  // Liquid Kirish Tugmasi
  loginButtonWrapper: {
    marginTop: 6,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  loginButtonGradient: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Eslatma matni
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
  },

  // Pastki havolalar
  actionLinksContainer: {
    gap: 12,
    marginTop: 24,
  },
  customerRegisterBtn: {
    height: 52,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  customerRegisterBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  registerBtn: {
    height: 52,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BEE3F8",
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0284C7",
  },
});
