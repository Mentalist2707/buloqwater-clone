/**
 * BuloqWater — Tizimga kirish ekrani (2026 redesign)
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
import { Input, Button, Screen } from "@/components/ui";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { theme, palette, gradients, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const PREFIX = "+998";

function formatSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
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
      setSuffix(formatSuffix(text.slice(PREFIX.length)));
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
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <LinearGradient colors={gradients.brand} style={[styles.logo, shadow.brand]}>
              <Ionicons name="water" size={40} color="#FFF" />
            </LinearGradient>
            <Text style={styles.logoText}>BuloqWater</Text>
            <Text style={styles.subtitle}>Toza ichimlik suvini tez va qulay buyurtma qiling</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Telefon raqam</Text>
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
                  returnKeyType="next"
                />
              </TouchableOpacity>
            </View>

            <Input
              label="Parol"
              placeholder="Parolingizni kiriting"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock"
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={14} color={theme.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={loading ? "Kirilmoqda..." : "Kirish"}
              onPress={handleLogin}
              loading={loading}
              iconRight={!loading ? <Feather name="chevron-right" size={18} color="rgba(255, 255, 255, 1)" /> : undefined}
            />
          </View>

          <Text style={styles.footer}>
            Kompaniya kodini bilmasangiz, shunchaki telefon va parol bilan kiring
          </Text>

          <View style={styles.actionLinks}>
            <TouchableOpacity
              style={[styles.linkBtn, { backgroundColor: theme.successSoft, borderColor: palette.mint400 + "66" }]}
              onPress={() => router.push("/(auth)/customer-register")}
              activeOpacity={0.7}
            >
              <Feather name="user-plus" size={16} color={theme.success} />
              <Text style={[styles.linkText, { color: palette.mint600 }]}>Ro'yxatdan o'tish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkBtn, { backgroundColor: theme.primaryTint, borderColor: palette.aqua200 }]}
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.7}
            >
              <Feather name="briefcase" size={16} color={theme.primaryDark} />
              <Text style={[styles.linkText, { color: theme.primaryDark }]}>Firma egasimisiz?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["3xl"],
  },
  header: { alignItems: "center", marginBottom: spacing["2xl"] },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  logoText: { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.6 },
  subtitle: {
    marginTop: spacing.sm,
    color: theme.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontSize: fontSize.base,
    paddingHorizontal: spacing.lg,
  },
  form: {
    backgroundColor: theme.surface,
    borderRadius: radius["2xl"],
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.md,
  },
  inputWrapper: { marginBottom: spacing.sm },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: theme.textSecondary,
    marginBottom: 6,
    paddingLeft: 2,
  },
  phoneBox: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  phoneBoxFocused: { borderColor: theme.primary, backgroundColor: theme.primaryTint },
  prefixBox: {
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginLeft: 8,
  },
  prefixText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.textSecondary },
  phoneSuffix: { flex: 1, height: "100%", paddingHorizontal: 12, fontSize: fontSize.base, color: theme.text },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  errorText: { color: theme.danger, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },

  footer: {
    marginTop: spacing.lg,
    textAlign: "center",
    color: theme.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  actionLinks: { gap: spacing.md, marginTop: spacing.xl },
  linkBtn: {
    height: 52,
    borderRadius: radius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
  },
  linkText: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
});
