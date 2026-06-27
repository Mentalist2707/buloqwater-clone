/**
 * Oddiy mijoz ro'yxatdan o'tish ekrani
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
import { Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

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

    // Validatsiya
    if (!name.trim()) {
      setError("Ismingizni kiriting");
      return;
    }

    const digits = suffix.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Telefon raqamni to'liq kiriting (9 ta raqam)");
      return;
    }

    if (!password.trim()) {
      setError("Parolni kiriting");
      return;
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi");
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
        setError(result.error || "Xatolik yuz berdi");
        return;
      }

      const data = result.data!;
      await setAuth(data.token, data.user);
      router.replace("/(customer)/home");
    } catch (e) {
      setError("Tarmoq xatosi. Qayta urinib ko'ring");
    } finally {
      setLoading(false);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.logoIcon}>👤</Text>
            <Text style={styles.logoText}>Ro'yxatdan o'tish</Text>
            <Text style={styles.subtitle}>Suv buyurtma qilish uchun</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Ismingiz"
            placeholder="Masalan: Bobur Toshmatov"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          {/* Telefon */}
          <Text style={styles.inputLabel}>Telefon raqam</Text>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => phoneRef.current?.focus()}
            style={[styles.phoneBox, phoneFocused && styles.phoneBoxFocused]}
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
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              maxLength={12}
              returnKeyType="next"
            />
          </TouchableOpacity>

          <Input
            label="Parol (kamida 6 ta belgi)"
            placeholder="Parolingizni kiriting"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Parolni tasdiqlang"
            placeholder="Parolni qayta kiriting"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Input
            label="Manzil (ixtiyoriy)"
            placeholder="Yashash manzilingiz"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="words"
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Ro'yxatdan o'tish"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.registerButton}
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Ro'yxatdan o'tganingizdan so'ng suv buyurtma qilishingiz mumkin
          </Text>
        </View>

        {/* Login link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.back()}
        >
          <Text style={styles.loginLinkText}>
            Akkauntingiz bormi? Kirish →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 32, color: Colors.gray[700], lineHeight: 36 },
  headerText: { flex: 1 },
  logoIcon: { fontSize: 40, marginBottom: 8 },
  logoText: { fontSize: 24, fontWeight: "800", color: Colors.primary },
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
    marginBottom: 16,
  },
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
  errorContainer: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: Colors.danger, fontSize: 13, textAlign: "center" },
  registerButton: { marginTop: 8 },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  infoIcon: { fontSize: 20 },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[700],
    lineHeight: 18,
  },
  loginLink: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
});
