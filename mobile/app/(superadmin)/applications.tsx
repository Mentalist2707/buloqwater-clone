/**
 * Super Admin — Zayavkalar (kompaniya qo'shish so'rovlari) — improved
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Modal,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";

const SA_COLOR = "#6366F1";

interface Application {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  address?: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  createdAt: string;
}

type DateFilter = "ALL" | "TODAY" | "YESTERDAY" | "WEEK";

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isInDateFilter(createdAt: string, df: DateFilter): boolean {
  if (df === "ALL") return true;
  const d = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);
  if (df === "TODAY") return d >= startOfToday;
  if (df === "YESTERDAY") return d >= startOfYesterday && d < startOfToday;
  if (df === "WEEK") return d >= startOfWeek;
  return true;
}

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState<Application[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");

  const [rejectModal, setRejectModal] = useState<Application | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    const r = await api.get<Application[]>("/superadmin/applications");
    if (r.success && r.data) setApplications(r.data as Application[]);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleApprove = (app: Application) => {
    Alert.alert("✅ Qabul qilish", `${app.companyName} uchun yangi kompaniya yaratiladi. Davom etasizmi?`, [
      { text: "Bekor", style: "cancel" },
      {
        text: "Qabul",
        onPress: async () => {
          setActionLoading(true);
          const r = await api.post(`/superadmin/applications/${app.id}/approve`, {});
          if (r.success) {
            Alert.alert("✅", "Zayavka qabul qilindi!");
            load();
          } else {
            Alert.alert("Xatolik", (r as any).error || "Xatolik yuz berdi");
          }
          setActionLoading(false);
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    const r = await api.post(`/superadmin/applications/${rejectModal.id}/reject`, { note: rejectNote });
    if (r.success) {
      setRejectModal(null);
      setRejectNote("");
      load();
      Alert.alert("✅", "Zayavka rad etildi");
    } else {
      Alert.alert("Xatolik", (r as any).error || "Xatolik yuz berdi");
    }
    setActionLoading(false);
  };

  const filtered = applications.filter((a) => {
    if (filter !== "ALL" && a.status !== filter) return false;
    if (!isInDateFilter(a.createdAt, dateFilter)) return false;
    return true;
  });

  const pendingCount = applications.filter((a) => a.status === "PENDING").length;

  const renderApp = ({ item: app }: { item: Application }) => {
    const borderColor =
      app.status === "PENDING" ? "#FCD34D" :
      app.status === "APPROVED" ? "#86EFAC" : "#FCA5A5";

    return (
      <Card style={[styles.appCard, { borderLeftColor: borderColor, borderLeftWidth: 3 }]}>
        <View style={styles.appHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>{app.companyName}</Text>
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusBadge, {
                backgroundColor:
                  app.status === "PENDING" ? "#FEF3C7" :
                  app.status === "APPROVED" ? "#DCFCE7" : "#FEE2E2"
              }]}>
                <Text style={[styles.statusText, {
                  color:
                    app.status === "PENDING" ? Colors.warning :
                    app.status === "APPROVED" ? Colors.success : Colors.danger
                }]}>
                  {app.status === "PENDING" ? "⏳ Kutilmoqda" :
                   app.status === "APPROVED" ? "✅ Qabul" : "❌ Rad etilgan"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoRows}>
          <Text style={styles.infoItem}>👤 <Text style={styles.infoVal}>{app.ownerName}</Text></Text>
          <Text style={styles.infoItem}>📞 {app.phone}</Text>
          {app.address ? (
            <Text style={styles.infoItem} numberOfLines={2} ellipsizeMode="tail">📍 {app.address}</Text>
          ) : null}
          {app.description ? (
            <View style={styles.descBox}>
              <Text style={styles.descText} numberOfLines={2} ellipsizeMode="tail">{app.description}</Text>
            </View>
          ) : null}
          {app.adminNote ? (
            <Text style={[styles.infoItem, { color: Colors.danger }]} numberOfLines={2} ellipsizeMode="tail">
              📝 {app.adminNote}
            </Text>
          ) : null}
          <Text style={styles.dateText}>{formatDate(app.createdAt)}</Text>
        </View>

        {app.status === "PENDING" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => handleApprove(app)}
              disabled={actionLoading}
            >
              <Text style={styles.approveBtnText}>✅ Qabul</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => { setRejectModal(app); setRejectNote(""); }}
              disabled={actionLoading}
            >
              <Text style={styles.rejectBtnText}>❌ Rad</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status filter */}
      <View style={styles.filterRow}>
        {([
          { key: "ALL" as const, label: `Barchasi (${applications.length})` },
          { key: "PENDING" as const, label: `⏳ Kutilmoqda ${pendingCount > 0 ? `(${pendingCount})` : ""}` },
          { key: "APPROVED" as const, label: "✅ Qabul" },
          { key: "REJECTED" as const, label: "❌ Rad" },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              filter === f.key && styles.chipActive,
              f.key === "PENDING" && pendingCount > 0 && filter !== "PENDING" && styles.chipPending,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date filter chips */}
      <View style={styles.dateFilterRow}>
        {([
          { key: "ALL" as DateFilter, label: "Barchasi" },
          { key: "TODAY" as DateFilter, label: "Bugun" },
          { key: "YESTERDAY" as DateFilter, label: "Kecha" },
          { key: "WEEK" as DateFilter, label: "Hafta" },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.dateChip, dateFilter === f.key && styles.dateChipActive]}
            onPress={() => setDateFilter(f.key)}
          >
            <Text style={[styles.dateChipText, dateFilter === f.key && styles.dateChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.hintBadge}>
          <Text style={styles.hintText}>ℹ️ Uzun matnlar qisqartiriladi</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderApp}
        keyExtractor={(a) => a.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{loading ? "Yuklanmoqda..." : "Zayavka topilmadi"}</Text>
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal visible={!!rejectModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>❌ Zayavkani rad etish</Text>
            {rejectModal && (
              <View style={styles.rejectInfo}>
                <Text style={styles.rejectCompany}>{rejectModal.companyName}</Text>
                <Text style={styles.rejectOwner}>{rejectModal.ownerName} · {rejectModal.phone}</Text>
              </View>
            )}
            <Input
              label="Sabab (ixtiyoriy)"
              placeholder="Rad etish sababi..."
              value={rejectNote}
              onChangeText={setRejectNote}
            />
            <View style={styles.modalActions}>
              <Button title="Rad etish" onPress={handleReject} loading={actionLoading} variant="danger" style={{ flex: 1 }} />
              <Button title="Bekor" onPress={() => setRejectModal(null)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16, paddingBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive: { backgroundColor: SA_COLOR, borderColor: SA_COLOR },
  chipPending: { borderColor: Colors.warning, backgroundColor: "#FFFBEB" },
  chipText: { fontSize: 12, color: Colors.gray[600] },
  chipTextActive: { color: Colors.white, fontWeight: "600" },
  dateFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, paddingBottom: 8, alignItems: "center" },
  dateChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  dateChipActive: { backgroundColor: Colors.secondary + "20", borderColor: Colors.secondary },
  dateChipText: { fontSize: 11, color: Colors.gray[600] },
  dateChipTextActive: { color: Colors.secondary, fontWeight: "600" },
  hintBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: "#EFF6FF" },
  hintText: { fontSize: 10, color: Colors.primary },
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },
  appCard: { padding: 14 },
  appHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  appName: { fontSize: 16, fontWeight: "700", color: Colors.gray[900] },
  statusBadgeRow: { marginTop: 4 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: "600" },
  infoRows: { gap: 4 },
  infoItem: { fontSize: 13, color: Colors.gray[600] },
  infoVal: { color: Colors.gray[900], fontWeight: "600" },
  descBox: { backgroundColor: Colors.gray[50], padding: 8, borderRadius: 8, marginTop: 4 },
  descText: { fontSize: 12, color: Colors.gray[600] },
  dateText: { fontSize: 11, color: Colors.gray[400], marginTop: 6 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  approveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#DCFCE7", borderWidth: 1, borderColor: "#86EFAC" },
  approveBtnText: { fontSize: 14, fontWeight: "700", color: Colors.success },
  rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5" },
  rejectBtnText: { fontSize: 14, fontWeight: "700", color: Colors.danger },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray[500] },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 12 },
  rejectInfo: { backgroundColor: Colors.gray[50], padding: 12, borderRadius: 10, marginBottom: 12 },
  rejectCompany: { fontSize: 14, fontWeight: "700", color: Colors.gray[900] },
  rejectOwner: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
});
