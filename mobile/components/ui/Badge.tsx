import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/constants";
import { theme, radius, fontSize, fontWeight } from "@/constants/theme";

interface BadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: BadgeProps) {
  const color = ORDER_STATUS_COLORS[status] || theme.textSecondary;
  const label = ORDER_STATUS_LABELS[status] || status;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + "14", borderColor: color + "33" },
        size === "md" && styles.md,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === "md" && styles.textMd]}>{label}</Text>
    </View>
  );
}

interface TagProps {
  label: string;
  color?: string;
  bg?: string;
}

/** Umumiy rangli teg (holatdan tashqari) */
export function Tag({ label, color = theme.primaryDark, bg }: TagProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg ?? color + "14", borderColor: color + "33" }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: 5,
    alignSelf: "flex-start",
  },
  md: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.lg },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.extrabold, letterSpacing: 0.2 },
  textMd: { fontSize: fontSize.sm },
});
