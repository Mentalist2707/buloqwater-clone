/**
 * PIN Setup — PIN-kodni yoqish / o'zgartirish / o'chirish ekrani.
 */
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Alert } from "@/utils/alert";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { PinPad } from "@/components/PinPad";
import { usePinStore } from "@/store/pin";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const PIN_LENGTH = 4;

type Mode = "menu" | "create" | "confirm" | "remove";

export default function PinSetupScreen() {
  const insets = useSafeAreaInsets();
  const { pinEnabled, setPin, removePin, verify } = usePinStore();

  const [mode, setMode] = useState<Mode>(pinEnabled ? "menu" : "create");
  const [first, setFirst] = useState("");
  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [hint, setHint] = useState("");

  const fail = (msg: string) => {
    setErrorKey((k) => k + 1);
    setHint(msg);
    setTimeout(() => setCode(""), 220);
  };

  useEffect(() => {
    if (code.length !== PIN_LENGTH) return;

    (async () => {
      if (mode === "create") {
        setFirst(code);
        setCode("");
        setHint("");
        setMode("confirm");
      } else if (mode === "confirm") {
        if (code === first) {
          await setPin(code);
          Alert.alert("Tayyor", "PIN-kod o'rnatildi", [{ text: "OK", onPress: () => router.back() }]);
        } else {
          fail("Kodlar mos kelmadi. Qaytadan boshlaymiz");
          setFirst("");
          setTimeout(() => setMode("create"), 240);
        }
      } else if (mode === "remove") {
        const ok = await verify(code);
        if (ok) {
          await removePin();
          Alert.alert("O'chirildi", "PIN-kod o'chirildi", [{ text: "OK", onPress: () => router.back() }]);
        } else {
          fail("Kod noto'g'ri");
        }
      }
    })();
  }, [code]);

  const titles: Record<Mode, { title: string; sub: string }> = {
    menu: { title: "PIN-kod", sub: "Ilovaga kirish qulfini boshqaring" },
    create: { title: "Yangi PIN-kod", sub: `${PIN_LENGTH} xonali kod o'ylab toping` },
    confirm: { title: "Kodni tasdiqlang", sub: "Kodni yana bir bor kiriting" },
    remove: { title: "PIN-kodni o'chirish", sub: "Joriy kodni kiriting" },
  };

  const startMode = (m: Mode) => {
    setFirst("");
    setCode("");
    setHint("");
    setMode(m);
  };

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{titles[mode].title}</Text>
      </View>

      {mode === "menu" ? (
        <View style={styles.menu}>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons name="shield-checkmark" size={26} color={theme.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>PIN-kod yoqilgan</Text>
              <Text style={styles.statusSub}>Ilova ochilganda kod so'raladi</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.row} onPress={() => startMode("create")} activeOpacity={0.8}>
            <View style={[styles.rowIcon, { backgroundColor: theme.primarySoft }]}>
              <Feather name="edit-2" size={18} color={theme.primaryDark} />
            </View>
            <Text style={styles.rowText}>PIN-kodni o'zgartirish</Text>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => startMode("remove")} activeOpacity={0.8}>
            <View style={[styles.rowIcon, { backgroundColor: palette.rose100 }]}>
              <Feather name="trash-2" size={18} color={theme.danger} />
            </View>
            <Text style={[styles.rowText, { color: theme.danger }]}>PIN-kodni o'chirish</Text>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.padArea}>
          <Text style={styles.sub}>{titles[mode].sub}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : <View style={{ height: 18 }} />}
          <PinPad value={code} onChange={(v) => { setCode(v); setHint(""); }} length={PIN_LENGTH} errorKey={errorKey} tone="light" />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.4 },

  menu: { paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  statusIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: theme.successSoft, alignItems: "center", justifyContent: "center" },
  statusTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },
  statusSub: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },

  padArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 },
  sub: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium, marginBottom: spacing.sm },
  hint: { fontSize: fontSize.sm, color: theme.danger, fontWeight: fontWeight.semibold, height: 18, marginBottom: spacing.md },
});
