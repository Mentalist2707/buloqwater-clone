/**
 * Admin (Director) Dashboard — 2026 redesign
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminService, type AdminStats } from "@/services/admin";
import { useAuthStore } from "@/store/auth";
import { Screen } from "@/components/ui";
import { theme, palette, gradients, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const { width } = Dimensions.get("window");

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

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Assalomu alaykum</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name}
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <Feather name="award" size={13} color={palette.amber600} />
            <Text style={styles.roleBadgeText}>Director</Text>
          </View>
        </View>

        {!stats ? (
          <View style={styles.loadingCard}>
            <Ionicons name="analytics-outline" size={38} color={theme.textMuted} />
            <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
          </View>
        ) : (
          <>
            {/* Hero revenue */}
            <LinearGradient colors={gradients.ocean} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroCard, shadow.brand]}>
              <View style={styles.heroWave} pointerEvents="none" />
              <View style={styles.heroHeader}>
                <View style={styles.heroIconBg}>
                  <MaterialCommunityIcons name="cash-multiple" size={26} color="#fff" />
                </View>
                {stats.salesTrend !== undefined && stats.salesTrend > 0 && (
                  <View style={styles.trendBadge}>
                    <Feather name="trending-up" size={13} color={theme.success} />
                    <Text style={styles.trendText}>+{stats.salesTrend}%</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroLabel}>Bugungi tushum</Text>
              <Text style={styles.heroValue}>
                {formatCurrency(stats.dailySales)} <Text style={styles.heroCurrency}>so'm</Text>
              </Text>
              <View style={styles.heroFooter}>
                <Feather name="check-circle" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroSubtext}>{stats.dailyDeliveries} ta buyurtma bajarildi</Text>
              </View>
            </LinearGradient>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatCard icon="shopping-cart" label="Bugungi buyurtmalar" value={String(stats.dailyDeliveries)} color={palette.aqua500} />
              <StatCard icon="user-plus" label="Yangi mijozlar" value={String(stats.newCustomersMonth)} sub="Bu oy" color={palette.mint500} />
              <StatCard icon="truck" label="Faol haydovchilar" value={String(stats.activeDrivers)} color={palette.amber500} />
              <StatCard icon="users" label="Jami mijozlar" value={String(stats.totalCustomers ?? 0)} color={palette.ocean500} />
            </View>

            {/* Status */}
            <Text style={styles.sectionTitle}>Hozirgi holat</Text>
            <View style={styles.statusRow}>
              <StatusPill icon="clock" label="Kutilmoqda" count={stats.pendingOrders} color={palette.amber500} />
              <StatusPill icon="navigation" label="Yo'lda" count={stats.inTransitOrders} color={palette.ocean500} />
            </View>

            {/* Payment breakdown */}
            {stats.paymentBreakdown && (
              <>
                <Text style={styles.sectionTitle}>To'lov turlari</Text>
                <View style={styles.card}>
                  <PaymentRow icon="dollar-sign" label="Naqd" amount={stats.paymentBreakdown.cash} color={theme.success} />
                  <View style={styles.divider} />
                  <PaymentRow icon="credit-card" label="Click/Payme" amount={stats.paymentBreakdown.click} color={theme.primaryDark} />
                  <View style={styles.divider} />
                  <PaymentRow icon="book" label="Qarz" amount={stats.paymentBreakdown.credit} color={theme.danger} />
                </View>
              </>
            )}

            {/* Weekly chart */}
            <Text style={styles.sectionTitle}>Haftalik statistika</Text>
            <View style={styles.card}>
              <WeeklyChart data={stats.weeklyData} />
            </View>

            {/* Alerts */}
            {(stats.totalDebt > 0 || stats.unreturnedBottles > 0) && (
              <>
                <Text style={styles.sectionTitle}>Ogohlantirishlar</Text>
                {stats.totalDebt > 0 && (
                  <AlertCard
                    icon="alert-circle"
                    title="Qarzdorlik"
                    value={`${formatCurrency(stats.totalDebt)} so'm`}
                    subtitle={`${stats.customersWithDebt} ta mijozda`}
                    color={theme.danger}
                    bg={theme.dangerSoft}
                  />
                )}
                {stats.unreturnedBottles > 0 && (
                  <AlertCard
                    icon="droplet"
                    title="Qaytarilmagan idishlar"
                    value={`${stats.unreturnedBottles} ta`}
                    subtitle={`${stats.customersWithBottles} ta mijoz hisobida`}
                    color={palette.amber600}
                    bg={theme.warningSoft}
                  />
                )}
              </>
            )}

            {/* System alerts */}
            {stats.alerts && stats.alerts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Tizim xabarlari</Text>
                {stats.alerts.map((alert: any, i: number) => (
                  <View key={i} style={styles.alertItem}>
                    <View style={styles.alertItemIcon}>
                      <Feather name="bell" size={16} color={theme.primaryDark} />
                    </View>
                    <Text style={styles.alertText}>{alert.message}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; sub?: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function StatusPill({ icon, label, count, color }: { icon: keyof typeof Feather.glyphMap; label: string; count: number; color: string }) {
  return (
    <View style={[styles.statusPill, { borderColor: color + "33" }]}>
      <View style={[styles.statusPillIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.statusCount, { color }]}>{count}</Text>
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
    </View>
  );
}

function PaymentRow({ icon, label, amount, color }: { icon: keyof typeof Feather.glyphMap; label: string; amount: number; color: string }) {
  return (
    <View style={styles.paymentRow}>
      <View style={styles.paymentRowLeft}>
        <View style={[styles.paymentIcon, { backgroundColor: color + "18" }]}>
          <Feather name={icon} size={16} color={color} />
        </View>
        <Text style={styles.paymentRowLabel}>{label}</Text>
      </View>
      <Text style={[styles.paymentRowAmount, { color }]}>{formatCurrency(amount)} so'm</Text>
    </View>
  );
}

function AlertCard({ icon, title, value, subtitle, color, bg }: { icon: keyof typeof Feather.glyphMap; title: string; value: string; subtitle: string; color: string; bg: string }) {
  return (
    <View style={[styles.alertCard, { backgroundColor: bg, borderColor: color + "33" }]}>
      <View style={[styles.alertCardIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.alertCardTitle}>{title}</Text>
        <Text style={[styles.alertCardValue, { color }]}>{value}</Text>
        <Text style={styles.alertCardSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function WeeklyChart({ data }: { data: { day: string; orders: number }[] }) {
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  return (
    <View style={styles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={styles.chartBar}>
          {item.orders > 0 && <Text style={styles.chartLabel}>{item.orders}</Text>}
          <View style={styles.chartBarTrack}>
            <LinearGradient colors={gradients.brand} style={[styles.chartBarFill, { height: `${Math.max((item.orders / maxOrders) * 100, 8)}%` }]} />
          </View>
          <Text style={styles.chartDay}>{item.day}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: 110 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  greeting: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  userName: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.5 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.warningSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  roleBadgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: palette.amber600 },

  loadingCard: {
    borderRadius: radius.xl,
    padding: 40,
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  loadingText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  heroCard: { borderRadius: radius["2xl"], padding: spacing.xl, marginBottom: spacing.lg, overflow: "hidden" },
  heroWave: { position: "absolute", right: -50, top: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.08)" },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  heroIconBg: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md },
  trendText: { fontSize: fontSize.sm, fontWeight: fontWeight.extrabold, color: theme.success },
  heroLabel: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.9)", fontWeight: fontWeight.semibold, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  heroValue: { fontSize: fontSize["4xl"], fontWeight: fontWeight.black, color: "#fff", letterSpacing: -1.5 },
  heroCurrency: { fontSize: fontSize.lg, color: "rgba(255,255,255,0.85)", fontWeight: fontWeight.semibold },
  heroFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.base, paddingTop: spacing.base, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.18)" },
  heroSubtext: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.85)", fontWeight: fontWeight.semibold },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.sm },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  statIconBg: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  statValue: { fontSize: fontSize["2xl"], fontWeight: fontWeight.black, color: theme.text, letterSpacing: -1 },
  statLabel: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.bold, marginTop: 2, lineHeight: 15 },
  statSub: { fontSize: 10, color: theme.textMuted, marginTop: 2, fontWeight: fontWeight.semibold },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: theme.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingLeft: 2,
  },

  statusRow: { flexDirection: "row", gap: spacing.md },
  statusPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    ...shadow.xs,
  },
  statusPillIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  statusCount: { fontSize: fontSize["2xl"], fontWeight: fontWeight.black, letterSpacing: -1 },
  statusLabel: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.bold, marginTop: 2 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  paymentRowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  paymentIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  paymentRowLabel: { fontSize: fontSize.base, color: theme.text, fontWeight: fontWeight.bold },
  paymentRowAmount: { fontSize: fontSize.md, fontWeight: fontWeight.black, letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: spacing.xs },

  chartContainer: { flexDirection: "row", alignItems: "flex-end", height: 140, gap: spacing.sm },
  chartBar: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  chartLabel: { fontSize: fontSize.xs, color: theme.text, fontWeight: fontWeight.extrabold, marginBottom: 6 },
  chartBarTrack: { flex: 1, width: "100%", backgroundColor: theme.surfaceAlt, borderRadius: radius.sm, overflow: "hidden", justifyContent: "flex-end" },
  chartBarFill: { width: "100%", borderRadius: radius.sm },
  chartDay: { fontSize: 10, color: theme.textSecondary, fontWeight: fontWeight.bold, marginTop: 8, textTransform: "uppercase" },

  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  alertCardIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  alertCardTitle: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.bold, textTransform: "uppercase", letterSpacing: 0.5 },
  alertCardValue: { fontSize: fontSize.xl, fontWeight: fontWeight.black, marginTop: 2, letterSpacing: -0.5 },
  alertCardSubtitle: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium, marginTop: 2 },

  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  alertItemIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  alertText: { flex: 1, fontSize: fontSize.base, color: theme.text, fontWeight: fontWeight.semibold, lineHeight: 20 },
});
