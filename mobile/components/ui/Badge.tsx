import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/constants";

interface BadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: BadgeProps) {
  const color = ORDER_STATUS_COLORS[status] || Colors.gray[500];
  const label = ORDER_STATUS_LABELS[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: color + "15", borderColor: color }, size === "md" && styles.md]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === "md" && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    alignSelf: "flex-start",
  },
  md: { paddingHorizontal: 12, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "600" },
  textMd: { fontSize: 13 },
});
