/**
 * SplashAnimation — ilova ochilishidagi "suvli" yuklanish animatsiyasi.
 * ────────────────────────────────────────────────────────────
 * Aqua gradient fon, markazda pulslanuvchi suv tomchisi + tarqaluvchi
 * to'lqin halqalari, pastda brend nomi va yumshoq "yuklanmoqda" nuqtalari.
 * RN Animated API'da yozilgan — qo'shimcha babel plagini talab qilmaydi.
 */
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { gradients, fontSize, fontWeight, spacing } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function SplashAnimation() {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const logoIn = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo kirib kelishi
    Animated.spring(logoIn, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    Animated.timing(textIn, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }).start();

    // Tomchi pulsi (doimiy)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    // Tarqaluvchi halqalar
    const ripple = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.timing(val, { toValue: 1, duration: 2000, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      );
    ripple(ring1, 0).start();
    ripple(ring2, 1000).start();

    // Yuklanish nuqtalari
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      );
    bounce(dot1, 0).start();
    bounce(dot2, 150).start();
    bounce(dot3, 300).start();
  }, []);

  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const ringStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.15, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.4] }) }],
  });

  return (
    <LinearGradient colors={gradients.ocean} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.center}>
        <View style={styles.logoZone}>
          <Animated.View style={[styles.ring, ringStyle(ring1)]} />
          <Animated.View style={[styles.ring, ringStyle(ring2)]} />
          <Animated.View
            style={[
              styles.logoCircle,
              { opacity: logoIn, transform: [{ scale: Animated.multiply(logoIn, logoScale) }] },
            ]}
          >
            <Ionicons name="water" size={58} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: textIn, transform: [{ translateY: textIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Text style={styles.brand}>BuloqWater</Text>
          <Text style={styles.tagline}>Sog'lom hayot sari</Text>
        </Animated.View>
      </View>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[styles.loadDot, { opacity: d, transform: [{ scale: d }] }]} />
        ))}
      </View>
    </LinearGradient>
  );
}

const RING = width * 0.4;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center" },
  logoZone: { width: RING, height: RING, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  ring: {
    position: "absolute",
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  logoCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brand: { fontSize: fontSize["4xl"], fontWeight: fontWeight.black, color: "#FFFFFF", textAlign: "center", letterSpacing: -0.8 },
  tagline: { fontSize: fontSize.base, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 6, fontWeight: fontWeight.medium },
  dotsRow: { position: "absolute", bottom: 72, flexDirection: "row", gap: 10 },
  loadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFFFFF" },
});
