/**
 * SecurityCard — profil ekranlariga qo'yiladigan "Xavfsizlik" bo'limi.
 * PIN-kod holatini ko'rsatadi va sozlash ekraniga olib boradi.
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { usePinStore } from "@/store/pin";
import { theme, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

export function SecurityCard() {
  const { pinEnabled } = usePinStore();

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Feather name="shield" size={18} color={theme.primaryDark} />
        <Text style={styles.cardTitle}>Xavfsizlik</Text>
      </View>

      <TouchableOpacity style={styles.row} onPress={() => router.push("/pin-setup")} activeOpacity={0.7}>
        <View style={[styles.rowIcon, { backgroundColor: pinEnabled ? theme.successSoft : theme.primarySoft }]}>
          <Ionicons name={pinEnabled ? "lock-closed" : "lock-open"} size={17} color={pinEnabled ? theme.success : theme.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Kirish PIN-kodi</Text>
          <Text style={styles.rowSub}>{pinEnabled ? "Yoqilgan" : "O'chirilgan"}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  rowSub: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },
});
