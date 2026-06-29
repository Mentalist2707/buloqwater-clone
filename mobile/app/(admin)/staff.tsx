/**
 * Admin xodimlar ekrani (Premium iOS / Slate Style)
 * Xodimlarni ko'rish, yaratish, tahrirlash, bloklash va KPI ko'rsatkichlari
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: "OPERATOR" | "DRIVER";
  isActive: boolean;
  createdAt?: string;
  kpi?: {
    delivered: number;
    assigned: number;
    bottlesCollected: number;
    cashCollected: number;
    activeOrders: number;
  };
}

async function getStaff() {
  return api.get<StaffMember[]>("/staff");
}

async function createStaff(data: { name: string; phone: string; password: string; role: string }) {
  return api.post("/staff", data);
}

async function updateStaff(userId: string, data: { name: string; phone: string; password?: string }) {
  return api.put(`/staff/${userId}`, data);
}

async function toggleStaff(userId: string) {
  return api.post(`/staff/${userId}/toggle`, {});
}

export default function AdminStaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"ALL" | "OPERATOR" | "DRIVER">("ALL");
  const [search, setSearch] = useState("");

  // Modal Statelari
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forma maydonlari
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OPERATOR" | "DRIVER">("DRIVER");

  const loadStaff = async () => {
    const res = await getStaff();
    if (res.success && res.data) {
      setStaff(res.data);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  };

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setName("");
    setPhone("998");
    setPassword("");
    setRole("DRIVER");
    setErrorMsg("");
    setModalVisible(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setPhone(member.phone);
    setPassword("");
    setRole(member.role);
    setErrorMsg("");
    setModalVisible(true);
  };

  const handleToggleStatus = (member: StaffMember) => {
    Alert.alert(
      member.isActive ? "⏸️ Xodimni bloklash" : "▶️ Blokdan chiqarish",
      `"${member.name}" xodimining holatini o'zgartirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: member.isActive ? "Bloklash" : "Aktivlashtirish",
          style: member.isActive ? "destructive" : "default",
          onPress: async () => {
            const res = await toggleStaff(member.id);
            if (res.success) {
              loadStaff();
            } else {
              Alert.alert("Xatolik", (res as any).error || "Statusni o'zgartirib bo'lmadi");
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setErrorMsg("Ism va telefon raqam kiriting");
      return;
    }
    if (!editingStaff && !password.trim()) {
      setErrorMsg("Yangi xodim uchun parol majburiy");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const payload: any = { name, phone, role };
    if (password.trim()) payload.password = password;

    let res;
    if (editingStaff) {
      res = await updateStaff(editingStaff.id, payload);
    } else {
      res = await createStaff(payload);
    }

    setSubmitting(false);
    if (res.success) {
      setModalVisible(false);
      loadStaff();
    } else {
      setErrorMsg((res as any).error || "Amalni bajarib bo'lmadi");
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (roleFilter !== "ALL" && s.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.phone.includes(q);
    }
    return true;
  });

  const renderStaffItem = ({ item: s }: { item: StaffMember }) => {
    const isDriver = s.role === "DRIVER";
    const kpi = s.kpi;

    return (
      <Card style={[styles.staffCard, !s.isActive && styles.cardInactive]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, gap: 4 }}>
            {/* Rol Badge'i */}
            <View style={[styles.roleBadge, isDriver ? styles.driverBadgeBg : styles.operatorBadgeBg]}>
              <Text style={[styles.roleBadgeText, isDriver ? styles.driverBadgeText : styles.operatorBadgeText]}>
                {isDriver ? "🚗 Haydovchi" : "🎧 Operator"}
              </Text>
            </View>
            <Text style={[styles.staffName, !s.isActive && styles.textMuted]}>{s.name}</Text>
            <Text style={styles.staffPhone}>📞 +{s.phone}</Text>
          </View>

          {/* O'ng tarafdagi boshqaruv tugmalari */}
          <View style={styles.actionColumn}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(s)}>
              <Text style={styles.editBtnText}>✏️ Tahrirlash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusToggleBtn, s.isActive ? styles.btnBlockBg : styles.btnActiveBg]}
              onPress={() => handleToggleStatus(s)}
            >
              <Text style={[styles.statusToggleText, s.isActive ? styles.btnBlockText : styles.btnActiveText]}>
                {s.isActive ? "Bloklash" : "Yoqish"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Ko'rsatkichlari Dashbordi */}
        {s.isActive && kpi && (
          <View style={styles.kpiContainer}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiValue}>{kpi.delivered}</Text>
                <Text style={styles.kpiLabel}>Yetkazildi</Text>
              </View>
              {isDriver ? (
                <>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiValue, { color: "#16A34A" }]}>
                      {kpi.cashCollected.toLocaleString()}
                    </Text>
                    <Text style={styles.kpiLabel}>Naqd pul (so'm)</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiValue, { color: "#0284C7" }]}>{kpi.bottlesCollected}</Text>
                    <Text style={styles.kpiLabel}>Idish yig'ildi</Text>
                  </View>
                </>
              ) : (
                <View style={styles.kpiBox}>
                  <Text style={[styles.kpiValue, { color: Colors.primary }]}>{kpi.assigned}</Text>
                  <Text style={styles.kpiLabel}>Biriktirildi</Text>
                </View>
              )}
              {isDriver && kpi.activeOrders > 0 && (
                <View style={[styles.kpiBox, { backgroundColor: "rgba(217, 119, 6, 0.06)" }]}>
                  <Text style={[styles.kpiValue, { color: "#D97706" }]}>{kpi.activeOrders}</Text>
                  <Text style={styles.kpiLabel}>Jarayonda</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Yuqori Panel va Qidiruv */}
      <View style={styles.topBar}>
        <Input
          placeholder="🔍 Ism yoki telefon bo'yicha qidirish..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Filter tugmalari */}
      <View style={styles.filterRow}>
        {([
          { key: "ALL" as const, label: "Barchasi" },
          { key: "DRIVER" as const, label: "Haydovchilar" },
          { key: "OPERATOR" as const, label: "Operatorlar" },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, roleFilter === f.key && styles.filterChipActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text style={[styles.filterChipText, roleFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Xodimlar ro'yxati */}
      <FlatList
        data={filteredStaff}
        renderItem={renderStaffItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.centerBox}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>Xodimlar topilmadi</Text>
              </>
            )}
          </View>
        }
      />

      {/* Floating Action Button (FAB) qo'shish */}
      {!loading && (
        <TouchableOpacity style={styles.fabBtn} onPress={handleOpenCreate} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      )}

      {/* Yaratish / Tahrirlash Modali */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>
              {editingStaff ? "Xodim ma'lumotlarini tahrirlash" : "Yangi xodim qo'shish"}
            </Text>
            <Text style={styles.modalSub}>Tizimga kirish huquqini belgilash</Text>

            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>F.I.Sh (Ism va familiya):</Text>
              <Input placeholder="Masalan: Ali Valiyev" value={name} onChangeText={setName} style={styles.modalInput} />

              <Text style={styles.inputLabel}>Telefon raqami:</Text>
             <Input 
      placeholder="998901234567" 
      keyboardType="numeric" 
      value={phone} 
      onChangeText={setPhone} 
      style={styles.modalInput} 
    />
              <Text style={styles.inputLabel}>Tizim uchun parol {editingStaff && "(o'zgartirish ixtiyoriy)"}:</Text>
              <Input placeholder="Parol kiriting" secureTextEntry value={password} onChangeText={setPassword} style={styles.modalInput} />

              <Text style={styles.inputLabel}>Xodim lavozimi (Roli):</Text>
              {/* Segmented control style role row */}
              <View style={styles.roleSegmentRow}>
                <TouchableOpacity
                  style={[styles.roleSegBtn, role === "DRIVER" && styles.roleSegBtnActive]}
                  onPress={() => setRole("DRIVER")}
                >
                  <Text style={[styles.roleSegText, role === "DRIVER" && styles.roleSegTextActive]}>🚗 Haydovchi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleSegBtn, role === "OPERATOR" && styles.roleSegBtnActive]}
                  onPress={() => setRole("OPERATOR")}
                >
                  <Text style={[styles.roleSegText, role === "OPERATOR" && styles.roleSegTextActive]}>🎧 Operator</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActionsRow}>
                <Button
                  title="Bekor qilish"
                  variant="outline"
                  style={styles.modalBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                />
                <Button
                  title={submitting ? "Saqlanmoqda..." : "Saqlash"}
                  style={styles.modalBtn}
                  onPress={handleSubmit}
                  disabled={submitting}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC",paddingTop:30,paddingBottom:80 },
  topBar: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  
  // Filter row
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  filterChipTextActive: { color: "#FFFFFF", fontWeight: "600" },

  listContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },

  // Xodim kartasi
  staffCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInactive: { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1", opacity: 0.7 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  
  // Role badges
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 2 },
  driverBadgeBg: { backgroundColor: "rgba(2, 132, 199, 0.08)" },
  operatorBadgeBg: { backgroundColor: "rgba(99, 102, 241, 0.08)" },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },
  driverBadgeText: { color: "#0284C7" },
  operatorBadgeText: { color: "#6366F1" },

  staffName: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 4 },
  staffPhone: { fontSize: 13, color: "#64748B", marginTop: 2 },
  textMuted: { color: "#94A3B8", textDecorationLine: "line-through" },

  // Harakatlar ustuni
  actionColumn: { alignItems: "flex-end", gap: 8 },
  editBtn: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  editBtnText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  
  statusToggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  statusToggleText: { fontSize: 12, fontWeight: "600" },
  btnBlockBg: { backgroundColor: "rgba(220, 38, 38, 0.05)", borderColor: "rgba(220, 38, 38, 0.2)" },
  btnBlockText: { color: "#DC2626" },
  btnActiveBg: { backgroundColor: "rgba(22, 163, 74, 0.05)", borderColor: "rgba(22, 163, 74, 0.2)" },
  btnActiveText: { color: "#16A34A" },

  // KPI Dashboard grid ko'rinishi
  kpiContainer: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpiBox: { flex: 1, minWidth: "28%", backgroundColor: "#F8FAFC", padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "#F1F5F9" },
  kpiValue: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  kpiLabel: { fontSize: 10, color: "#64748B", marginTop: 2, fontWeight: "500" },

  // Bo'sh holat
  centerBox: { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 54, marginBottom: 14 },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "500" },

  // Floating button (FAB)
  fabBtn: { position: "absolute", bottom: 75, right: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  fabIcon: { fontSize: 24, color: "#FFFFFF", fontWeight: "600" },

  // Modal (iOS Bottom Sheet style)
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, maxHeight: "90%" },
  modalIndicator: { width: 36, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  modalTitle: { fontSize: 19, fontWeight: "800", color: "#0F172A" },
  modalSub: { fontSize: 14, color: "#64748B", marginTop: 4, marginBottom: 16 },
  
  errorContainer: { backgroundColor: "rgba(220, 38, 38, 0.06)", padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.15)" },
  errorText: { color: "#DC2626", fontSize: 13, fontWeight: "600" },
  
  inputLabel: { 
    fontSize: 14, // 15 dan 14 ga tushirish vizual yengillik beradi
    fontWeight: "600", 
    color: "#64748B", // Biroz ochroq rang
    marginBottom: 6,  // paddingTop o'rniga marginBottom ishlating
  },
  modalInput: { 
    borderRadius: 12, 
    height: 48, 
    borderColor: "#E2E8F0", // Border rangini ochroq qildik
    backgroundColor: "#F8FAFC", 
    fontSize: 15,
    paddingHorizontal: 16, 
    borderWidth: 1, 
    color: "#0F172A",
    textAlignVertical: 'center', // Android uchun
  },
  // Custom Segmented Control for Roles
  roleSegmentRow: { flexDirection: "row", backgroundColor: "#F1F5F9", padding: 4, borderRadius: 12, marginVertical: 10 },
  roleSegBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  roleSegBtnActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  roleSegText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  roleSegTextActive: { color: "#0F172A", fontWeight: "700" },

  modalActionsRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  modalBtn: { flex: 1, borderRadius: 12, height: 46 },

  
});
