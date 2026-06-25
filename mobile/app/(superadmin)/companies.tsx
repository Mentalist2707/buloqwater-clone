/**
 * Super Admin — Kompaniyalar boshqaruvi (improved)
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView, ActivityIndicator,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Card, Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types";

const SA_COLOR = "#6366F1";

interface Company {
  id: string;
  name: string;
  subdomain: string;
  status: "ACTIVE" | "SUSPENDED";
  phone: string | null;
  maxCustomers: number;
  maxUsers: number;
  createdAt: string;
  director: { id: string; name: string; phone: string } | null;
  _count: { users: number; customers: number; orders: number };
  subscription: { endDate: string; isPaid: boolean; amount: number } | null;
}

function getDaysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function getCardBorderStyle(c: Company, daysLeft: number | null) {
  if (c.status === "SUSPENDED") return { borderColor: Colors.danger, borderWidth: 2 };
  if (daysLeft !== null && daysLeft <= 0) return { borderColor: Colors.danger, borderWidth: 2 };
  if (daysLeft !== null && daysLeft <= 7) return { borderColor: "#F59E0B", borderWidth: 2 };
  return {};
}

export default function CompaniesScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  const { startImpersonate } = useAuthStore();
  const [impersonateLoading, setImpersonateLoading] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    companyName: "", subdomain: "",
    directorName: "", directorPhone: "", directorPassword: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit modal
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Subscription modal
  const [subCompany, setSubCompany] = useState<Company | null>(null);
  const [subMonths, setSubMonths] = useState("1");
  const [subAmount, setSubAmount] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  const load = async () => {
    const r = await api.get<Company[]>("/superadmin/companies");
    if (r.success && r.data) setCompanies(r.data as Company[]);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleToggle = (c: Company) => {
    Alert.alert(
      c.status === "ACTIVE" ? "⏸️ Muzlatish" : "▶️ Faollashtirish",
      c.status === "ACTIVE"
        ? `${c.name} kompaniyasini muzlatmoqchimisiz?\nBarcha foydalanuvchilar tizimga kira olmaydi.`
        : `${c.name} ni qayta faollashtirasizmi?`,
      [
        { text: "Bekor", style: "cancel" },
        {
          text: c.status === "ACTIVE" ? "Muzlatish" : "Faollashtirish",
          style: c.status === "ACTIVE" ? "destructive" : "default",
          onPress: async () => {
            await api.post(`/superadmin/companies/${c.id}/toggle`, {});
            load();
          },
        },
      ]
    );
  };

  const handleImpersonate = (c: Company) => {
    if (c.status === "SUSPENDED") {
      Alert.alert("⚠️ Diqqat", "Bu kompaniya muzlatilgan. Baribir kirasizmi?", [
        { text: "Bekor qilish", style: "cancel" },
        { text: "Kirish", onPress: () => doImpersonate(c) },
      ]);
      return;
    }
    Alert.alert(
      "🔑 Firma sifatida kirish",
      `"${c.name}" firmasi nomidan kirasizmi?\n\nSiz admin panelni ko'rasiz. Chiqish uchun yuqoridagi sariq banner orqali qaytasiz.`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { text: "Kirish", onPress: () => doImpersonate(c) },
      ]
    );
  };

  const doImpersonate = async (c: Company) => {
    setImpersonateLoading(c.id);
    const r = await api.post<{ token: string; user: User }>(
      `/superadmin/companies/${c.id}/impersonate`, {}
    );
    setImpersonateLoading(null);
    if (r.success && r.data) {
      await startImpersonate(r.data.token, r.data.user);
      // Director rolini aniqlash
      const role = r.data.user.role;
      switch (role) {
        case "DIRECTOR": router.replace("/(admin)/dashboard"); break;
        case "OPERATOR":  router.replace("/(operator)/orders"); break;
        case "DRIVER":    router.replace("/(driver)/tasks"); break;
        default:          router.replace("/(admin)/dashboard");
      }
    } else {
      Alert.alert("Xato", (r as any).error || "Firmaga kirib bo'lmadi");
    }
  };

  const handleCreate = async () => {    if (!createForm.companyName || !createForm.subdomain || !createForm.directorName || !createForm.directorPhone || !createForm.directorPassword) {
      setCreateError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (createForm.directorPassword.length < 6) {
      setCreateError("Parol kamida 6 ta belgi");
      return;
    }
    setCreating(true); setCreateError("");
    const phone = createForm.directorPhone.startsWith("+") ? createForm.directorPhone : `+998${createForm.directorPhone}`;
    const r = await api.post("/superadmin/companies", {
      companyName: createForm.companyName,
      subdomain: createForm.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      directorName: createForm.directorName,
      directorPhone: phone,
      directorPassword: createForm.directorPassword,
    });
    if (r.success) {
      setShowCreate(false);
      setCreateForm({ companyName: "", subdomain: "", directorName: "", directorPhone: "", directorPassword: "" });
      load();
      Alert.alert("✅", "Kompaniya yaratildi!");
    } else {
      setCreateError((r as any).error || "Xatolik");
    }
    setCreating(false);
  };

  const handleEdit = async () => {
    if (!editCompany) return;
    if (!editForm.name.trim()) { setEditError("Kompaniya nomi bo'sh bo'lmasin"); return; }
    setEditLoading(true); setEditError("");
    const r = await api.put(`/superadmin/companies/${editCompany.id}`, {
      name: editForm.name.trim(),
      phone: editForm.phone.trim() || null,
    });
    if (r.success) {
      setEditCompany(null);
      load();
      Alert.alert("✅", "Kompaniya yangilandi!");
    } else {
      setEditError((r as any).error || "Xatolik yuz berdi");
    }
    setEditLoading(false);
  };

  const handleExtendSub = async () => {
    if (!subCompany) return;
    setSubLoading(true);
    const r = await api.post(`/superadmin/companies/${subCompany.id}/subscription`, {
      months: parseInt(subMonths),
      amount: parseFloat(subAmount || "0"),
    });
    if (r.success) {
      setSubCompany(null);
      load();
      Alert.alert("✅", "Obuna uzaytirildi!");
    } else {
      Alert.alert("Xatolik", (r as any).error || "Xatolik yuz berdi");
    }
    setSubLoading(false);
  };

  const filtered = companies.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.subdomain.includes(q)) return false;
    }
    return true;
  });

  const renderCompany = ({ item: c }: { item: Company }) => {
    const daysLeft = c.subscription ? getDaysLeft(c.subscription.endDate) : null;
    const isGlobalTemplate = c.subdomain === "global-templates";
    const borderStyle = isGlobalTemplate ? {} : getCardBorderStyle(c, daysLeft);

    return (
      <Card style={[styles.companyCard, borderStyle, isGlobalTemplate && styles.companyCardTemplate]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: isGlobalTemplate ? "#EDE9FE" : SA_COLOR + "20" }]}>
            <Text style={[styles.avatarText, { color: isGlobalTemplate ? "#7C3AED" : SA_COLOR }]}>
              {c.name.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">{c.name}</Text>
            <Text style={styles.subdomain} numberOfLines={1}>{c.subdomain}.buloqwater.uz</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: c.status === "ACTIVE" ? "#DCFCE7" : "#FEE2E2" }
          ]}>
            <Text style={[styles.statusText, { color: c.status === "ACTIVE" ? Colors.success : Colors.danger }]}>
              {c.status === "ACTIVE" ? "Faol" : "Muzlatilgan"}
            </Text>
          </View>
        </View>

        {/* Suspended warning */}
        {c.status === "SUSPENDED" && (
          <View style={styles.suspendHint}>
            <Text style={styles.suspendHintText}>
              🚫 Foydalanuvchilar bloklangan ekranni ko'radi
            </Text>
          </View>
        )}

        {/* Director */}
        {c.director ? (
          <View style={styles.directorRow}>
            <Text style={styles.directorIcon}>👤</Text>
            <Text style={styles.directorName}>{c.director.name}</Text>
            <Text style={styles.directorPhone}>{c.director.phone}</Text>
          </View>
        ) : (
          <Text style={styles.noDirector}>👤 Direktor biriktirilmagan</Text>
        )}

        {/* Stats inline */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{c._count.orders} 📦</Text>
          <Text style={styles.statSep}>·</Text>
          <Text style={styles.statText}>{c._count.customers}/{c.maxCustomers} 🧑‍💼</Text>
          <Text style={styles.statSep}>·</Text>
          <Text style={styles.statText}>{c._count.users}/{c.maxUsers} 👥</Text>
        </View>

        {/* Subscription */}
        {!isGlobalTemplate && daysLeft !== null && (
          <View style={[
            styles.subRow,
            { backgroundColor: daysLeft > 7 ? "#F0FDF4" : daysLeft > 0 ? "#FFFBEB" : "#FEF2F2" }
          ]}>
            <Text style={[
              styles.subText,
              { color: daysLeft > 7 ? Colors.success : daysLeft > 0 ? Colors.warning : Colors.danger }
            ]}>
              {daysLeft > 0 ? `📅 ${daysLeft} kun qoldi` : `⚠️ ${Math.abs(daysLeft)} kun o'tgan`}
            </Text>
          </View>
        )}

        {/* Actions — 3 buttons */}
        {!isGlobalTemplate && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => { setEditCompany(c); setEditForm({ name: c.name, phone: c.phone || "" }); setEditError(""); }}
            >
              <Text style={styles.editBtnText}>✏️ Tahrirlash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subBtn}
              onPress={() => { setSubCompany(c); setSubMonths("1"); setSubAmount(""); }}
            >
              <Text style={styles.subBtnText}>📅 Obuna</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.impersonateBtn, impersonateLoading === c.id && styles.btnLoading]}
              onPress={() => handleImpersonate(c)}
              disabled={impersonateLoading !== null}
            >
              {impersonateLoading === c.id
                ? <ActivityIndicator size="small" color={Colors.warning} />
                : <Text style={styles.impersonateBtnText}>🔑 Kirish</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: c.status === "ACTIVE" ? "#FEE2E2" : "#DCFCE7" }]}
              onPress={() => handleToggle(c)}
            >
              <Text style={[styles.toggleBtnText, { color: c.status === "ACTIVE" ? Colors.danger : Colors.success }]}>
                {c.status === "ACTIVE" ? "⏸️" : "▶️"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  const activeCount = companies.filter((c) => c.status === "ACTIVE").length;
  const suspendedCount = companies.filter((c) => c.status === "SUSPENDED").length;

  return (
    <View style={styles.container}>
      {/* Search with clear button */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="🔍 Kompaniya nomi yoki subdomen..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch("")}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {([
          { key: "ALL" as const, label: `Barchasi (${companies.length})` },
          { key: "ACTIVE" as const, label: `✅ Faol (${activeCount})` },
          { key: "SUSPENDED" as const, label: `⏸️ Muzlatilgan (${suspendedCount})` },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, statusFilter === f.key && styles.chipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderCompany}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>{loading ? "Yuklanmoqda..." : "Kompaniya topilmadi"}</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: SA_COLOR }]}
        onPress={() => { setShowCreate(true); setCreateError(""); }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal visible={!!editCompany} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Kompaniyani tahrirlash</Text>
            <Text style={styles.modalSub}>{editCompany?.subdomain}.buloqwater.uz</Text>
            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}
            <Input
              label="Kompaniya nomi *"
              placeholder="Shifo Suv MChJ"
              value={editForm.name}
              onChangeText={(v) => setEditForm({ ...editForm, name: v })}
            />
            <Input
              label="Telefon"
              placeholder="+998901234567"
              value={editForm.phone}
              onChangeText={(v) => setEditForm({ ...editForm, phone: v })}
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <Button title="Saqlash" onPress={handleEdit} loading={editLoading} style={{ flex: 1 }} />
              <Button title="Bekor" onPress={() => setEditCompany(null)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Yangi Kompaniya</Text>
              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
              <Input label="Kompaniya nomi *" placeholder="Shifo Suv MChJ" value={createForm.companyName} onChangeText={(v) => setCreateForm({ ...createForm, companyName: v })} />
              <Input label="Subdomen *" placeholder="shifo (.buloqwater.uz)" value={createForm.subdomain} onChangeText={(v) => setCreateForm({ ...createForm, subdomain: v.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
              <Text style={styles.sectionDivider}>Direktor ma'lumotlari</Text>
              <Input label="Ismi *" placeholder="Bobur Toshmatov" value={createForm.directorName} onChangeText={(v) => setCreateForm({ ...createForm, directorName: v })} />
              <Input label="Telefon *" placeholder="+998901234567" value={createForm.directorPhone} onChangeText={(v) => setCreateForm({ ...createForm, directorPhone: v })} keyboardType="phone-pad" />
              <Input label="Parol *" placeholder="Kamida 6 ta belgi" value={createForm.directorPassword} onChangeText={(v) => setCreateForm({ ...createForm, directorPassword: v })} secureTextEntry />
              <View style={styles.modalActions}>
                <Button title="Yaratish" onPress={handleCreate} loading={creating} style={{ flex: 1 }} />
                <Button title="Bekor" onPress={() => setShowCreate(false)} variant="outline" style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <Modal visible={!!subCompany} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Obuna uzaytirish</Text>
            <Text style={styles.modalSub}>{subCompany?.name}</Text>
            {subCompany?.subscription && (
              <View style={styles.currentSubRow}>
                <Text style={styles.currentSubText}>
                  Hozirgi muddat: {new Date(subCompany.subscription.endDate).toLocaleDateString("uz-UZ")}
                </Text>
              </View>
            )}
            <Text style={styles.fieldLabel}>Necha oy?</Text>
            <View style={styles.monthsRow}>
              {["1", "3", "6", "12"].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthBtn, subMonths === m && styles.monthBtnActive]}
                  onPress={() => setSubMonths(m)}
                >
                  <Text style={[styles.monthText, subMonths === m && styles.monthTextActive]}>
                    {m} oy
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="To'lov (so'm)" placeholder="500000" value={subAmount} onChangeText={setSubAmount} keyboardType="numeric" />
            <View style={styles.modalActions}>
              <Button title="Uzaytirish" onPress={handleExtendSub} loading={subLoading} style={{ flex: 1 }} />
              <Button title="Bekor" onPress={() => setSubCompany(null)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchWrapper: { position: "relative", paddingHorizontal: 16, paddingTop: 12 },
  searchInput: { marginBottom: 0 },
  clearBtn: { position: "absolute", right: 28, top: 22, padding: 6, zIndex: 1 },
  clearBtnText: { fontSize: 14, color: Colors.gray[500], fontWeight: "600" },
  filterRow: { flexDirection: "row", gap: 8, padding: 12, paddingBottom: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive: { backgroundColor: SA_COLOR, borderColor: SA_COLOR },
  chipText: { fontSize: 12, color: Colors.gray[600] },
  chipTextActive: { color: Colors.white, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  companyCard: { padding: 14 },
  companyCardTemplate: { borderColor: "#A78BFA40", borderWidth: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: "800" },
  companyName: { fontSize: 15, fontWeight: "700", color: Colors.gray[900] },
  subdomain: { fontSize: 11, color: Colors.gray[400], marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, flexShrink: 0 },
  statusText: { fontSize: 11, fontWeight: "600" },
  suspendHint: { backgroundColor: "#FEF2F2", borderRadius: 8, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: "#FCA5A5" },
  suspendHintText: { fontSize: 12, color: Colors.danger, fontWeight: "500" },
  directorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  directorIcon: { fontSize: 14 },
  directorName: { fontSize: 13, fontWeight: "600", color: Colors.gray[700] },
  directorPhone: { fontSize: 12, color: Colors.gray[500] },
  noDirector: { fontSize: 12, color: Colors.gray[400], fontStyle: "italic", marginBottom: 10 },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.gray[50], borderRadius: 10, padding: 10, marginBottom: 10, gap: 6 },
  statText: { fontSize: 13, fontWeight: "600", color: Colors.gray[700] },
  statSep: { fontSize: 13, color: Colors.gray[400] },
  subRow: { padding: 8, borderRadius: 8, marginBottom: 10, alignItems: "center" },
  subText: { fontSize: 13, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 6 },
  editBtn: { flex: 2, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.gray[300], backgroundColor: Colors.gray[50] },
  editBtnText: { fontSize: 12, fontWeight: "600", color: Colors.gray[700] },
  subBtn: { flex: 2, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: SA_COLOR + "60", backgroundColor: SA_COLOR + "10" },
  subBtnText: { fontSize: 12, fontWeight: "600", color: SA_COLOR },
  impersonateBtn: { flex: 2, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.warning + "70", backgroundColor: Colors.warningLight },
  impersonateBtnText: { fontSize: 12, fontWeight: "600", color: Colors.warning },
  btnLoading: { opacity: 0.7 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  toggleBtnText: { fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray[500] },
  fab: { position: "absolute", right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: SA_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: Colors.white, fontWeight: "300", marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 },
  modalSub: { fontSize: 13, color: Colors.gray[500], marginBottom: 16 },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, backgroundColor: Colors.dangerLight, padding: 10, borderRadius: 8 },
  sectionDivider: { fontSize: 14, fontWeight: "600", color: Colors.gray[600], marginVertical: 8, borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  currentSubRow: { backgroundColor: "#EFF6FF", padding: 10, borderRadius: 8, marginBottom: 12 },
  currentSubText: { fontSize: 13, color: Colors.primary },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: Colors.gray[700], marginBottom: 8 },
  monthsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  monthBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 2, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  monthBtnActive: { borderColor: SA_COLOR, backgroundColor: SA_COLOR + "10" },
  monthText: { fontSize: 13, fontWeight: "600", color: Colors.gray[600] },
  monthTextActive: { color: SA_COLOR },
});
