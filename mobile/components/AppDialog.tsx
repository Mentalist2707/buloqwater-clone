/**
 * AppDialog — global maxsus alert/confirm oynasi (native Alert o'rniga).
 * ────────────────────────────────────────────────────────────
 * Ilovaning "suvli" dizayniga mos: markazda karta, tepada rangli
 * ikonka (turi mazmundan aniqlanadi), tugmalar chiroyli uslubda.
 * _layout'da bir marta joylashtiriladi.
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useDialogStore, type DialogButton } from "@/store/dialog";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

type Kind = "success" | "danger" | "warning" | "confirm" | "info";

function classify(title: string, buttons: DialogButton[]): Kind {
  const t = title.toLowerCase();
  if (t.includes("xato") || t.includes("xatolik") || t.includes("noto'g'ri")) return "danger";
  if (
    t.includes("muvaffaqiyat") ||
    t.includes("tabrik") ||
    t.includes("tayyor") ||
    t.includes("bajarildi") ||
    t.includes("qabul") ||
    t.includes("yuborildi") ||
    t.includes("saqlandi") ||
    t.includes("yangilandi") ||
    t.includes("qo'shildi") ||
    t.includes("o'rnatildi") ||
    t.includes("o'chirildi")
  )
    return "success";
  if (buttons.some((b) => b.style === "destructive")) return "warning";
  if (buttons.length > 1) return "confirm";
  return "info";
}

const KIND_META: Record<Kind, { icon: any; color: string; soft: string }> = {
  success: { icon: "check-circle", color: palette.mint600, soft: palette.mint100 },
  danger: { icon: "alert-circle", color: palette.rose600, soft: palette.rose100 },
  warning: { icon: "alert-triangle", color: palette.amber600, soft: palette.amber100 },
  confirm: { icon: "help-circle", color: palette.ocean600, soft: palette.aqua100 },
  info: { icon: "info", color: palette.ocean600, soft: palette.aqua100 },
};

// Sarlavha boshidagi emoji/belgilarni olib tashlash (o'z ikonkamiz bor)
function cleanTitle(title: string): string {
  return title.replace(/^[^\p{L}\p{N}]+/u, "").trim() || title;
}

export default function AppDialog() {
  const { visible, title, message, buttons, hide } = useDialogStore();

  const kind = classify(title, buttons);
  const meta = KIND_META[kind];
  const isRow = buttons.length === 2;

  const press = (btn: DialogButton) => {
    hide();
    if (btn.onPress) setTimeout(btn.onPress, 80);
  };

  const buttonStyle = (btn: DialogButton) => {
    if (btn.style === "destructive") return { bg: theme.danger, text: "#fff", border: theme.danger };
    if (btn.style === "cancel") return { bg: theme.surfaceAlt, text: theme.textSecondary, border: theme.border };
    return { bg: theme.primary, text: "#fff", border: theme.primary };
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: meta.soft }]}>
            <Feather name={meta.icon} size={26} color={meta.color} />
          </View>

          <Text style={styles.title}>{cleanTitle(title)}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.actions, isRow ? styles.actionsRow : styles.actionsCol]}>
            {buttons.map((btn, i) => {
              const bs = buttonStyle(btn);
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isRow && { flex: 1 },
                    { backgroundColor: bs.bg, borderColor: bs.border },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => press(btn)}
                >
                  <Text style={[styles.btnText, { color: bs.text }]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.surface,
    borderRadius: radius["2xl"],
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.lg,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: theme.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    fontSize: fontSize.base,
    color: theme.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 21,
    fontWeight: fontWeight.medium,
  },
  actions: { marginTop: spacing.xl, width: "100%", gap: spacing.md },
  actionsRow: { flexDirection: "row" },
  actionsCol: { flexDirection: "column" },
  btn: {
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
  },
  btnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
});
