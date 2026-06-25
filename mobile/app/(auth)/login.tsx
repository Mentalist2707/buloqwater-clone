import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

const PREFIX = "+998";

// Faqat raqamlarni qoldiradi, 9 tadan oshirmaydi
function formatSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  // XX XXX XX XX formatida ko'rsatish
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

export default function LoginScreen() {
  // suffix — +998 dan keyingi qism (faqat raqamlar + formatlanish bo'shliqlari)
  const [suffix, setSuffix]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  const { setAuth, setPendingSelection } = useAuthStore();

  // API ga yuborishda: +998XXXXXXXXX (faqat raqamlar)
  const fullPhone = PREFIX + suffix.replace(/\D/g, "");

  const handleSuffixChange = (text: string) => {
    // Agar PREFIX o'chirilmoqchi bo'lsa — bo'sh suffix saqlaymiz
    if (text.startsWith(PREFIX)) {
      const after = text.slice(PREFIX.length);
      setSuffix(formatSuffix(after));
    } else if (text.length === 0) {
      setSuffix("");
    } else {
      // Faqat raqam terilgan — qo'shamiz
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Header */}
        <View style={styles.header}>
          <Text style={styles.logoIcon}>💧</Text>
          <Text style={styles.logoText}>BuloqWater</Text>
          <Text style={styles.subtitle}>Suv yetkazib berish tizimi</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Telefon — +998 prefix o'chirtib bo'lmaydi */}
          <Text style={styles.inputLabel}>Telefon raqam</Text>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => phoneRef.current?.focus()}
            style={[styles.phoneBox, phoneFocused && styles.phoneBoxFocused]}
          >
            {/* O'chirtib bo'lmaydigan prefix */}
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
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              maxLength={12}   // "90 123 45 67" = 12 belgi
              returnKeyType="next"
            />
          </TouchableOpacity>

          <Input
            label="Parol"
            placeholder="Parolingizni kiriting"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Kirish"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.loginButton}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Kompaniya kodini bilmasangiz, shunchaki telefon va parol bilan kiring
        </Text>

        {/* Register link */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerBtnText}>🏢 Yangi firma qo'shish — Zayavka yuborish</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: { alignItems: "center", marginBottom: 40 },
  logoIcon: { fontSize: 56, marginBottom: 8 },
  logoText: { fontSize: 28, fontWeight: "800", color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.gray[500], marginTop: 4 },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: Colors.danger, fontSize: 13, textAlign: "center" },
  loginButton: { marginTop: 8 },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 24,
    paddingHorizontal: 20,
  },
  registerBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + "50",
    backgroundColor: Colors.primaryLight,
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryDark,
  },

  // Phone input
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray[700],
    marginBottom: 6,
  },
  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    backgroundColor: Colors.white,
    marginBottom: 16,
    overflow: "hidden",
  },
  phoneBoxFocused: {
    borderColor: Colors.primary,
  },
  prefixBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.gray[50],
  },
  prefixText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.gray[700],
    letterSpacing: 0.5,
  },
  prefixDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: Colors.gray[200],
  },
  phoneSuffix: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.gray[900],
    letterSpacing: 0.5,
  },
});
