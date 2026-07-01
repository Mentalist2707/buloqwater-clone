/**
 * Super Admin — Foydalanuvchilar boshqaruvi
 * Barcha kompaniyalar bo'yicha foydalanuvchilarni ko'rish, bloklash, parol tiklash
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Modal, ScrollView,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { Card, Input, Button } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";
import type { Role } from "@/types";

const SA_COLOR = "#6366F1";

interface UserItem {
  id: string;
  name: string;
  phone: string;
  role: Role;
  isBlocked: boolean;
  createdAt: string;
  company: { id: string; name: string; subdomain: string } | null;
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "👑 Super Admin",
  DIRECTOR:    "🎯 Direktor",
  OPERATOR:    "🖥️ Operator",
  DRIVER:      "🚚 Haydovchi",
  CUSTOMER:    "👤 Mijoz",
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: SA_COLOR,
  DIRECTOR:    "#7C3AED",
  OPERATOR:    Colors.primary,
  DRIVER:      Colors.warning,
  CUSTOMER:    Colors.success,
};

const ROLE_FILTERS: Array<{ key: Role | "ALL"; label: string }> = [
  { key: "ALL",        label: "Barchasi" },
  { key: "DIRECTOR",   label: "Direktor" },
  { key: "OPERATOR",   label: "Operator" },
  { key: "DRIVER",     label: "Haydovchi" },
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function UsersScreen() {
  const [users, setUsers]         = useState<UserItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  // Reset password modal
  const [resetUser, setResetUser]   = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const load = async () => {
    const r = await api.get<UserItem[]>("/superadmin/users");
    if (r.success && r.data) setUsers(r.data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleToggleBlock = (u: UserItem) => {
    Alert.alert(
      u.isBlocked ? "🔓 Blokdan chiqarish" : "🔒 Bloklash",
      u.isBlocked
        ? `${u.name} ni blokdan chiqarasizmi?`
        : `${u.name} ni bloklaysizmi? Tizimga kira olmaydi.`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: u.isBlocked ? "Chiqarish" : "Bloklash",
          style: u.isBlocked ? "default" : "destructive",
          onPress: async () => {
            const r = await api.post(`/superadmin/users/${u.id}/toggle-block`, {});
            if (r.success) {
              load();
            } else {
              Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (newPassword.length < 6) {
      Alert.alert("Xato", "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setResetLoading(true);
    const r = await api.post(`/superadmin/users/${resetUser.id}/reset-password`, {
      newPassword,
    });
    setResetLoading(false);
    if (r.success) {
      Alert.alert("✅ Muvaffaqiyat", `${resetUser.name} paroli yangilandi`);
      setResetUser(null);
      setNewPassword("");
    } else {
      Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.company?.name.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const renderUser = ({ item: u }: { item: UserItem }) => {
    const color = ROLE_COLORS[u.role] ?? Colors.gray[500];
    return (
      <Card style={[styles.userCard, u.isBlocked && styles.userCardBlocked]} padding={14}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: color + "18" }]}>
            <Text style={[styles.avatarText, { color }]}>{getInitials(u.name)}</Text>
          </View>

          {/* Info */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
              {u.isBlocked && (
                <View style={styles.blockedBadge}>
                  <Text style={styles.blockedText}>🔒 Bloklangan</Text>
                </View>
              )}
            </View>
            <Text style={styles.userPhone}>{u.phone}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.rolePill, { backgroundColor: color + "15" }]}>
                <Text style={[styles.roleText, { color }]}>{ROLE_LABELS[u.role]}</Text>
              </View>
              {u.company && (
                <Text style={styles.companyText} numberOfLines={1}>· {u.company.name}</Text>
              )}
            </View>
            <Text style={styles.dateText}>📅 {formatDate(u.createdAt)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: Colors.gray[200] }]}
            onPress={() => { setResetUser(u); setNewPassword(""); }}
          >
            <Text style={styles.actionBtnText}>🔑 Parolni tiklash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: u.isBlocked ? Colors.success + "60" : Colors.danger + "60",
                backgroundColor: u.isBlocked ? Colors.successLight : Colors.dangerLight },
            ]}
            onPress={() => handleToggleBlock(u)}
          >
            <Text style={[
              styles.actionBtnText,
              { color: u.isBlocked ? Colors.success : Colors.danger },
            ]}>
              {u.isBlocked ? "🔓 Ochish" : "🔒 Bloklash"}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back + Title */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Foydalanuvchilar</Text>
          <Text style={styles.headerSub}>{users.length} ta foydalanuvchi</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="🔍 Ism, telefon yoki kompaniya..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch("")}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {ROLE_FILTERS.map((f) => {
          const count = f.key === "ALL"
            ? users.length
            : users.filter((u) => u.role === f.key).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, roleFilter === f.key && styles.chipActive]}
              onPress={() => setRoleFilter(f.key)}
            >
              <Text style={[styles.chipText, roleFilter === f.key && styles.chipTextActive]}>
                {f.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        renderItem={renderUser}
        keyExtractor={(u) => u.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>
              {loading ? "Yuklanmoqda..." : "Foydalanuvchi topilmadi"}
            </Text>
          </View>
        }
      />

      {/* Reset Password Modal */}
      <Modal visible={!!resetUser} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🔑 Parolni tiklash</Text>
            <Text style={styles.modalSub}>{resetUser?.name} · {resetUser?.phone}</Text>
            <Input
              label="Yangi parol *"
              placeholder="Kamida 6 ta belgi"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.modalBtns}>
              <Button
                title="Bekor qilish"
                variant="outline"
                onPress={() => { setResetUser(null); setNewPassword(""); }}
                style={{ flex: 1 }}
              />
              <Button
                title="Saqlash"
                onPress={handleResetPassword}
                loading={resetLoading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },

  // Header
  headerBar:    { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn:      { padding: 4 },
  backIcon:     { fontSize: 30, color: Colors.gray[700], lineHeight: 34 },
  headerTitle:  { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  headerSub:    { fontSize: 12, color: Colors.gray[400], marginTop: 1 },

  // Search
  searchWrapper: { position: "relative", paddingHorizontal: 16, marginBottom: 4 },
  clearBtn:     { position: "absolute", right: 28, top: 14, padding: 6 },
  clearBtnText: { fontSize: 14, color: Colors.gray[500], fontWeight: "600" },

  // Chips
  chipRow:      { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive:   { backgroundColor: SA_COLOR, borderColor: SA_COLOR },
  chipText:     { fontSize: 13, color: Colors.gray[600] },
  chipTextActive: { color: Colors.white, fontWeight: "600" },

  // List
  list:         { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  userCard:     { },
  userCardBlocked: { opacity: 0.75 },

  // User card internals
  cardRow:      { flexDirection: "row", gap: 12, marginBottom: 10 },
  avatar:       { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText:   { fontSize: 15, fontWeight: "700" },
  userInfo:     { flex: 1 },
  nameRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  userName:     { fontSize: 15, fontWeight: "600", color: Colors.gray[900], flex: 1 },
  blockedBadge: { backgroundColor: Colors.dangerLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  blockedText:  { fontSize: 10, color: Colors.danger, fontWeight: "600" },
  userPhone:    { fontSize: 13, color: Colors.gray[500], marginBottom: 4 },
  metaRow:      { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 },
  rolePill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleText:     { fontSize: 11, fontWeight: "600" },
  companyText:  { fontSize: 11, color: Colors.gray[400] },
  dateText:     { fontSize: 11, color: Colors.gray[400] },

  // Actions
  actionRow:    { flexDirection: "row", gap: 8 },
  actionBtn:    { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, backgroundColor: Colors.white },
  actionBtnText:{ fontSize: 12, fontWeight: "600", color: Colors.gray[700] },

  // Empty
  empty:        { alignItems: "center", paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: Colors.gray[400] },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox:     { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 },
  modalSub:     { fontSize: 13, color: Colors.gray[400], marginBottom: 16 },
  modalBtns:    { flexDirection: "row", gap: 12, marginTop: 4 },
});
