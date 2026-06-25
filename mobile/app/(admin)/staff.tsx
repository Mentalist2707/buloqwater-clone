/**
 * Admin xodimlar ekrani
 * Web: /admin/staff — xodimlarni ko'rish, yaratish, tahrirlash, bloklash
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView,
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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPERATOR" | "DRIVER">("ALL");
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", phone: "", password: "", role: "OPERATOR" as "OPERATOR" | "DRIVER" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit modal
  const [editUser, setEditUser] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const load = async () => {
    const r = await getStaff();
    if (r.success && r.data) setStaff(r.data as StaffMember[]);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleToggle = (user: StaffMember) => {
    Alert.alert(
      user.isActive ? "🚫 Bloklash" : "✅ Faollashtirish",
      user.isActive
        ? `${user.name}ni bloklashni xohlaysizmi?\nXodim tizimga kira olmaydi, lekin ma'lumotlari saqlanadi.`
        : `${user.name}ni qayta faollashtirasizmi?`,
      [
        { text: "Bekor", style: "cancel" },
        {
          text: user.isActive ? "Bloklash" : "Faollashtirish",
          style: user.isActive ? "destructive" : "default",
          onPress: async () => { await toggleStaff(user.id); load(); },
        },
      ]
    );
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.phone || !createForm.password) {
      setCreateError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setCreating(true);
    setCreateError("");
    const phone = createForm.phone.startsWith("+") ? createForm.phone : `+998${createForm.phone}`;
    const r = await createStaff({ ...createForm, phone });
    if (r.success) {
      setShowCreate(false);
      setCreateForm({ name: "", phone: "", password: "", role: "OPERATOR" });
      load();
      Alert.alert("✅", "Xodim qo'shildi!");
    } else {
      setCreateError((r as any).error || "Xatolik");
    }
    setCreating(false);
  };

  const openEdit = (user: StaffMember) => {
    setEditUser(user);
    setEditForm({ name: user.name, phone: user.phone, password: "" });
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editUser) return;
    if (!editForm.name.trim()) {
      setEditError("Ism bo'sh bo'lishi mumkin emas");
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      setEditError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setSaving(true);
    setEditError("");
    const r = await updateStaff(editUser.id, {
      name: editForm.name.trim(),
      phone: editForm.phone.startsWith("+") ? editForm.phone : `+998${editForm.phone}`,
      ...(editForm.password ? { password: editForm.password } : {}),
    });
    if (r.success) {
      setEditUser(null);
      load();
      Alert.alert("✅", "Xodim yangilandi!");
    } else {
      setEditError((r as any).error || "Xatolik");
    }
    setSaving(false);
  };

  const filtered = staff.filter((s) => {
    if (filter !== "ALL" && s.role !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.phone.includes(q)) return false;
    }
    return true;
  });

  const operators = filtered.filter((s) => s.role === "OPERATOR");
  const drivers = filtered.filter((s) => s.role === "DRIVER");

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Input
          placeholder="🔍 Ism yoki telefon..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(["ALL", "OPERATOR", "DRIVER"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, filter === r && styles.chipActive]}
            onPress={() => setFilter(r)}
          >
            <Text style={[styles.chipText, filter === r && styles.chipTextActive]}>
              {r === "ALL"
                ? `Barchasi (${staff.length})`
                : r === "OPERATOR"
                ? `☎️ Operator (${staff.filter((s) => s.role === "OPERATOR").length})`
                : `🚚 Haydovchi (${staff.filter((s) => s.role === "DRIVER").length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {/* Operators */}
        {(filter === "ALL" || filter === "OPERATOR") && operators.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>☎️ Operatorlar ({operators.length})</Text>
            {operators.map((s) => (
              <StaffCard
                key={s.id}
                user={s}
                onToggle={() => handleToggle(s)}
                onEdit={() => openEdit(s)}
              />
            ))}
          </>
        )}

        {/* Drivers */}
        {(filter === "ALL" || filter === "DRIVER") && drivers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🚚 Haydovchilar ({drivers.length})</Text>
            {drivers.map((s) => (
              <StaffCard
                key={s.id}
                user={s}
                onToggle={() => handleToggle(s)}
                onEdit={() => openEdit(s)}
              />
            ))}
          </>
        )}

        {filtered.length === 0 && !loading && (
          <Text style={styles.empty}>Xodim topilmadi</Text>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setShowCreate(true); setCreateError(""); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* CREATE MODAL */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yangi Xodim Qo'shish</Text>
            {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

            <Input
              label="Ism familiya *"
              placeholder="Jasur Eshmatov"
              value={createForm.name}
              onChangeText={(v) => setCreateForm({ ...createForm, name: v })}
            />
            <Input
              label="Telefon *"
              placeholder="+998901234567"
              value={createForm.phone}
              onChangeText={(v) => setCreateForm({ ...createForm, phone: v })}
              keyboardType="phone-pad"
            />
            <Input
              label="Parol *"
              placeholder="Kamida 6 ta belgi"
              value={createForm.password}
              onChangeText={(v) => setCreateForm({ ...createForm, password: v })}
              secureTextEntry
            />

            <Text style={styles.roleLabel}>Lavozim</Text>
            <View style={styles.roleRow}>
              {(["OPERATOR", "DRIVER"] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleBtn, createForm.role === role && styles.roleBtnActive]}
                  onPress={() => setCreateForm({ ...createForm, role })}
                >
                  <Text style={styles.roleIcon}>{role === "OPERATOR" ? "☎️" : "🚚"}</Text>
                  <Text
                    style={[
                      styles.roleText,
                      createForm.role === role && { color: Colors.primary, fontWeight: "700" },
                    ]}
                  >
                    {role === "OPERATOR" ? "Operator" : "Haydovchi"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="Qo'shish" onPress={handleCreate} loading={creating} style={{ flex: 1 }} />
              <Button
                title="Bekor"
                onPress={() => { setShowCreate(false); setCreateError(""); setCreateForm({ name: "", phone: "", password: "", role: "OPERATOR" }); }}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={!!editUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Tahrirlash</Text>
            <Text style={styles.modalSub}>{editUser?.name} · {editUser?.role === "OPERATOR" ? "Operator" : "Haydovchi"}</Text>
            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

            <Input
              label="Ism familiya *"
              value={editForm.name}
              onChangeText={(v) => setEditForm({ ...editForm, name: v })}
            />
            <Input
              label="Telefon *"
              value={editForm.phone}
              onChangeText={(v) => setEditForm({ ...editForm, phone: v })}
              keyboardType="phone-pad"
            />

            <View style={styles.passwordSection}>
              <Text style={styles.passwordSectionTitle}>🔑 Parolni yangilash</Text>
              <Text style={styles.passwordSectionSub}>Bo'sh qoldiring — parol o'zgarmaydi</Text>
              <Input
                label=""
                placeholder="Yangi parol (bo'sh = o'zgarmaydi)"
                value={editForm.password}
                onChangeText={(v) => setEditForm({ ...editForm, password: v })}
                secureTextEntry
              />
            </View>

            <View style={styles.modalActions}>
              <Button title="💾 Saqlash" onPress={handleEdit} loading={saving} style={{ flex: 1 }} />
              <Button
                title="Bekor"
                onPress={() => { setEditUser(null); setEditError(""); }}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StaffCard({
  user,
  onToggle,
  onEdit,
}: {
  user: StaffMember;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <Card style={[styles.card, !user.isActive && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: user.isActive
                ? user.role === "DRIVER"
                  ? Colors.success
                  : Colors.primary
                : Colors.gray[400],
            },
          ]}
        >
          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.staffName}>{user.name}</Text>
          <Text style={styles.staffPhone}>{user.phone}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: user.isActive ? "#DCFCE7" : "#FEE2E2" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: user.isActive ? Colors.success : Colors.danger },
            ]}
          >
            {user.isActive ? "Faol" : "Bloklangan"}
          </Text>
        </View>
      </View>

      {/* KPI */}
      {user.kpi && (
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>
              {user.kpi.delivered}/{user.kpi.assigned}
            </Text>
            <Text style={styles.kpiLabel}>Yetkazish</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{user.kpi.bottlesCollected}</Text>
            <Text style={styles.kpiLabel}>🫙 Idish</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiValue, { color: Colors.success }]}>
              {(user.kpi.cashCollected / 1000).toFixed(0)}K
            </Text>
            <Text style={styles.kpiLabel}>💵 Kassa</Text>
          </View>
          {user.kpi.activeOrders > 0 && (
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiValue, { color: Colors.primary }]}>
                {user.kpi.activeOrders}
              </Text>
              <Text style={styles.kpiLabel}>Yo'nalish</Text>
            </View>
          )}
        </View>
      )}

      {/* KPI yetkazish progress */}
      {user.kpi && user.kpi.assigned > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((user.kpi.delivered / user.kpi.assigned) * 100, 100)}%`,
                  backgroundColor:
                    user.kpi.delivered / user.kpi.assigned >= 0.8
                      ? Colors.success
                      : Colors.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((user.kpi.delivered / user.kpi.assigned) * 100)}%
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>✏️ Tahrirlash</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            { backgroundColor: user.isActive ? "#FEE2E2" : "#DCFCE7" },
          ]}
          onPress={onToggle}
        >
          <Text
            style={[
              styles.toggleText,
              { color: user.isActive ? Colors.danger : Colors.success },
            ]}
          >
            {user.isActive ? "🚫 Bloklash" : "✅ Faollashtirish"}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: { paddingHorizontal: 16, paddingTop: 12 },
  filterRow: { flexDirection: "row", gap: 8, padding: 12, paddingBottom: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.gray[600] },
  chipTextActive: { color: Colors.white, fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.gray[500], textTransform: "uppercase", letterSpacing: 0.5, marginVertical: 10 },
  empty: { textAlign: "center", color: Colors.gray[400], paddingVertical: 40 },
  card: { padding: 14, marginBottom: 10 },
  cardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  staffName: { fontSize: 15, fontWeight: "600", color: Colors.gray[800] },
  staffPhone: { fontSize: 12, color: Colors.gray[500], marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "600" },
  kpiRow: { flexDirection: "row", gap: 8, backgroundColor: Colors.gray[50], borderRadius: 10, padding: 10, marginBottom: 10 },
  kpiItem: { flex: 1, alignItems: "center" },
  kpiValue: { fontSize: 14, fontWeight: "700", color: Colors.gray[800] },
  kpiLabel: { fontSize: 10, color: Colors.gray[500], marginTop: 2 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: Colors.gray[100], borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, color: Colors.gray[500], fontWeight: "600", width: 32, textAlign: "right" },
  actionRow: { flexDirection: "row", gap: 8 },
  editBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  editBtnText: { fontSize: 13, fontWeight: "600", color: Colors.gray[700] },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  toggleText: { fontSize: 13, fontWeight: "600" },
  // FAB
  fab: { position: "absolute", right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: Colors.white, fontWeight: "300", marginTop: -2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 },
  modalSub: { fontSize: 13, color: Colors.gray[500], marginBottom: 16 },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, backgroundColor: Colors.dangerLight, padding: 10, borderRadius: 8 },
  roleLabel: { fontSize: 14, fontWeight: "500", color: Colors.gray[700], marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  roleBtn: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 12, borderWidth: 2, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleIcon: { fontSize: 24, marginBottom: 4 },
  roleText: { fontSize: 13, fontWeight: "600", color: Colors.gray[600] },
  passwordSection: { borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 12, marginBottom: 8 },
  passwordSectionTitle: { fontSize: 14, fontWeight: "600", color: Colors.gray[700] },
  passwordSectionSub: { fontSize: 11, color: Colors.gray[400], marginTop: 2, marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
});
