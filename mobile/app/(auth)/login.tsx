import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setAuth, setPendingSelection } = useAuthStore();

  const handleLogin = async () => {
    setError("");

    if (!phone.trim()) {
      setError("Telefon raqamni kiriting");
      return;
    }
    if (!password.trim()) {
      setError("Parolni kiriting");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(phone.trim(), password);

      if (!result.success) {
        setError(result.error || "Xatolik yuz berdi");
        return;
      }

      const data = result.data!;

      if (data.type === "authenticated") {
        // To'g'ridan-to'g'ri kirish
        await setAuth(data.token!, data.user!);
        // Role-based redirect
        navigateByRole(data.user!.role);
      } else if (data.type === "select_company") {
        // Bir nechta kompaniya — tanlash ekraniga yo'naltirish
        setPendingSelection(data.companies!, phone.trim(), password);
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
      case "OPERATOR":
      case "DIRECTOR":
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
          <Input
            label="Telefon raqam"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

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
});
