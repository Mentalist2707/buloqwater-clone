/**
 * Super Admin — Tahlil va Moliya
 * GET /api/v1/superadmin/analytics
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Colors } from "@/constants";
import { api } from "@/services/api";

const SA_COLOR = "#6366F1";

interface AnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  topCompanyByOrders: Array<{ name: string; orders: number; revenue: number }>;
  monthlyData: Array<{ month: string; orders: number; revenue: number }>;
  paymentBreakdown: { cash: number; click: number; credit: number };
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return `${amount.toLocaleString()}`;
}

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const r = await api.get<AnalyticsData>("/superadmin/analytics");
    if (r.success && r.data) setData(r.data as AnalyticsData);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>Tahlil va Moliya 📊</Text>

      {!data ? (
        <Text style={styles.loading}>Yuklanmoqda...</Text>
      ) : (
        <>
          {/* KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: SA_COLOR, borderLeftWidth: 3 }]}>
              <Text style={styles.kpiIcon}>💰</Text>
              <Text style={styles.kpiValue}>{formatCurrency(data.totalRevenue)}</Text>
              <Text style={styles.kpiLabel}>Jami tushum</Text>
              <Text style={styles.kpiSub}>so'm</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.success, borderLeftWidth: 3 }]}>
              <Text style={styles.kpiIcon}>📅</Text>
              <Text style={styles.kpiValue}>{formatCurrency(data.monthlyRevenue)}</Text>
              <Text style={styles.kpiLabel}>Bu oylik tushum</Text>
              <Text style={styles.kpiSub}>so'm</Text>
            </View>
          </View>

          {/* Orders stats */}
          <Text style={styles.sectionTitle}>Buyurtmalar</Text>
          <View style={styles.ordersRow}>
            <View style={styles.orderStat}>
              <Text style={[styles.orderStatValue, { color: SA_COLOR }]}>{data.totalOrders}</Text>
              <Text style={styles.orderStatLabel}>Jami</Text>
            </View>
            <View style={styles.orderDivider} />
            <View style={styles.orderStat}>
              <Text style={[styles.orderStatValue, { color: Colors.success }]}>{data.deliveredOrders}</Text>
              <Text style={styles.orderStatLabel}>Yetkazilgan</Text>
            </View>
            <View style={styles.orderDivider} />
            <View style={styles.orderStat}>
              <Text style={[styles.orderStatValue, { color: Colors.warning }]}>
                {data.totalOrders > 0 ? Math.round((data.deliveredOrders / data.totalOrders) * 100) : 0}%
              </Text>
              <Text style={styles.orderStatLabel}>Bajarilish</Text>
            </View>
          </View>

          {/* Monthly bar chart */}
          <Text style={styles.sectionTitle}>Oylik buyurtmalar (6 oy)</Text>
          <View style={styles.chartCard}>
            <MonthlyChart data={data.monthlyData} />
          </View>

          {/* Top companies */}
          <Text style={styles.sectionTitle}>Top kompaniyalar 🏆</Text>
          <View style={styles.topCard}>
            {data.topCompanyByOrders.length === 0 ? (
              <Text style={styles.emptyText}>Ma'lumot yo'q</Text>
            ) : (
              data.topCompanyByOrders.map((c, i) => (
                <View key={i} style={[styles.topRow, i > 0 && styles.topRowBorder]}>
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? "#FEF3C7" : i === 1 ? "#F3F4F6" : "#FFF7ED" }]}>
                    <Text style={styles.rankText}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.topSub}>{c.orders} buyurtma</Text>
                  </View>
                  <Text style={styles.topRevenue}>{formatCurrency(c.revenue)} so'm</Text>
                </View>
              ))
            )}
          </View>

          {/* Payment breakdown */}
          <Text style={styles.sectionTitle}>To'lov turlari</Text>
          <View style={styles.payRow}>
            <View style={[styles.payCard, { borderTopColor: Colors.success, borderTopWidth: 3 }]}>
              <Text style={styles.payIcon}>💵</Text>
              <Text style={styles.payLabel}>Naqd</Text>
              <Text style={[styles.payValue, { color: Colors.success }]}>
                {formatCurrency(data.paymentBreakdown.cash)}
              </Text>
              <Text style={styles.paySub}>so'm</Text>
            </View>
            <View style={[styles.payCard, { borderTopColor: Colors.primary, borderTopWidth: 3 }]}>
              <Text style={styles.payIcon}>💳</Text>
              <Text style={styles.payLabel}>Click</Text>
              <Text style={[styles.payValue, { color: Colors.primary }]}>
                {formatCurrency(data.paymentBreakdown.click)}
              </Text>
              <Text style={styles.paySub}>so'm</Text>
            </View>
            <View style={[styles.payCard, { borderTopColor: Colors.warning, borderTopWidth: 3 }]}>
              <Text style={styles.payIcon}>📝</Text>
              <Text style={styles.payLabel}>Qarz</Text>
              <Text style={[styles.payValue, { color: Colors.warning }]}>
                {formatCurrency(data.paymentBreakdown.credit)}
              </Text>
              <Text style={styles.paySub}>so'm</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function MonthlyChart({ data }: { data: { month: string; orders: number; revenue: number }[] }) {
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
                { height: `${Math.max((item.orders / maxOrders) * 100, 4)}%`, backgroundColor: SA_COLOR },
              ]}
            />
          </View>
          <Text style={styles.chartLabel}>{item.month}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: Colors.gray[900], marginBottom: 16 },
  loading: { textAlign: "center", color: Colors.gray[400], paddingVertical: 40 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.gray[500], marginTop: 20, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  kpiRow: { flexDirection: "row", gap: 12 },
  kpiCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  kpiIcon: { fontSize: 24, marginBottom: 6 },
  kpiValue: { fontSize: 22, fontWeight: "800", color: Colors.gray[900] },
  kpiLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  kpiSub: { fontSize: 10, color: Colors.gray[400], marginTop: 1 },
  ordersRow: { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  orderStat: { flex: 1, alignItems: "center" },
  orderStatValue: { fontSize: 24, fontWeight: "800" },
  orderStatLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
  orderDivider: { width: 1, backgroundColor: Colors.gray[100] },
  chartCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 6 },
  chartBar: { flex: 1, alignItems: "center", height: "100%" },
  chartCount: { fontSize: 9, color: Colors.gray[500], marginBottom: 2, fontWeight: "600" },
  chartBarBg: { flex: 1, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: "hidden", width: "100%", justifyContent: "flex-end" },
  chartBarFill: { width: "100%", borderRadius: 4 },
  chartLabel: { fontSize: 9, color: Colors.gray[500], marginTop: 4, fontWeight: "500", textAlign: "center" },
  topCard: { backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden", shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  topRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  topRowBorder: { borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  rankBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 14, fontWeight: "700" },
  topName: { fontSize: 13, fontWeight: "700", color: Colors.gray[900] },
  topSub: { fontSize: 11, color: Colors.gray[500] },
  topRevenue: { fontSize: 12, fontWeight: "700", color: SA_COLOR },
  emptyText: { textAlign: "center", color: Colors.gray[400], padding: 16 },
  payRow: { flexDirection: "row", gap: 10 },
  payCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 12, alignItems: "center", shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  payIcon: { fontSize: 20, marginBottom: 4 },
  payLabel: { fontSize: 11, color: Colors.gray[600], fontWeight: "600", marginBottom: 4 },
  payValue: { fontSize: 15, fontWeight: "800" },
  paySub: { fontSize: 9, color: Colors.gray[400] },
});
