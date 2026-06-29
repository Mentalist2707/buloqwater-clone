/**
 * Customer — Bosh sahifa
 * Organic Liquid Glassmorphism & Claymorphism Style
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { customerService } from "@/services/customer";

// ─── Yangilangan Shaffof va Toza Rang Palitrasi ──────────────────
const C = {
  bgGradient: ["#E6FFFA", "#EBF5FF", "#F4FAFF"], // Silliq suv foni
  cardWhite: "#FFFFFF",
  textDark: "#0F172A",
  textSub: "#64748B",

  // Brand ranglari (Claymorphic)
  cyan: "#06B6D4",
  cyanLight: "#E0F7FA",
  blue: "#0284C7",
  blueLight: "#E0F2FE",
  emerald: "#10B981",
  emeraldLight: "#D1FAE5",
  rose: "#F43F5E",
  roseLight: "#FFE4E6",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
};

export default function CustomerHome() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState({
    bottleBalance: 0,
    debtBalance: 0,
    name: "",
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const r = await customerService.getBalance();
    if (r.success && r.data) setBalance(r.data);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Xayrli tong" : hour < 17 ? "Xayrli kun" : "Xayrli kech";

  return (
    <LinearGradient colors={C.bgGradient} style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Fonda suzib yuruvchi suvli pufakchalar */}
      <View style={styles.fluidBubble1} />
      <View style={styles.fluidBubble2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 160,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.cyan}
          />
        }>
        {/* ── Header (Premium Minimalist) ──────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting} ✨</Text>
            <Text style={styles.userName}>{user?.name || "Mijoz"}</Text>

            {/* Phone badge */}
            <View style={styles.phoneBadge}>
              <Feather name="phone" size={11} color={C.blue} />
              <Text style={styles.phoneBadgeText}>{user?.phone}</Text>
            </View>
          </View>

          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#06B6D4", "#0284C7"]}
              style={styles.avatarGradient}>
              <Text style={styles.avatarLetter}>
                {(user?.name || "M").charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* ── Balans Kartalari (Claymorphism 3D Soft Style) ─────── */}
        <View style={styles.cardsRow}>
          {/* Idish balansi */}
          <View style={[styles.balanceCard, styles.clayCard]}>
            <View
              style={[styles.cardIconBox, { backgroundColor: C.blueLight }]}>
              <MaterialCommunityIcons
                name="bottle-wine-outline"
                size={24}
                color={C.blue}
              />
            </View>
            <Text style={styles.cardValue}>{balance.bottleBalance}</Text>
            <Text style={styles.cardLabel}>Idish balansi</Text>
            <Text style={styles.cardSub}>ta qaytarilishi kerak</Text>
          </View>

          {/* Qarz balansi */}
          <View style={[styles.balanceCard, styles.clayCard]}>
            <View
              style={[
                styles.cardIconBox,
                {
                  backgroundColor:
                    balance.debtBalance > 0 ? C.roseLight : C.emeraldLight,
                },
              ]}>
              <Feather
                name={balance.debtBalance > 0 ? "credit-card" : "check-circle"}
                size={22}
                color={balance.debtBalance > 0 ? C.rose : C.emerald}
              />
            </View>
            <Text
              style={[
                styles.cardValue,
                balance.debtBalance > 0 && { color: C.rose },
              ]}>
              {balance.debtBalance > 0
                ? `${(balance.debtBalance / 1000).toFixed(0)}K`
                : "0"}
            </Text>
            <Text style={styles.cardLabel}>
              {balance.debtBalance > 0 ? "Qarz balansi" : "Qarzdorlik yo'q"}
            </Text>
            <Text style={styles.cardSub}>so'm</Text>
          </View>
        </View>

        {/* ── Tezkor Amallar Grid ─────────────────────────────── */}
        <Text style={styles.sectionTitle}>Tezkor amallar</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon={<Ionicons name="water-outline" size={26} color={C.cyan} />}
            label="Suv buyurtma"
            bg={C.cyanLight}
            onPress={() => router.push("/(customer)/order")}
          />
          <QuickAction
            icon={<Feather name="clipboard" size={24} color={C.blue} />}
            label="Buyurtmalar"
            bg={C.blueLight}
            onPress={() => router.push("/(customer)/history")}
          />
          <QuickAction
            icon={<Feather name="map-pin" size={24} color={C.amber} />}
            label="Manzilim"
            bg={C.amberLight}
            onPress={() => router.push("/(customer)/profile")}
          />
          <QuickAction
            icon={<Feather name="phone-call" size={24} color={C.rose} />}
            label="Qo'ng'iroq"
            bg={C.roseLight}
            onPress={() => {}}
          />
        </View>

        {/* ── Info Card (Lighthouse Banner) ───────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Feather name="help-circle" size={20} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Buyurtma qanday ishlaydi?</Text>
            <Text style={styles.infoText}>
              Suv buyurtma bering → Haydovchi bog'lanadi → Yetkazilgach bo'sh
              idishni qaytaring.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Floating Liquid Order Button (FAB) ────────────────── */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.fabTouch}
          onPress={() => router.push("/(customer)/order")}
          activeOpacity={0.85}>
          <LinearGradient
            colors={["#06B6D4", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}>
            <Ionicons name="water" size={22} color="#FFF" />
            <Text style={styles.fabText}>Buyurtma berish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  bg: string;
  onPress: () => void;
}

function QuickAction({ icon, label, bg, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      style={[styles.quickItem, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.quickIconWrapper}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Orqa fon "suyuqlik" pufakchalari
  fluidBubble1: {
    position: "absolute",
    top: -20,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(6, 182, 212, 0.05)",
  },
  fluidBubble2: {
    position: "absolute",
    top: 300,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(2, 132, 199, 0.04)",
  },

  // Header Section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerLeft: { gap: 2 },
  greeting: { fontSize: 14, fontWeight: "600", color: C.textSub },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.5,
  },
  phoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  phoneBadgeText: { fontSize: 12, color: C.blue, fontWeight: "700" },

  avatarContainer: {
    borderRadius: 22,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  avatarGradient: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 20, fontWeight: "800", color: "#FFF" },

  // Claymorphic Kartalar paneli
  cardsRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  balanceCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    backgroundColor: C.cardWhite,
  },
  clayCard: {
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.03,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textDark,
    marginTop: 4,
  },
  cardSub: { fontSize: 11, color: C.textSub, marginTop: 2, fontWeight: "500" },

  // Bo'lim sarlavhasi
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textDark,
    paddingHorizontal: 24,
    marginBottom: 14,
  },

  // Tezkor harakatlar paneli
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickItem: {
    width: "47%",
    padding: 16,
    borderRadius: 20,
    alignItems: "flex-start",
    justifyContent: "space-between",
    height: 110,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.01,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  quickIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 14, fontWeight: "700", color: C.textDark },

  // Yo'riqnoma Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.cardWhite,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.cyanLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: C.textSub,
    lineHeight: 18,
    fontWeight: "500",
  },

  // Floating Action Button (Premium Liquid FAB)
  fabContainer: {
    position: "absolute",
    left: 24,
    right: 24,
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  fabTouch: { width: "100%" },
  fabGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: -0.1,
  },
});
