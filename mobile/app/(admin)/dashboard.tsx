/**
 * 🎨 PREMIUM ADMIN DASHBOARD
 * Ultra-Modern Glassmorphism + Gradient Design
 * Professional Analytics Interface
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminService, type AdminStats } from "@/services/admin";
import { useAuthStore } from "@/store/auth";

const { width } = Dimensions.get("window");

// 🎨 Premium Color Palette
const C = {
  // Gradients
  primaryGradient: ["#667eea", "#764ba2"],
  successGradient: ["#11998e", "#38ef7d"],
  warningGradient: ["#f093fb", "#f5576c"],
  dangerGradient: ["#fa709a", "#fee140"],
  blueGradient: ["#4facfe", "#00f2fe"],
  purpleGradient: ["#a8edea", "#fed6e3"],
  
  // Solids
  text: "#1a1a2e",
  textLight: "#6b7280",
  white: "#ffffff",
  glass: "rgba(255, 255, 255, 0.15)",
  glassDark: "rgba(255, 255, 255, 0.95)",
  shadow: "rgba(0, 0, 0, 0.1)",
  
  // Accent colors
  purple: "#667eea",
  blue: "#4facfe",
  green: "#11998e",
  pink: "#f093fb",
  orange: "#fa709a",
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return `${amount.toLocaleString()}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const load = async () => {
    const r = await adminService.getStats();
    if (r.success && r.data) setStats(r.data as AdminStats);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* 🌊 Animated Background Gradient */}
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* ✨ Floating Orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 👋 Premium Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Assalomu alaykum</Text>
            <Text style={styles.userName}>{user?.name} 👑</Text>
          </View>
          <View style={styles.headerBadge}>
            <LinearGradient
              colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
              style={styles.badgeGradient}
            >
              <FontAwesome5 name="crown" size={14} color="#ffd700" />
              <Text style={styles.badgeText}>Director</Text>
            </LinearGradient>
          </View>
        </View>

        {!stats ? (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.loadingCard}
            >
              <Ionicons name="analytics" size={40} color="rgba(255,255,255,0.6)" />
              <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            {/* 💰 Revenue Card - Hero */}
            <LinearGradient
              colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.15)"]}
              style={styles.heroCard}
            >
              <View style={styles.heroHeader}>
                <View style={styles.heroIcon}>
                  <MaterialCommunityIcons name="cash-multiple" size={28} color="#ffd700" />
                </View>
                <View style={styles.trendBadgeContainer}>
                  {stats.salesTrend !== undefined && stats.salesTrend > 0 && (
                    <View style={styles.trendBadge}>
                      <Feather name="trending-up" size={14} color="#11998e" />
                      <Text style={styles.trendText}>+{stats.salesTrend}%</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.heroLabel}>Bugungi Tushum</Text>
              <Text style={styles.heroValue}>{formatCurrency(stats.dailySales)} so'm</Text>
              <Text style={styles.heroSubtext}>
                {stats.dailyDeliveries} ta buyurtma yetkazildi
              </Text>
            </LinearGradient>

            {/* 📊 Stats Grid */}
            <View style={styles.statsGrid}>
              <GlassCard
                icon={<Ionicons name="cart" size={24} color="#667eea" />}
                label="Bugungi Buyurtmalar"
                value={String(stats.dailyDeliveries)}
                gradient={C.primaryGradient}
              />
              <GlassCard
                icon={<Ionicons name="people" size={24} color="#11998e" />}
                label="Yangi Mijozlar"
                value={String(stats.newCustomersMonth)}
                subtitle="Bu oy"
                gradient={C.successGradient}
              />
              <GlassCard
                icon={<FontAwesome5 name="truck" size={20} color="#f093fb" />}
                label="Faol Haydovchilar"
                value={String(stats.activeDrivers)}
                gradient={C.warningGradient}
              />
              <GlassCard
                icon={<Ionicons name="person-circle" size={24} color="#4facfe" />}
                label="Jami Mijozlar"
                value={String(stats.totalCustomers ?? 0)}
                gradient={C.blueGradient}
              />
            </View>

            {/* ⚡ Quick Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hozirgi Holat</Text>
              <View style={styles.statusRow}>
                <StatusPill
                  icon="time"
                  label="Kutilmoqda"
                  count={stats.pendingOrders}
                  colors={["#ffeaa7", "#fdcb6e"]}
                />
                <StatusPill
                  icon="car"
                  label="Yo'lda"
                  count={stats.inTransitOrders}
                  colors={["#74b9ff", "#0984e3"]}
                />
              </View>
            </View>

            {/* 💳 Payment Breakdown */}
            {stats.paymentBreakdown && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>To'lov Turlari</Text>
                <LinearGradient
                  colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                  style={styles.paymentCard}
                >
                  <PaymentRow
                    icon="cash"
                    label="Naqd"
                    amount={stats.paymentBreakdown.cash}
                    color="#11998e"
                  />
                  <View style={styles.divider} />
                  <PaymentRow
                    icon="card"
                    label="Click/Payme"
                    amount={stats.paymentBreakdown.click}
                    color="#4facfe"
                  />
                  <View style={styles.divider} />
                  <PaymentRow
                    icon="wallet"
                    label="Qarz"
                    amount={stats.paymentBreakdown.credit}
                    color="#fa709a"
                  />
                </LinearGradient>
              </View>
            )}

            {/* 📈 Weekly Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Haftalik Statistika</Text>
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                style={styles.chartCard}
              >
                <WeeklyChart data={stats.weeklyData} />
              </LinearGradient>
            </View>

            {/* ⚠️ Alerts */}
            {(stats.totalDebt > 0 || stats.unreturnedBottles > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ogohlantirishlar</Text>
                {stats.totalDebt > 0 && (
                  <AlertCard
                    icon="alert-circle"
                    title="Qarzdorlik"
                    value={`${formatCurrency(stats.totalDebt)} so'm`}
                    subtitle={`${stats.customersWithDebt} ta mijozda`}
                    colors={["#fab1a0", "#ff7675"]}
                  />
                )}
                {stats.unreturnedBottles > 0 && (
                  <AlertCard
                    icon="flask"
                    title="Qaytarilmagan Idishlar"
                    value={`${stats.unreturnedBottles} ta`}
                    subtitle={`${stats.customersWithBottles} ta mijoz hisobida`}
                    colors={["#ffeaa7", "#fdcb6e"]}
                  />
                )}
              </View>
            )}

            {/* 🔔 System Alerts */}
            {stats.alerts && stats.alerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tizim Xabarlari</Text>
                {stats.alerts.map((alert: any, i: number) => (
                  <LinearGradient
                    key={i}
                    colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                    style={styles.alertItem}
                  >
                    <Feather name="bell" size={16} color="#fff" />
                    <Text style={styles.alertText}>{alert.message}</Text>
                  </LinearGradient>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// 🎴 Glass Card Component
function GlassCard({ icon, label, value, subtitle, gradient }: any) {
  return (
    <View style={styles.glassCardWrapper}>
      <LinearGradient
        colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
        style={styles.glassCard}
      >
        <View style={styles.glassCardIcon}>{icon}</View>
        <Text style={styles.glassCardValue}>{value}</Text>
        <Text style={styles.glassCardLabel}>{label}</Text>
        {subtitle && <Text style={styles.glassCardSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  );
}

// 💊 Status Pill Component
function StatusPill({ icon, label, count, colors }: any) {
  return (
    <LinearGradient colors={colors} style={styles.statusPill}>
      <Ionicons name={icon} size={20} color="#fff" />
      <View style={styles.statusPillContent}>
        <Text style={styles.statusPillCount}>{count}</Text>
        <Text style={styles.statusPillLabel}>{label}</Text>
      </View>
    </LinearGradient>
  );
}

// 💳 Payment Row Component
function PaymentRow({ icon, label, amount, color }: any) {
  return (
    <View style={styles.paymentRow}>
      <View style={styles.paymentRowLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.paymentRowLabel}>{label}</Text>
      </View>
      <Text style={[styles.paymentRowAmount, { color }]}>
        {formatCurrency(amount)} so'm
      </Text>
    </View>
  );
}

// ⚠️ Alert Card Component
function AlertCard({ icon, title, value, subtitle, colors }: any) {
  return (
    <LinearGradient colors={colors} style={styles.alertCard}>
      <Feather name={icon} size={24} color="#fff" />
      <View style={styles.alertCardContent}>
        <Text style={styles.alertCardTitle}>{title}</Text>
        <Text style={styles.alertCardValue}>{value}</Text>
        <Text style={styles.alertCardSubtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
}

// 📊 Weekly Chart Component
function WeeklyChart({ data }: { data: { day: string; orders: number }[] }) {
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  
  return (
    <View style={styles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={styles.chartBar}>
          {item.orders > 0 && (
            <Text style={styles.chartLabel}>{item.orders}</Text>
          )}
          <View style={styles.chartBarTrack}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={[
                styles.chartBarFill,
                { height: `${Math.max((item.orders / maxOrders) * 100, 8)}%` }
              ]}
            />
          </View>
          <Text style={styles.chartDay}>{item.day}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Floating Orbs
  orb: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.3,
  },
  orb1: { width: 300, height: 300, backgroundColor: "#667eea", top: -150, right: -100 },
  orb2: { width: 200, height: 200, backgroundColor: "#f093fb", bottom: 100, left: -50 },
  orb3: { width: 150, height: 150, backgroundColor: "#4facfe", top: "50%", right: -75 },

  content: { paddingHorizontal: 20, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerBadge: {
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Loading
  loadingContainer: { paddingTop: 60 },
  loadingCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "600" },

  // Hero Card
  heroCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadgeContainer: { flexDirection: "row" },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendText: { fontSize: 13, fontWeight: "700", color: "#11998e" },
  heroLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  glassCardWrapper: { width: (width - 52) / 2 },
  glassCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  glassCardIcon: { marginBottom: 12 },
  glassCardValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  glassCardLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textAlign: "center",
  },
  glassCardSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Status Row
  statusRow: { flexDirection: "row", gap: 12 },
  statusPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  statusPillContent: { flex: 1 },
  statusPillCount: { fontSize: 24, fontWeight: "800", color: "#fff" },
  statusPillLabel: { fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600", marginTop: 2 },

  // Payment Card
  paymentCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentRowLabel: { fontSize: 15, color: "#fff", fontWeight: "600" },
  paymentRowAmount: { fontSize: 16, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)" },

  // Chart
  chartCard: {
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  chartLabel: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
  },
  chartBarTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  chartBarFill: { width: "100%", borderRadius: 8 },
  chartDay: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 8,
  },

  // Alert Card
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  alertCardContent: { flex: 1 },
  alertCardTitle: { fontSize: 13, color: "#fff", fontWeight: "600", marginBottom: 4 },
  alertCardValue: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 2 },
  alertCardSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },

  // Alert Item
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  alertText: { flex: 1, fontSize: 13, color: "#fff", fontWeight: "600", lineHeight: 18 },
});
