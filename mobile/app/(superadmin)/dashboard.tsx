/**
 * Super Admin Dashboard
 * Web: /superadmin/dashboard — tizim statistikasi, top kompaniyalar
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";

const SA_COLOR = "#6366F1";

interface DashboardData {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  thisMonthCompanies: number;
  growthPercent: number;
  topCompanies: Array<{
    id: string;
    name: string;
    subdomain: string;
    status: string;
    _count: { orders: number; customers: number; users: number };
    subscription: { endDate: string; isPaid: boolean } | null;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    company: { name: string } | null;
  }>;
}

function getTimeDiff(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    company_created: "🏢", company_suspended: "⏸️", company_activated: "▶️",
    user_created: "👤", user_login: "🔑", order_delivered: "📦",
    payment_received: "💰", subscription_extended: "📅",
  };
  return icons[action] || "📋";
}

function getDaysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuthStore();

  const load = async () => {
    const r = await api.get<DashboardData>("/superadmin/stats");
    if (r.success && r.data) setData(r.data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Super Admin 👑</Text>
          <Text style={styles.headerSub}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      {!data ? (
        <Text style={styles.loading}>Yuklanmoqda...</Text>
      ) : (
        <>
          {/* Stat Cards */}
          <Text style={styles.sectionTitle}>Tizim Ko'rsatkichlari</Text>
          <View style={styles.statsGrid}>
            <StatBox icon="🏢" label="Jami" value={data.totalCompanies} color={SA_COLOR} sub={`+${data.thisMonthCompanies} bu oy`} />
            <StatBox icon="✅" label="Faol" value={data.activeCompanies} color={Colors.success} />
            <StatBox icon="⏸️" label="Muzlatilgan" value={data.suspendedCompanies} color={Colors.danger} />
            <StatBox icon="👥" label="Foydalanuvchilar" value={data.totalUsers} color={Colors.warning} />
          </View>

          {/* O'sish */}
          {data.growthPercent !== 0 && (
            <View style={[styles.growthCard, { backgroundColor: data.growthPercent > 0 ? "#F0FDF4" : "#FEF2F2" }]}>
              <Text style={styles.growthIcon}>{data.growthPercent > 0 ? "📈" : "📉"}</Text>
              <Text style={[styles.growthText, { color: data.growthPercent > 0 ? Colors.success : Colors.danger }]}>
                O'tgan oyga nisbatan {data.growthPercent > 0 ? "+" : ""}{data.growthPercent}% o'sish
              </Text>
            </View>
          )}

          {/* Top 5 Kompaniyalar */}
          <Text style={styles.sectionTitle}>Eng Faol Kompaniyalar</Text>
          <Card style={styles.listCard}>
            {data.topCompanies.length === 0 ? (
              <Text style={styles.emptyText}>Hali kompaniya yo'q</Text>
            ) : (
              data.topCompanies.map((c, idx) => {
                const daysLeft = c.subscription ? getDaysLeft(c.subscription.endDate) : null;
                return (
                  <View key={c.id} style={[styles.companyRow, idx > 0 && styles.companyRowBorder]}>
                    <View style={[styles.rankBadge, { backgroundColor: SA_COLOR + "20" }]}>
                      <Text style={[styles.rankText, { color: SA_COLOR }]}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.companyName}>{c.name}</Text>
                      <Text style={styles.companySub}>
                        📦 {c._count.orders} · 👥 {c._count.customers} · 👤 {c._count.users}
                      </Text>
                    </View>
                    {daysLeft !== null && (
                      <View style={[
                        styles.daysBadge,
                        { backgroundColor: daysLeft > 7 ? "#DCFCE7" : daysLeft > 0 ? "#FEF3C7" : "#FEE2E2" }
                      ]}>
                        <Text style={[
                          styles.daysText,
                          { color: daysLeft > 7 ? Colors.success : daysLeft > 0 ? Colors.warning : Colors.danger }
                        ]}>
                          {daysLeft > 0 ? `${daysLeft}k` : "❌"}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </Card>

          {/* Faoliyat Jurnali */}
          <Text style={styles.sectionTitle}>So'nggi Faoliyat</Text>
          <Card style={styles.listCard}>
            {data.recentLogs.length === 0 ? (
              <Text style={styles.emptyText}>Hali faoliyat yo'q</Text>
            ) : (
              data.recentLogs.map((log, idx) => (
                <View key={log.id} style={[styles.logRow, idx > 0 && styles.logRowBorder]}>
                  <Text style={styles.logIcon}>{getActionIcon(log.action)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logDesc}>{log.description}</Text>
                    <View style={styles.logMeta}>
                      <Text style={styles.logTime}>{getTimeDiff(log.createdAt)}</Text>
                      {log.company && (
                        <Text style={[styles.logCompany, { color: SA_COLOR }]}>{log.company.name}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function StatBox({ icon, label, value, color, sub }: {
  icon: string; label: string; value: number; color: string; sub?: string;
}) {
  return (
    <View style={[styles.statBox, { borderTopColor: color, borderTopWidth: 2 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.gray[900] },
  headerSub: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 14, color: Colors.danger },
  loading: { textAlign: "center", color: Colors.gray[400], paddingVertical: 40 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.gray[600], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  statSub: { fontSize: 10, color: Colors.gray[400], marginTop: 1 },
  growthCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginTop: 4 },
  growthIcon: { fontSize: 22 },
  growthText: { fontSize: 14, fontWeight: "600" },
  listCard: { padding: 0, overflow: "hidden" },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  companyRowBorder: { borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  rankBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 14, fontWeight: "800" },
  companyName: { fontSize: 14, fontWeight: "600", color: Colors.gray[800] },
  companySub: { fontSize: 11, color: Colors.gray[500], marginTop: 1 },
  daysBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  daysText: { fontSize: 12, fontWeight: "700" },
  logRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  logRowBorder: { borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  logIcon: { fontSize: 18, marginTop: 1 },
  logDesc: { fontSize: 13, color: Colors.gray[800] },
  logMeta: { flexDirection: "row", gap: 8, marginTop: 2 },
  logTime: { fontSize: 11, color: Colors.gray[400] },
  logCompany: { fontSize: 11, fontWeight: "600" },
  emptyText: { textAlign: "center", color: Colors.gray[400], paddingVertical: 20, fontSize: 14 },
});
