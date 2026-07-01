/**
 * LockScreen — ilovaga kirishdagi PIN-kod qulfi ekrani.
 * ────────────────────────────────────────────────────────────
 * PIN yoqilgan bo'lsa, ilova ochilganda/fon'dan qaytganda ko'rsatiladi.
 * To'g'ri kod kiritilsa qulf ochiladi. Kodni unutgan bo'lsa — chiqib
 * qaytadan kirish mumkin.
 */
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Alert } from "@/utils/alert";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { PinPad } from "@/components/PinPad";
import { usePinStore } from "@/store/pin";
import { useAuthStore } from "@/store/auth";
import { gradients, fontSize, fontWeight, spacing } from "@/constants/theme";

const PIN_LENGTH = 4;

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const { verify, unlock } = usePinStore();
  const { user, logout } = useAuthStore();
  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (code.length !== PIN_LENGTH) return;
    (async () => {
      const ok = await verify(code);
      if (ok) {
        unlock();
      } else {
        setErrorKey((k) => k + 1);
        setErrorMsg("Kod noto'g'ri. Qayta urinib ko'ring");
        setTimeout(() => setCode(""), 220);
      }
    })();
  }, [code, verify, unlock]);

  const handleForgot = () => {
    Alert.alert(
      "Kodni unutdingizmi?",
      "Tizimdan chiqib, telefon va parol bilan qayta kirishingiz mumkin. PIN-kod o'chiriladi.",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Chiqish",
          style: "destructive",
          onPress: async () => {
            await usePinStore.getState().removePin();
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={gradients.ocean} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + 40 }]}>
        <View style={styles.lockCircle}>
          <Ionicons name="lock-closed" size={30} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Xush kelibsiz{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</Text>
        <Text style={styles.subtitle}>Davom etish uchun PIN-kodni kiriting</Text>
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : <View style={styles.errorSpace} />}
      </View>

      <View style={styles.padZone}>
        <PinPad value={code} onChange={(v) => { setCode(v); setErrorMsg(""); }} length={PIN_LENGTH} errorKey={errorKey} tone="dark" />
      </View>

      <TouchableOpacity style={[styles.forgot, { marginBottom: insets.bottom + 24 }]} onPress={handleForgot} activeOpacity={0.7}>
        <Feather name="help-circle" size={15} color="rgba(255,255,255,0.9)" />
        <Text style={styles.forgotText}>Kodni unutdingizmi?</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "space-between", zIndex: 9999 },
  top: { alignItems: "center", paddingHorizontal: spacing.xl },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: "#FFFFFF", textAlign: "center", letterSpacing: -0.5 },
  subtitle: { fontSize: fontSize.base, color: "rgba(255,255,255,0.82)", textAlign: "center", marginTop: 8, fontWeight: fontWeight.medium },
  error: { fontSize: fontSize.sm, color: "#FFE4E6", fontWeight: fontWeight.semibold, marginTop: spacing.md, height: 20 },
  errorSpace: { height: 20, marginTop: spacing.md },
  padZone: { flex: 1, justifyContent: "center" },
  forgot: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  forgotText: { fontSize: fontSize.base, color: "rgba(255,255,255,0.9)", fontWeight: fontWeight.semibold },
});
