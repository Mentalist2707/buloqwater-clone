/**
 * Admin (Director) xodimlar ekrani (2026 redesign)
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
  TextInput,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button, Input, Screen } from "@/components/ui";
import { api } from "@/services/api";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

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
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OPERATOR" | "DRIVER">("DRIVER");

  const loadStaff = async () => {
    const res = await getStaff();
    if (res.success && res.data) setStaff(res.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, []),
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
      member.isActive ? "Xodimni bloklash" : "Blokdan chiqarish",
      `"${member.name}" xodimining holatini o'zgartirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: member.isActive ? "Bloklash" : "Aktivlashtirish",
          style: member.isActive ? "destructive" : "default",
          onPress: async () => {
            const res = await toggleStaff(member.id);
            if (res.success) loadStaff();
            else Alert.alert("Xatolik", (res as any).error || "Statusni o'zgartirib bo'lmadi");
          },
        },
      ],
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
    const res = editingStaff ? await updateStaff(editingStaff.id, payload) : await createStaff(payload);
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
    const roleColor = isDriver ? palette.aqua500 : palette.violet500;
    return (
      <View style={[styles.staffCard, !s.isActive && styles.cardInactive]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
              <Feather name={isDriver ? "truck" : "headphones"} size={11} color={roleColor} />
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>{isDriver ? "Haydovchi" : "Operator"}</Text>
            </View>
            <Text style={[styles.staffName, !s.isActive && styles.textMuted]}>{s.name}</Text>
            <Text style={styles.staffPhone}>+{s.phone}</Text>
          </View>
          <View style={styles.actionColumn}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(s)}>
              <Feather name="edit-2" size={13} color={theme.textSecondary} />
              <Text style={styles.editBtnText}>Tahrir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusToggleBtn, s.isActive ? styles.btnBlockBg : styles.btnActiveBg]}
              onPress={() => handleToggleStatus(s)}
            >
              <Text style={[styles.statusToggleText, { color: s.isActive ? theme.danger : theme.success }]}>
                {s.isActive ? "Bloklash" : "Yoqish"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
                    <Text style={[styles.kpiValue, { color: theme.success }]}>{kpi.cashCollected.toLocaleString()}</Text>
                    <Text style={styles.kpiLabel}>Naqd (so'm)</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiValue, { color: theme.primaryDark }]}>{kpi.bottlesCollected}</Text>
                    <Text style={styles.kpiLabel}>Idish</Text>
                  </View>
                </>
              ) : (
                <View style={styles.kpiBox}>
                  <Text style={[styles.kpiValue, { color: theme.primary }]}>{kpi.assigned}</Text>
                  <Text style={styles.kpiLabel}>Biriktirildi</Text>
                </View>
              )}
              {isDriver && kpi.activeOrders > 0 && (
                <View style={[styles.kpiBox, { backgroundColor: theme.warningSoft }]}>
                  <Text style={[styles.kpiValue, { color: palette.amber600 }]}>{kpi.activeOrders}</Text>
                  <Text style={styles.kpiLabel}>Jarayonda</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.pageTitle}>Xodimlar</Text>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput placeholder="Ism yoki telefon..." placeholderTextColor={theme.textMuted} value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      <View style={styles.filterRow}>
        {[
          { key: "ALL" as const, label: "Barchasi" },
          { key: "DRIVER" as const, label: "Haydovchilar" },
          { key: "OPERATOR" as const, label: "Operatorlar" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, roleFilter === f.key && styles.filterChipActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text style={[styles.filterChipText, roleFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredStaff}
        renderItem={renderStaffItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                <View style={styles.emptyIconBox}>
                  <Feather name="users" size={34} color={theme.primary} />
                </View>
                <Text style={styles.emptyText}>Xodimlar topilmadi</Text>
              </>
            )}
          </View>
        }
      />

      {!loading && (
        <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 92 }, shadow.brand]} onPress={handleOpenCreate} activeOpacity={0.9}>
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>{editingStaff ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}</Text>
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={14} color={theme.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              <Input label="F.I.Sh" placeholder="Ali Valiyev" value={name} onChangeText={setName} icon="user" />
              <Input label="Telefon raqami" placeholder="998901234567" keyboardType="numeric" value={phone} onChangeText={setPhone} icon="phone" />
              <Input
                label={`Parol ${editingStaff ? "(o'zgartirish ixtiyoriy)" : "*"}`}
                placeholder="Parol kiriting"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                icon="lock"
              />
              <Text style={styles.fieldLabel}>Xodim lavozimi</Text>
              <View style={styles.roleSegmentRow}>
                <TouchableOpacity style={[styles.roleSegBtn, role === "DRIVER" && styles.roleSegBtnActive]} onPress={() => setRole("DRIVER")}>
                  <Feather name="truck" size={15} color={role === "DRIVER" ? theme.primaryDark : theme.textSecondary} />
                  <Text style={[styles.roleSegText, role === "DRIVER" && styles.roleSegTextActive]}>Haydovchi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleSegBtn, role === "OPERATOR" && styles.roleSegBtnActive]} onPress={() => setRole("OPERATOR")}>
                  <Feather name="headphones" size={15} color={role === "OPERATOR" ? theme.primaryDark : theme.textSecondary} />
                  <Text style={[styles.roleSegText, role === "OPERATOR" && styles.roleSegTextActive]}>Operator</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalActionsRow}>
                <Button title="Bekor" variant="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} disabled={submitting} />
                <Button title="Saqlash" style={{ flex: 1 }} onPress={handleSubmit} loading={submitting} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.base, gap: spacing.md },
  pageTitle: { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.6 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    height: 50,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  searchInput: { flex: 1, fontSize: fontSize.base, color: theme.text, fontWeight: fontWeight.medium },

  filterRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  filterChip: { paddingHorizontal: spacing.base, paddingVertical: 9, borderRadius: radius.md, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterChipText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.bold },
  filterChipTextActive: { color: "#fff" },

  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 110 },
  staffCard: { padding: spacing.base, borderRadius: radius.xl, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderSoft, ...shadow.sm },
  cardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  roleBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  staffName: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text, marginTop: 4 },
  staffPhone: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.semibold },
  textMuted: { color: theme.textMuted, textDecorationLine: "line-through" },

  actionColumn: { alignItems: "flex-end", gap: spacing.sm },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: theme.surfaceAlt, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm },
  editBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: theme.textSecondary },
  statusToggleBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1 },
  statusToggleText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  btnBlockBg: { backgroundColor: theme.dangerSoft, borderColor: palette.rose400 + "44" },
  btnActiveBg: { backgroundColor: theme.successSoft, borderColor: palette.mint400 + "44" },

  kpiContainer: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.border },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kpiBox: { flex: 1, minWidth: "28%", backgroundColor: theme.bg, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: theme.border },
  kpiValue: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: theme.text },
  kpiLabel: { fontSize: 10, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 90 },
  emptyIconBox: { width: 78, height: 78, borderRadius: radius["2xl"], backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.base },
  emptyText: { fontSize: fontSize.md, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  fab: { position: "absolute", right: spacing.xl, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], padding: spacing.xl, maxHeight: "90%" },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text },
  errorContainer: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.dangerSoft, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  errorText: { color: theme.danger, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },

  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary, marginBottom: 6, paddingLeft: 2 },
  roleSegmentRow: { flexDirection: "row", backgroundColor: theme.surfaceAlt, padding: 4, borderRadius: radius.md, marginBottom: spacing.md },
  roleSegBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingVertical: 11, borderRadius: radius.sm },
  roleSegBtnActive: { backgroundColor: theme.surface, ...shadow.xs },
  roleSegText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  roleSegTextActive: { color: theme.text, fontWeight: fontWeight.bold },

  modalActionsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
});
