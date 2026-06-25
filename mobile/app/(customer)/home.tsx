/**
 * Customer — Bosh sahifa
 * Balans, idish, qarz + tezkor buyurtma tugmasi
 */
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { customerService } from "@/services/customer";

// ─── Rang palatrasi ──────────────────────────────────────────
const C = {
  primary:   "#00C6A2",
  dark:      "#00A88A",
  light:     "#E6FAF7",
  accent:    "#6C63FF",
  accentLight: "#EFEDFF",
  warn:      "#FF6B6B",
  warnLight: "#FFF0F0",
  gold:      "#F59E0B",
  goldLight: "#FEF3C7",
  bg:        "#F0FAF8",
  white:     "#FFFFFF",
  text:      "#1A2E2B",
  sub:       "#6B8F89",
};

export default function CustomerHome() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState({ bottleBalance: 0, debtBalance: 0, name: "" });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const r = await customerService.getBalance();
    if (r.success && r.data) setBalance(r.data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Xayrli tong" : hour < 17 ? "Xayrli kun" : "Xayrli kech";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.white} />}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerWave} />
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{greeting} 👋</Text>
                <Text style={styles.userName}>{user?.name || "Mijoz"}</Text>
              </View>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarLetter}>
                  {(user?.name || "M").charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Phone badge */}
            <View style={styles.phoneBadge}>
              <Text style={styles.phoneBadgeText}>📱 {user?.phone}</Text>
            </View>
          </View>
        </View>

        {/* ── Balans kartalar ──────────────────────────────── */}
        <View style={styles.cardsRow}>
          {/* Idish balansi */}
          <View style={[styles.balanceCard, { backgroundColor: C.accent }]}>
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>🍶</Text>
            </View>
            <Text style={styles.cardValue}>{balance.bottleBalance}</Text>
            <Text style={styles.cardLabel}>Idish balansi</Text>
            <Text style={styles.cardSub}>ta idish</Text>
          </View>

          {/* Qarz */}
          <View style={[styles.balanceCard, {
            backgroundColor: balance.debtBalance > 0 ? C.warn : C.primary,
          }]}>
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>{balance.debtBalance > 0 ? "💳" : "✅"}</Text>
            </View>
            <Text style={styles.cardValue}>
              {balance.debtBalance > 0
                ? `${(balance.debtBalance / 1000).toFixed(0)}K`
                : "0"}
            </Text>
            <Text style={styles.cardLabel}>
              {balance.debtBalance > 0 ? "Qarz" : "Qarz yo'q"}
            </Text>
            <Text style={styles.cardSub}>so'm</Text>
          </View>
        </View>

        {/* ── Tezkor amallar ───────────────────────────────── */}
        <Text style={styles.sectionTitle}>Tezkor amallar</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="💧" label="Suv buyurtma" color={C.primary} bg={C.light}
            onPress={() => router.push("/(customer)/order")}
          />
          <QuickAction
            icon="📋" label="Buyurtmalar" color={C.accent} bg={C.accentLight}
            onPress={() => router.push("/(customer)/history")}
          />
          <QuickAction
            icon="📍" label="Manzilim" color={C.gold} bg={C.goldLight}
            onPress={() => router.push("/(customer)/profile")}
          />
          <QuickAction
            icon="📞" label="Qo'ng'iroq" color="#EF4444" bg="#FEE2E2"
            onPress={() => {}}
          />
        </View>

        {/* ── Info card ────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Buyurtma qanday ishlaydi?</Text>
            <Text style={styles.infoText}>
              Suv buyurtma bering → Haydovchi siz bilan bog'lanadi → Yetkazilgach idishni qaytaring
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Floating buyurtma tugmasi ─────────────────────── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 84 }]}
        onPress={() => router.push("/(customer)/order")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>💧</Text>
        <Text style={styles.fabText}>Buyurtma berish</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuickAction({ icon, label, color, bg, onPress }: {
  icon: string; label: string; color: string; bg: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.quickItem, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },

  // Header
  header:       { backgroundColor: C.primary, paddingBottom: 32, overflow: "hidden" },
  headerWave:   {
    position: "absolute", bottom: -20, left: -20, right: -20, height: 60,
    backgroundColor: C.bg, borderTopLeftRadius: 40, borderTopRightRadius: 40,
  },
  headerContent:{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  greeting:     { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  userName:     { fontSize: 22, fontWeight: "800", color: C.white, marginTop: 2 },
  avatarBox:    {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { fontSize: 20, fontWeight: "800", color: C.white },
  phoneBadge:   {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  phoneBadgeText: { fontSize: 12, color: C.white, fontWeight: "500" },

  // Balance cards
  cardsRow:     { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 8, marginBottom: 8 },
  balanceCard:  {
    flex: 1, borderRadius: 20, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  cardIconBox:  { marginBottom: 8 },
  cardIcon:     { fontSize: 28 },
  cardValue:    { fontSize: 30, fontWeight: "900", color: C.white },
  cardLabel:    { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.9)", marginTop: 2 },
  cardSub:      { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 },

  // Section
  sectionTitle: {
    fontSize: 16, fontWeight: "700", color: C.text,
    paddingHorizontal: 20, marginTop: 12, marginBottom: 12,
  },

  // Quick grid
  quickGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  quickItem:    {
    width: "46%", padding: 16, borderRadius: 16,
    alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  quickIcon:    { fontSize: 28 },
  quickLabel:   { fontSize: 13, fontWeight: "700", textAlign: "center" },

  // Info card
  infoCard:     {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginHorizontal: 20,
    borderLeftWidth: 4, borderLeftColor: C.primary,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  infoIcon:     { fontSize: 22, marginTop: 2 },
  infoTitle:    { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
  infoText:     { fontSize: 12, color: C.sub, lineHeight: 18 },

  // FAB
  fab:          {
    position: "absolute", alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 30,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  fabIcon:      { fontSize: 20 },
  fabText:      { fontSize: 16, fontWeight: "800", color: C.white },
});
