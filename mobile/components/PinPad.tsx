/**
 * PinPad — PIN-kod kiritish uchun umumiy komponent (nuqtalar + raqamli klaviatura).
 * ────────────────────────────────────────────────────────────
 * Boshqariladigan (controlled): value ota-komponentda saqlanadi.
 * `errorKey` o'zgarsa — nuqtalar qatori "silkinadi" (noto'g'ri kod).
 */
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme, spacing, radius, fontSize, fontWeight } from "@/constants/theme";

interface PinPadProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  errorKey?: number;
  /** Yorug' fon uchun (LockScreen — to'q gradient) yoki oq fon (setup) */
  tone?: "light" | "dark";
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function PinPad({ value, onChange, length = 4, errorKey = 0, tone = "dark" }: PinPadProps) {
  const shake = useRef(new Animated.Value(0)).current;
  const isDark = tone === "dark";

  useEffect(() => {
    if (errorKey === 0) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [errorKey, shake]);

  const press = (key: string) => {
    if (key === "del") {
      onChange(value.slice(0, -1));
    } else if (key !== "") {
      if (value.length < length) onChange(value + key);
    }
  };

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  const dotFilled = isDark ? "#FFFFFF" : theme.primary;
  const dotEmpty = isDark ? "rgba(255,255,255,0.28)" : theme.border;
  const keyText = isDark ? "#FFFFFF" : theme.text;
  const keyBg = isDark ? "rgba(255,255,255,0.14)" : theme.surfaceAlt;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dots, { transform: [{ translateX }] }]}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: dotFilled },
              { backgroundColor: i < value.length ? dotFilled : "transparent" },
              i >= value.length && { borderColor: dotEmpty },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.keypad}>
        {KEYS.map((key, idx) => {
          if (key === "") return <View key={idx} style={styles.key} />;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.key, key !== "del" && { backgroundColor: keyBg }]}
              onPress={() => press(key)}
              activeOpacity={0.6}
            >
              {key === "del" ? (
                <Feather name="delete" size={24} color={keyText} />
              ) : (
                <Text style={[styles.keyText, { color: keyText }]}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const KEY_SIZE = 74;

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  dots: { flexDirection: "row", gap: spacing.base, marginBottom: spacing["2xl"] },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  keypad: {
    width: KEY_SIZE * 3 + spacing.lg * 2,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.base,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: fontSize["2xl"], fontWeight: fontWeight.bold },
});
