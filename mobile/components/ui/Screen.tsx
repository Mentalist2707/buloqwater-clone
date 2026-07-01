import React from "react";
import { View, StyleSheet, StatusBar, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "@/constants/theme";

interface ScreenProps {
  children: React.ReactNode;
  /** Fon gradienti (theme.gradients dan) */
  variant?: keyof typeof gradients;
  /** Dekorativ suvli pufakchalarni ko'rsatish */
  decorated?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Screen — barcha ekranlar uchun yagona fon qobig'i.
 * Mayin suvli gradient + ixtiyoriy dekorativ pufakchalar.
 */
export function Screen({ children, variant = "screen", decorated = true, style }: ScreenProps) {
  return (
    <LinearGradient colors={gradients[variant]} style={[styles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {decorated && (
        <>
          <View style={styles.bubble1} pointerEvents="none" />
          <View style={styles.bubble2} pointerEvents="none" />
        </>
      )}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bubble1: {
    position: "absolute",
    top: -30,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(6, 182, 212, 0.06)",
  },
  bubble2: {
    position: "absolute",
    top: 260,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(2, 132, 199, 0.05)",
  },
});
