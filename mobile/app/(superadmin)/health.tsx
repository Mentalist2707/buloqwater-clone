/**
 * Super Admin — Tizim holati (System Health)
 * Server, DB, API, queue holatlari real-time monitoring
 */
import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Card } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";

const SA_COLOR = "#6366F1";

type HealthStatus = "healthy" | "warning" | "error" | "unknown";

interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseMs?: number;
  message?: string;
  uptime?: string;
}

interface SystemMetrics {
  cpuUsage: number;       // 0-100
  memoryUsage: number;    // 0-100
  diskUsage: number;      // 0-100
  activeConnections: number;
  requestsPerMin: number;
  errorRate: number;      // 0-100
}

interface HealthData {
  overallStatus: HealthStatus;
  lastChecked: string;
  services: ServiceHealth[];
  metrics: SystemMetrics;
  recentErrors: Array<{
    id: string;
    message: string;
    path: string;
    createdAt: string;
    count: number;
  }>;
}

const STATUS_CONFIG: Record<HealthStatus, { color: string; bg: string; icon: string; label: string }> = {
  healthy: { color: Colors.success,  bg: Colors.successLight, icon: "✅", label: "Ishlayapti" },
  warning: { color: Colors.warning,  bg: Colors.warningLight, icon: "⚠️", label: "Ogohlantirish" },
  error:   { color: Colors.danger,   bg: Colors.dangerLight,  icon: "❌", label: "Xato" },
  unknown: { color: Colors.gray[500], bg: Colors.gray[100],   icon: "❓", label: "Noma'lum" },
};

function getTimeDiff(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s oldin`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} daq oldin`;
  return `${Math.floor(minutes / 60)} soat oldin`;
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const barColor = value > 85 ? Colors.danger : value > 65 ? Colors.warning : color;
  return (
    <View style={mbStyles.container}>
      <View style={mbStyles.labelRow}>
        <Text style={mbStyles.label}>{label}</Text>
        <Text style={[mbStyles.value, { color: barColor }]}>{value.toFixed(1)}%</Text>
      </View>
      <View style={mbStyles.track}>
        <View style={[mbStyles.fill, { width: `${Math.min(value, 100)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const mbStyles = StyleSheet.create({
  container: { marginBottom: 14 },
  labelRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label:     { fontSize: 13, color: Colors.gray[700] },
  value:     { fontSize: 13, fontWeight: "700" },
  track:     { height: 8, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: "hidden" },
  fill:      { height: 8, borderRadius: 4 },
});

export default function HealthScreen() {
  const [data, setData]           = useState<HealthData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    const r = await api.get<HealthData>("/superadmin/health");
    if (r.success && r.data) {
      setData(r.data);
      setLastUpdated(new Date());
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => {
    load();
    // Auto-refresh har 30 sekundda
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const overall = data ? STATUS_CONFIG[data.overallStatus] : STATUS_CONFIG.unknown;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tizim holati</Text>
          {lastUpdated && (
            <Text style={styles.headerSub}>
              Yangilandi: {lastUpdated.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading && !data ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={SA_COLOR} />
          <Text style={styles.loadingText}>Tizim ma'lumotlari yuklanmoqda...</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall status banner */}
          <View style={[styles.overallBanner, { backgroundColor: overall.bg }]}>
            <Text style={styles.overallIcon}>{overall.icon}</Text>
            <View>
              <Text style={[styles.overallLabel, { color: overall.color }]}>
                Umumiy holat: {overall.label}
              </Text>
              {data && (
                <Text style={styles.overallTime}>
                  Tekshirildi: {getTimeDiff(data.lastChecked)}
                </Text>
              )}
            </View>
            <View style={[styles.pulseDot, { backgroundColor: overall.color }]} />
          </View>

          {/* Services */}
          <Text style={styles.sectionTitle}>Xizmatlar</Text>
          <Card style={styles.listCard} padding={0}>
            {(data?.services ?? FALLBACK_SERVICES).map((s, idx, arr) => {
              const cfg = STATUS_CONFIG[s.status];
              return (
                <View key={s.name}>
                  <View style={styles.serviceRow}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{s.name}</Text>
                      {s.message ? (
                        <Text style={[styles.serviceMsg, { color: s.status === "error" ? Colors.danger : Colors.gray[500] }]}>
                          {s.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      {s.responseMs !== undefined && (
                        <Text style={styles.responseMs}>{s.responseMs}ms</Text>
                      )}
                    </View>
                  </View>
                  {idx < arr.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </Card>

          {/* Metrics */}
          {data?.metrics && (
            <>
              <Text style={styles.sectionTitle}>Resurslar</Text>
              <Card padding={16}>
                <MetricBar label="💻 CPU yuklanish" value={data.metrics.cpuUsage} color={SA_COLOR} />
                <MetricBar label="🧠 RAM xotira" value={data.metrics.memoryUsage} color={Colors.primary} />
                <MetricBar label="💾 Disk" value={data.metrics.diskUsage} color={Colors.warning} />
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>{data.metrics.activeConnections}</Text>
                    <Text style={styles.metricLabel}>Faol ulanish</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>{data.metrics.requestsPerMin}</Text>
                    <Text style={styles.metricLabel}>So'rov/daqiqa</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={[styles.metricValue, { color: data.metrics.errorRate > 5 ? Colors.danger : Colors.success }]}>
                      {data.metrics.errorRate.toFixed(1)}%
                    </Text>
                    <Text style={styles.metricLabel}>Xato darajasi</Text>
                  </View>
                </View>
              </Card>
            </>
          )}

          {/* Recent errors */}
          {data?.recentErrors && data.recentErrors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>So'nggi xatolar</Text>
              <Card style={styles.listCard} padding={0}>
                {data.recentErrors.map((e, idx, arr) => (
                  <View key={e.id}>
                    <View style={styles.errorRow}>
                      <View style={[styles.errorCountBadge, { backgroundColor: Colors.dangerLight }]}>
                        <Text style={styles.errorCount}>{e.count}x</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.errorPath} numberOfLines={1}>{e.path}</Text>
                        <Text style={styles.errorMsg} numberOfLines={2}>{e.message}</Text>
                      </View>
                      <Text style={styles.errorTime}>{getTimeDiff(e.createdAt)}</Text>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </Card>
            </>
          )}

          {!data && (
            <View style={styles.noData}>
              <Text style={styles.noDataIcon}>📡</Text>
              <Text style={styles.noDataText}>Ma'lumot olib bo'lmadi</Text>
              <Text style={styles.noDataSub}>Server bilan aloqa yo'q yoki endpoint hali tayyor emas</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Agar API javob bermasa — placeholder
const FALLBACK_SERVICES: ServiceHealth[] = [
  { name: "🗄️ Ma'lumotlar bazasi (PostgreSQL)", status: "unknown" },
  { name: "🌐 API Server (Next.js)",             status: "unknown" },
  { name: "📨 Email xizmati",                    status: "unknown" },
  { name: "💾 Fayl saqlash (Storage)",           status: "unknown" },
  { name: "🔐 Auth tizimi (JWT)",                status: "unknown" },
];

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },

  headerBar:   { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn:     { padding: 4 },
  backIcon:    { fontSize: 30, color: Colors.gray[700], lineHeight: 34 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  headerSub:   { fontSize: 11, color: Colors.gray[400], marginTop: 1 },
  refreshBtn:  { padding: 8, borderRadius: 10, backgroundColor: SA_COLOR + "15" },
  refreshIcon: { fontSize: 20, color: SA_COLOR, fontWeight: "700" },

  loadingBox:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { fontSize: 14, color: Colors.gray[500] },

  content:     { padding: 16, paddingBottom: 40 },

  // Overall banner
  overallBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16, marginBottom: 20,
  },
  overallIcon:  { fontSize: 32 },
  overallLabel: { fontSize: 16, fontWeight: "700" },
  overallTime:  { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
  pulseDot:     { width: 10, height: 10, borderRadius: 5, marginLeft: "auto" },

  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: Colors.gray[400],
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 10, marginTop: 4, paddingHorizontal: 4,
  },

  listCard:    { overflow: "hidden", marginBottom: 16 },
  divider:     { height: 1, backgroundColor: Colors.gray[100], marginLeft: 16 },

  // Service row
  serviceRow:  { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  statusDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  serviceName: { fontSize: 14, fontWeight: "600", color: Colors.gray[800] },
  serviceMsg:  { fontSize: 12, marginTop: 2 },
  statusPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: "600" },
  responseMs:  { fontSize: 11, color: Colors.gray[400], marginTop: 3 },

  // Metrics
  metricsRow:  { flexDirection: "row", gap: 8, marginTop: 4 },
  metricBox:   { flex: 1, alignItems: "center", backgroundColor: Colors.gray[50], borderRadius: 12, padding: 12 },
  metricValue: { fontSize: 20, fontWeight: "800", color: Colors.gray[900] },
  metricLabel: { fontSize: 10, color: Colors.gray[500], marginTop: 2, textAlign: "center" },

  // Error rows
  errorRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  errorCountBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  errorCount: { fontSize: 11, fontWeight: "700", color: Colors.danger },
  errorPath:  { fontSize: 13, fontWeight: "600", color: Colors.gray[800] },
  errorMsg:   { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  errorTime:  { fontSize: 11, color: Colors.gray[400], flexShrink: 0 },

  // No data
  noData:     { alignItems: "center", paddingTop: 40 },
  noDataIcon: { fontSize: 48, marginBottom: 12 },
  noDataText: { fontSize: 16, fontWeight: "600", color: Colors.gray[600] },
  noDataSub:  { fontSize: 13, color: Colors.gray[400], textAlign: "center", marginTop: 4, paddingHorizontal: 20 },
});
