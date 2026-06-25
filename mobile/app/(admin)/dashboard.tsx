"Admin dashboard — analitika va statistika"
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Colors } from "@/constants";
import { adminService, AdminStats } from "@/services/admin";
import { useAuthStore } from "@/store/auth";

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return `${amount.toLocaleString()}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const load = async () => {
    const r = await adminService.getStats();
    if (r.success && r.data) setStats(r.data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Salom, {user?.name} 👋</Text>
        <Text style={styles.companyText}>{user?.company?.name}</Text>
      </View>

      {!stats ? (
        <Text style={styles.loading}>Yuklanmoqda...</Text>
      ) : (
        <>
          {/* Kunlik KPI */}
          <Text style={styles.sectionTitle}>Bugungi ko'rsatkichlar</Text>
          <View style={styles.kpiRow}>
            <KpiCard
              label="Sotuv"
              value={`${formatCurrency(stats.dailySales)} so'm`}
              icon="💰"
              trend={stats.salesTrend}
              color="#22C55E"
            />
            <KpiCard
              label="Yetkazildi"
              value={`${stats.dailyDeliveries} ta`}
              icon="🚚"
              trend={stats.deliveryTrend}
              color={Colors.primary}
            />
          </View>
          <View style={styles.kpiRow}>
            <KpiCard
              label="Yangi mijozlar"
              value={`${stats.newCustomersMonth} ta`}
              icon="👤"
              subtitle="Bu oy"
              color={Colors.secondary}
            />
            <KpiCard
              label="Faol haydovchi"
              value={`${stats.activeDrivers} ta`}
              icon="🚗"
              color="#F59E0B"
            />
          </View>

          {/* Status kartalar */}
          <Text style={styles.sectionTitle}>Hozirgi holat</Text>
          <View style={styles.statusRow}>
            <StatusCard label="Kutilmoqda" value={stats.pendingOrders} icon="⏳" color="#F59E0B" />
            <StatusCard label="Yo'lda" value={stats.inTransitOrders} icon="🚛" color={Colors.primary} />
            <StatusCard label="Jami mijoz" value={stats.totalCustomers ?? 0} icon="👥" color="#6366F1" />
          </View>

          {/* To'lov turi breakdown */}
          {stats.paymentBreakdown && (
            <>
              <Text style={styles.sectionTitle}>Bugungi to'lovlar</Text>
              <View style={styles.paymentRow}>
                <PaymentCard label="Naqd 💵" amount={stats.paymentBreakdown.cash} color="#22C55E" />
                <PaymentCard label="Click 💳" amount={stats.paymentBreakdown.click} color={Colors.primary} />
                <PaymentCard label="Qarz 📝" amount={stats.paymentBreakdown.credit} color={Colors.warning} />
              </View>
            </>
          )}

          {/* Qarz va idish */}
          <View style={styles.alertRow}>
            {stats.totalDebt > 0 && (
              <View style={[styles.alertCard, { borderColor: "#FCA5A5" }]}>
                <Text style={styles.alertIcon}>💳</Text>
                <View>
                  <Text style={styles.alertLabel}>Umumiy qarz</Text>
                  <Text style={[styles.alertValue, { color: Colors.danger }]}>
                    {stats.totalDebt.toLocaleString()} so'm
                  </Text>
                  {stats.customersWithDebt !== undefined && (
                    <Text style={styles.alertSub}>{stats.customersWithDebt} ta mijozda</Text>
                  )}
                </View>
              </View>
            )}
            {stats.unreturnedBottles > 0 && (
              <View style={[styles.alertCard, { borderColor: "#FCD34D" }]}>
                <Text style={styles.alertIcon}>🫙</Text>
                <View>
                  <Text style={styles.alertLabel}>Qaytarilmagan idish</Text>
                  <Text style={[styles.alertValue, { color: "#D97706" }]}>
                    {stats.unreturnedBottles} ta
                  </Text>
                  {stats.customersWithBottles !== undefined && (
                    <Text style={styles.alertSub}>{stats.customersWithBottles} ta mijozda</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Alerts (ogohlantirishlar) */}
          {stats.alerts && stats.alerts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Ogohlantirishlar</Text>
              <View style={styles.alertsContainer}>
                {stats.alerts.map((alert: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.alertItem,
                      {
                        backgroundColor:
                          alert.type === "danger"
                            ? "#FEF2F2"
                            : alert.type === "warning"
                            ? "#FFFBEB"
                            : "#EFF6FF",
                        borderColor:
                          alert.type === "danger"
                            ? "#FCA5A5"
                            : alert.type === "warning"
                            ? "#FCD34D"
                            : "#93C5FD",
                      },
                    ]}
                  >
                    <Text style={styles.alertItemIcon}>
                      {alert.type === "danger" ? "🚨" : alert.type === "warning" ? "⚠️" : "ℹ️"}
                    </Text>
                    <Text
                      style={[
                        styles.alertItemText,
                        {
                          color:
                            alert.type === "danger"
                              ? Colors.danger
                              : alert.type === "warning"
                              ? "#D97706"
                              : Colors.primary,
                        },
                      ]}
                    >
                      {alert.message}
                    </Text>
                  </View>
                ))}
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
              <Text style={styles.cancelledIcon}>❌</Text>
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

function KpiCard({ label, value, icon, trend, color, subtitle }: {
  label: string; value: string; icon: string;
  trend?: number; color: string; subtitle?: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={styles.kpiTop}>
        <Text style={styles.kpiIcon}>{icon}</Text>
        {trend !== undefined && trend !== 0 && (
          <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? "#DCFCE7" : "#FEE2E2" }]}>
            <Text style={[styles.trendText, { color: trend > 0 ? "#16A34A" : "#DC2626" }]}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function StatusCard({ label, value, icon, color }: {
  label: string; value: number; icon: string; color: string;
}) {
  return (
    <View style={[styles.statusCard, { borderTopColor: color, borderTopWidth: 2 }]}>
      <Text style={styles.statusIcon}>{icon}</Text>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function PaymentCard({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <View style={[styles.paymentCard, { borderTopColor: color, borderTopWidth: 2 }]}>
      <Text style={styles.paymentLabel}>{label}</Text>
      <Text style={[styles.paymentAmount, { color }]}>{formatCurrency(amount)}</Text>
      <Text style={styles.paymentSub}>so'm</Text>
    </View>
  );
}

function WeeklyChart({ data }: { data: { day: string; orders: number; revenue: number }[] }) {
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  return (
    <View style={styles.chart}>
      {data.map((item, i) => (
        <View key={i} style={styles.chartBar}>
          <Text style={styles.chartCount}>{item.orders > 0 ? item.orders : ""}</Text>
          <View style={styles.chartBarBg}>
            <View
              style={[
                styles.chartBarFill,
                { height: `${Math.max((item.orders / maxOrders) * 100, 4)}%` },
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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  greeting: { marginBottom: 20 },
  greetingText: { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  companyText: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  loading: { textAlign: "center", color: Colors.gray[400], paddingVertical: 40 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.gray[600], marginBottom: 10, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  kpiCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  kpiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  kpiIcon: { fontSize: 24 },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  trendText: { fontSize: 11, fontWeight: "700" },
  kpiValue: { fontSize: 18, fontWeight: "800", color: Colors.gray[900] },
  kpiLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  kpiSubtitle: { fontSize: 10, color: Colors.gray[400], marginTop: 1 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statusCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 12, alignItems: "center", shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  statusIcon: { fontSize: 22, marginBottom: 4 },
  statusValue: { fontSize: 22, fontWeight: "800" },
  statusLabel: { fontSize: 10, color: Colors.gray[500], marginTop: 2, textAlign: "center" },
  // Payment breakdown
  paymentRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  paymentCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 12, alignItems: "center", shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  paymentLabel: { fontSize: 11, color: Colors.gray[600], fontWeight: "600", marginBottom: 4 },
  paymentAmount: { fontSize: 16, fontWeight: "800" },
  paymentSub: { fontSize: 10, color: Colors.gray[400] },
  alertRow: { gap: 10, marginBottom: 4 },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  alertIcon: { fontSize: 26 },
  alertLabel: { fontSize: 12, color: Colors.gray[500] },
  alertValue: { fontSize: 16, fontWeight: "700" },
  alertSub: { fontSize: 11, color: Colors.gray[400], marginTop: 1 },
  // Alerts list
  alertsContainer: { gap: 8, marginBottom: 4 },
  alertItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  alertItemIcon: { fontSize: 18 },
  alertItemText: { flex: 1, fontSize: 13, fontWeight: "500" },
  // Chart
  chartCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 6 },
  chartBar: { flex: 1, alignItems: "center", height: "100%" },
  chartCount: { fontSize: 9, color: Colors.gray[500], marginBottom: 2, fontWeight: "600" },
  chartBarBg: { flex: 1, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: "hidden", width: "100%", justifyContent: "flex-end" },
  chartBarFill: { width: "100%", backgroundColor: Colors.primary, borderRadius: 4 },
  chartDay: { fontSize: 10, color: Colors.gray[500], marginTop: 4, fontWeight: "500" },
  // Cancelled today
  cancelledCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FCA5A5", marginTop: 12 },
  cancelledIcon: { fontSize: 20 },
  cancelledText: { fontSize: 13, color: Colors.danger, fontWeight: "500" },
});
