/**
 * BuloqWater — Mijozlarni ro'yxatdan o'tkazish ekrani (2026 redesign)
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
import { Feather, Ionicons } from "@expo/vector-icons";
import { Button, Input, Header, Screen } from "@/components/ui";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types";
import { theme, spacing, radius, fontSize, fontWeight } from "@/constants/theme";

const PREFIX = "+998";

function formatSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
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
      setSuffix(formatSuffix(text.slice(PREFIX.length)));
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
        user: { id: string; name: string; phone: string; role: string; address: string | null };
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
      await setAuth(data.token, {
        id: data.user.id,
        name: data.user.name,
        phone: data.user.phone,
        role: data.user.role as User["role"],
        company: null,
      });
      router.replace("/(customer)/home");
    } catch (e) {
      setError("Tarmoq ulanishini tekshiring");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Ro'yxatdan o'tish" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="water-sharp" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.welcomeText}>Sog'lom hayot sari</Text>
              <Text style={styles.mainTitle}>Yangi profil yarating</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Input label="Ismingiz" placeholder="Firdavs Negmatov" value={name} onChangeText={setName} autoCapitalize="words" icon="user" />

            <View style={{ marginBottom: spacing.base }}>
              <Text style={styles.fieldLabel}>Telefon raqamingiz</Text>
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

            <Input label="Xavfsiz parol" placeholder="Kamida 6 ta belgi" value={password} onChangeText={setPassword} secureTextEntry icon="lock" />
            <Input label="Parolni tasdiqlang" placeholder="Parolingizni qayta yozing" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry icon="lock" />
            <Input label="Yetkazish manzili (ixtiyoriy)" placeholder="Uy yoki ofis manzili" value={address} onChangeText={setAddress} autoCapitalize="words" icon="map-pin" />

            {error ? (
              <View style={styles.errorPill}>
                <Feather name="alert-circle" size={14} color={theme.danger} />
                <Text style={styles.errorPillText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={loading ? "Tayyorlanmoqda..." : "Ro'yxatdan o'tish"}
              onPress={handleRegister}
              loading={loading}
              iconRight={!loading ? <Feather name="chevron-right" size={18} color="#FFF" /> : undefined}
            />
          </View>

          <TouchableOpacity style={styles.loginRedirect} onPress={() => router.back()} activeOpacity={0.6}>
            <Text style={styles.redirectText}>
              Profilingiz bormi? <Text style={styles.redirectTextLink}>Kirish</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl, marginTop: spacing.sm },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: theme.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.primary },
  mainTitle: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.5 },

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

  errorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.dangerSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorPillText: { color: theme.danger, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },

  loginRedirect: { marginTop: spacing.xl, alignItems: "center", paddingVertical: spacing.sm },
  redirectText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium },
  redirectTextLink: { color: theme.primaryDark, fontWeight: fontWeight.bold },
});
