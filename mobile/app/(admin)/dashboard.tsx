/**
 * Admin Dashboard — Analitika va Statistika
 * Strict TypeScript, Ultra-Minimalist Flat iOS Style with Safe Spacing
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminService, type AdminStats } from "@/services/admin";
import { useAuthStore } from "@/store/auth";

// ─── Qat'iy Tiplashtirilgan Ranglar ────────────────────────
const C = {
  primary:      "#0284C7" as const, // Elegant Toza Ko'k
  success:      "#16A34A" as const, // Yashil
  warning:      "#D97706" as const, // To'q sariq
  danger:       "#DC2626" as const, // Qizil
  textDark:     "#0F172A" as const, // Slate 900
  textSub:      "#64748B" as const, // Slate 500
  border:       "#E2E8F0" as const, // Slate 200
  bgLight:      "#F8FAFC" as const, // Slate 50
  cardBg:       "#FFFFFF" as const, // Oq
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
  const insets = useSafeAreaInsets(); // Ekran notch/status bar o'lchamini olish

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
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      // contentContainerStyle qismiga insets.top qo'shib, tepadan dinamik joy ochamiz
      contentContainerStyle={[
        styles.content, 
        { paddingTop: insets.top > 0 ? insets.top + 8 : 16 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting — Endi status bardan pastda xavfsiz masofada joylashadi */}
      <View style={styles.greetingBox}>
        <Text style={styles.greetingText}>Salom, {user?.name}</Text>
        <Text style={styles.companyText}>{user?.company?.name}</Text>
      </View>

      {!stats ? (
        <Text style={styles.loading}>Yuklanmoqda...</Text>
      ) : (
        <>
          {/* Kunlik KPI */}
          <Text style={styles.sectionTitle}>Bugungi ko'rsatkichlar</Text>
          <View style={styles.row}>
            <KpiCard
              label="Sotuv"
              value={`${formatCurrency(stats.dailySales)} so'm`}
              icon={<MaterialCommunityIcons name="currency-usd" size={20} color={C.success} />}
              trend={stats.salesTrend}
              iconBg="#DCFCE7"
            />
            <KpiCard
              label="Yetkazildi"
              value={`${stats.dailyDeliveries} ta`}
              icon={<Ionicons name="bicycle" size={20} color={C.primary} />}
              trend={stats.deliveryTrend}
              iconBg="#E0F2FE"
            />
          </View>
          <View style={styles.row}>
            <KpiCard
              label="Yangi mijozlar"
              value={`${stats.newCustomersMonth} ta`}
              icon={<Ionicons name="person-add" size={18} color="#6366F1" />}
              subtitle="Bu oy"
              iconBg="#EEF2FF"
            />
            <KpiCard
              label="Faol haydovchi"
              value={`${stats.activeDrivers} ta`}
              icon={<Ionicons name="car" size={20} color={C.warning} />}
              iconBg="#FEF3C7"
            />
          </View>

          {/* Status kartalar */}
          <Text style={styles.sectionTitle}>Hozirgi holat</Text>
          <View style={styles.row}>
            <StatusCard label="Kutilmoqda" value={stats.pendingOrders} color={C.warning} />
            <StatusCard label="Yo'lda" value={stats.inTransitOrders} color={C.primary} />
            <StatusCard label="Jami mijoz" value={stats.totalCustomers ?? 0} color="#6366F1" />
          </View>

          {/* To'lov turi breakdown */}
          {stats.paymentBreakdown && (
            <>
              <Text style={styles.sectionTitle}>Bugungi to'lovlar</Text>
              <View style={styles.row}>
                <PaymentCard label="Naqd" amount={stats.paymentBreakdown.cash} color={C.success} />
                <PaymentCard label="Click" amount={stats.paymentBreakdown.click} color={C.primary} />
                <PaymentCard label="Qarz" amount={stats.paymentBreakdown.credit} color={C.warning} />
              </View>
            </>
          )}

          {/* Qarz va idish */}
          <View style={styles.alertStack}>
            {stats.totalDebt > 0 && (
              <View style={styles.alertBox}>
                <Ionicons name="card" size={22} color={C.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertLabel}>Umumiy qarz miqdori</Text>
                  <Text style={[styles.alertValue, { color: C.danger }]}>
                    {stats.totalDebt.toLocaleString()} so'm
                  </Text>
                  {stats.customersWithDebt !== undefined && (
                    <Text style={styles.alertSub}>{stats.customersWithDebt} ta mijozda mavjud</Text>
                  )}
                </View>
              </View>
            )}
            {stats.unreturnedBottles > 0 && (
              <View style={styles.alertBox}>
                <MaterialCommunityIcons name="bottle-wine" size={22} color={C.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertLabel}>Qaytarilmagan bo'sh idishlar</Text>
                  <Text style={[styles.alertValue, { color: C.warning }]}>
                    {stats.unreturnedBottles} ta
                  </Text>
                  {stats.customersWithBottles !== undefined && (
                    <Text style={styles.alertSub}>{stats.customersWithBottles} ta mijoz hisobida</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Alerts (ogohlantirishlar) */}
          {stats.alerts && stats.alerts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Tizim xabarlari</Text>
              <View style={styles.alertsContainer}>
                {stats.alerts.map((alert: any, i: number) => {
                  const isDanger = alert.type === "danger";
                  const isWarning = alert.type === "warning";
                  const activeColor = isDanger ? C.danger : isWarning ? C.warning : C.primary;
                  
                  return (
                    <View key={i} style={[styles.alertItem, { borderLeftColor: activeColor }]}>
                      <Ionicons 
                        name={isDanger ? "alert-circle" : isWarning ? "warning" : "information-circle"} 
                        size={18} 
                        color={activeColor} 
                      />
                      <Text style={[styles.alertItemText, { color: C.textDark }]}>
                        {alert.message}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Haftalik grafik */}
          <Text style={styles.sectionTitle}>Haftalik buyurtmalar</Text>
          <View style={styles.chartCard}>
            <WeeklyChart data={stats.weeklyData} />
          </View>

          {/* Bekor qilingan bugun */}
          {stats.cancelledToday !== undefined && stats.cancelledToday > 0 && (
            <View style={styles.cancelledCard}>
              <Ionicons name="close-circle" size={18} color={C.danger} />
              <Text style={styles.cancelledText}>
                Bugun {stats.cancelledToday} ta buyurtma bekor qilindi
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function KpiCard({ label, value, icon, trend, iconBg, subtitle }: {
  label: string; value: string; icon: React.ReactNode;
  trend?: number; iconBg: string; subtitle?: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiTop}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>{icon}</View>
        {trend !== undefined && trend !== 0 && (
          <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? "#DCFCE7" : "#FEE2E2" }]}>
            <Text style={[styles.trendText, { color: trend > 0 ? C.success : C.danger }]}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function StatusCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statusCard}>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function PaymentCard({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <View style={styles.paymentCard}>
      <Text style={styles.paymentLabel}>{label}</Text>
      <Text style={[styles.paymentAmount, { color }]}>{formatCurrency(amount)}</Text>
      <Text style={styles.paymentSub}>so'm</Text>
    </View>
  );
}

function WeeklyChart({ data }: { data: { day: string; orders: number; revenue: number }[] }) {
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  return (
    <View style={styles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={styles.chartBarWrapper}>
          <Text style={styles.chartCount}>{item.orders > 0 ? item.orders : ""}</Text>
          <View style={styles.chartBarBg}>
            <View
              style={[
                styles.chartBarFill,
                { height: `${Math.max((item.orders / maxOrders) * 100, 5)}%` },
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
  container: { flex: 1, backgroundColor: C.bgLight },
  // Eski qattiq "paddingTop: 12" olib tashlandi, endi u insets orqali dinamik hisoblanadi
  content: { paddingHorizontal: 16, paddingBottom: 80 },
  
  greetingBox: { marginBottom: 14 },
  greetingText: { fontSize: 22, fontWeight: "800", color: C.textDark, letterSpacing: -0.5 },
  companyText: { fontSize: 13, color: C.textSub, fontWeight: "500", marginTop: 2 },
  
  loading: { textAlign: "center", color: C.textSub, paddingVertical: 40, fontWeight: "500" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: C.textSub, marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.8 },
  
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  
  kpiCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  kpiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  iconWrapper: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendText: { fontSize: 10, fontWeight: "700" },
  kpiValue: { fontSize: 18, fontWeight: "800", color: C.textDark },
  kpiLabel: { fontSize: 12, color: C.textSub, marginTop: 2, fontWeight: "500" },
  kpiSubtitle: { fontSize: 10, color: C.textSub, marginTop: 1 },
  
  statusCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.border },
  statusValue: { fontSize: 20, fontWeight: "800" },
  statusLabel: { fontSize: 11, color: C.textSub, marginTop: 2, fontWeight: "600", textAlign: "center" },
  
  paymentCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.border },
  paymentLabel: { fontSize: 12, color: C.textSub, fontWeight: "600", marginBottom: 4 },
  paymentAmount: { fontSize: 15, fontWeight: "800" },
  paymentSub: { fontSize: 10, color: C.textSub, fontWeight: "500" },
  
  alertStack: { gap: 8, marginBottom: 4 },
  alertBox: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: C.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  alertLabel: { fontSize: 12, color: C.textSub, fontWeight: "500" },
  alertValue: { fontSize: 16, fontWeight: "700", marginTop: 1 },
  alertSub: { fontSize: 11, color: C.textSub, marginTop: 1, fontWeight: "500" },
  
  alertsContainer: { gap: 6, marginBottom: 4 },
  alertItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4 },
  alertItemText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  
  chartCard: { backgroundColor: C.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  chartContainer: { flexDirection: "row", alignItems: "flex-end", height: 110, gap: 8 },
  chartBarWrapper: { flex: 1, alignItems: "center", height: "100%" },
  chartCount: { fontSize: 9, color: C.textSub, marginBottom: 3, fontWeight: "700" },
  chartBarBg: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden", width: "100%", justifyContent: "flex-end" },
  chartBarFill: { width: "100%", backgroundColor: C.primary, borderRadius: 4 },
  chartDay: { fontSize: 10, color: C.textSub, marginTop: 4, fontWeight: "600" },
  
  cancelledCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FCA5A5", marginTop: 8 },
  cancelledText: { fontSize: 13, color: C.danger, fontWeight: "600" },
});