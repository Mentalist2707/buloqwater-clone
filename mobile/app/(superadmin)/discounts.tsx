/**
 * Super Admin — Chegirmalar boshqaruvi
 * Global promo kodlar va chegirma kampaniyalari
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Card, Input, Button } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";

const SA_COLOR = "#6366F1";

type DiscountType   = "PERCENT" | "FIXED";
type DiscountTarget = "ALL" | "NEW_CUSTOMER" | "SPECIFIC_PRODUCT";
type DiscountStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

interface Discount {
  id: string;
  code: string;
  name: string;
  type: DiscountType;
  value: number;         // percent yoki fixed so'm
  target: DiscountTarget;
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  status: DiscountStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<DiscountType, string> = {
  PERCENT: "Foizli (%)",
  FIXED:   "Miqdorli (so'm)",
};

const TARGET_LABELS: Record<DiscountTarget, string> = {
  ALL:              "Barcha mijozlar",
  NEW_CUSTOMER:     "Yangi mijozlar",
  SPECIFIC_PRODUCT: "Aniq mahsulot",
};

const STATUS_CONFIG: Record<DiscountStatus, { color: string; bg: string; label: string; icon: string }> = {
  ACTIVE:   { color: Colors.success, bg: Colors.successLight, label: "Faol",    icon: "✅" },
  INACTIVE: { color: Colors.gray[500], bg: Colors.gray[100],  label: "Faolmas", icon: "⏸️" },
  EXPIRED:  { color: Colors.danger,  bg: Colors.dangerLight,  label: "Muddati o'tgan", icon: "❌" },
};

const DISCOUNT_TYPES: DiscountType[]   = ["PERCENT", "FIXED"];
const DISCOUNT_TARGETS: DiscountTarget[] = ["ALL", "NEW_CUSTOMER", "SPECIFIC_PRODUCT"];

function formatValue(d: Discount) {
  return d.type === "PERCENT" ? `${d.value}%` : `${d.value.toLocaleString("uz-UZ")} so'm`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const emptyForm = {
  code: "", name: "", type: "PERCENT" as DiscountType,
  value: "", target: "ALL" as DiscountTarget,
  minOrder: "", maxUses: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
};

export default function DiscountsScreen() {
  const [discounts, setDiscounts]   = useState<Discount[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DiscountStatus | "ALL">("ALL");

  const [modalVisible, setModalVisible] = useState(false);
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const [form, setForm]                 = useState({ ...emptyForm });
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState("");

  const load = async () => {
    const r = await api.get<Discount[]>("/superadmin/discounts");
    if (r.success && r.data) setDiscounts(r.data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openCreate = () => {
    setEditDiscount(null);
    setForm({ ...emptyForm });
    setFormError("");
    setModalVisible(true);
  };

  const openEdit = (d: Discount) => {
    setEditDiscount(d);
    setForm({
      code: d.code,
      name: d.name,
      type: d.type,
      value: String(d.value),
      target: d.target,
      minOrder: d.minOrder !== null ? String(d.minOrder) : "",
      maxUses: d.maxUses !== null ? String(d.maxUses) : "",
      startDate: d.startDate.split("T")[0],
      endDate: d.endDate ? d.endDate.split("T")[0] : "",
    });
    setFormError("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.code.trim())  { setFormError("Promo-kod kiritilmadi"); return; }
    if (!form.name.trim())  { setFormError("Chegirma nomi kiritilmadi"); return; }
    if (!form.value || isNaN(Number(form.value))) { setFormError("Miqdor to'g'ri kiritilmadi"); return; }
    if (!form.startDate)    { setFormError("Boshlanish sanasi kiritilmadi"); return; }

    setSaving(true); setFormError("");
    const body = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      type: form.type,
      value: Number(form.value),
      target: form.target,
      minOrder: form.minOrder ? Number(form.minOrder) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      startDate: form.startDate,
      endDate: form.endDate || null,
    };

    const r = editDiscount
      ? await api.put(`/superadmin/discounts/${editDiscount.id}`, body)
      : await api.post("/superadmin/discounts", body);

    setSaving(false);
    if (r.success) {
      Alert.alert("✅", editDiscount ? "Chegirma yangilandi!" : "Chegirma yaratildi!");
      setModalVisible(false);
      load();
    } else {
      setFormError((r as any).error || "Xatolik yuz berdi");
    }
  };

  const handleToggleStatus = (d: Discount) => {
    if (d.status === "EXPIRED") {
      Alert.alert("Eslatma", "Muddati o'tgan chegirmani faollashtirish uchun sanani yangilang.");
      return;
    }
    const toActive = d.status !== "ACTIVE";
    Alert.alert(
      toActive ? "▶️ Faollashtirish" : "⏸️ To'xtatish",
      `"${d.name}" chegirmasini ${toActive ? "faollashtirasizmi" : "to'xtatmoqchimisiz"}?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: toActive ? "Faollashtirish" : "To'xtatish",
          onPress: async () => {
            await api.post(`/superadmin/discounts/${d.id}/toggle`, {});
            load();
          },
        },
      ]
    );
  };

  const handleDelete = (d: Discount) => {
    Alert.alert("🗑️ O'chirish", `"${d.name}" ni o'chirmoqchimisiz?`, [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "O'chirish",
        style: "destructive",
        onPress: async () => {
          const r = await api.delete(`/superadmin/discounts/${d.id}`);
          if (r.success) {
            load();
          } else {
            Alert.alert("Xato", (r as any).error || "O'chirib bo'lmadi");
          }
        },
      },
    ]);
  };

  const filtered = statusFilter === "ALL"
    ? discounts
    : discounts.filter((d) => d.status === statusFilter);

  const renderDiscount = ({ item: d }: { item: Discount }) => {
    const cfg = STATUS_CONFIG[d.status];
    return (
      <Card style={styles.discountCard} padding={14}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{d.code}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.discountName} numberOfLines={1}>{d.name}</Text>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>{formatValue(d)}</Text>
              <Text style={styles.targetText}>· {TARGET_LABELS[d.target]}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
          </View>
        </View>

        {/* Meta info */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Foydalanilgan</Text>
            <Text style={styles.metaValue}>
              {d.usedCount}{d.maxUses ? `/${d.maxUses}` : ""} marta
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Boshlanish</Text>
            <Text style={styles.metaValue}>{formatDate(d.startDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tugash</Text>
            <Text style={[styles.metaValue, !d.endDate && { color: Colors.gray[400] }]}>
              {d.endDate ? formatDate(d.endDate) : "Cheksiz"}
            </Text>
          </View>
          {d.minOrder !== null && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Min. buyurtma</Text>
              <Text style={styles.metaValue}>{d.minOrder.toLocaleString()} so'm</Text>
            </View>
          )}
        </View>

        {/* Usage progress if maxUses set */}
        {d.maxUses !== null && d.maxUses > 0 && (
          <View style={styles.progressBox}>
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                {
                  width: `${Math.min((d.usedCount / d.maxUses) * 100, 100)}%`,
                  backgroundColor: d.usedCount >= d.maxUses ? Colors.danger : SA_COLOR,
                },
              ]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round((d.usedCount / d.maxUses) * 100)}% ishlatildi
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(d)}>
            <Text style={styles.actionBtnText}>✏️ Tahrirlash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, {
              backgroundColor: d.status === "ACTIVE" ? Colors.warningLight : Colors.successLight,
              borderColor: d.status === "ACTIVE" ? Colors.warning + "50" : Colors.success + "50",
            }]}
            onPress={() => handleToggleStatus(d)}
          >
            <Text style={[styles.actionBtnText, {
              color: d.status === "ACTIVE" ? Colors.warning : Colors.success,
            }]}>
              {d.status === "ACTIVE" ? "⏸️ To'xtatish" : "▶️ Faollashtirish"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.dangerLight, borderColor: Colors.danger + "50", flex: 0, paddingHorizontal: 14 }]}
            onPress={() => handleDelete(d)}
          >
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const counts = {
    ALL:      discounts.length,
    ACTIVE:   discounts.filter((d) => d.status === "ACTIVE").length,
    INACTIVE: discounts.filter((d) => d.status === "INACTIVE").length,
    EXPIRED:  discounts.filter((d) => d.status === "EXPIRED").length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Chegirmalar</Text>
          <Text style={styles.headerSub}>{discounts.length} ta chegirma</Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {(["ALL", "ACTIVE", "INACTIVE", "EXPIRED"] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, statusFilter === key && styles.chipActive]}
            onPress={() => setStatusFilter(key)}
          >
            <Text style={[styles.chipText, statusFilter === key && styles.chipTextActive]}>
              {key === "ALL" ? `Barchasi (${counts.ALL})`
                : key === "ACTIVE"   ? `✅ Faol (${counts.ACTIVE})`
                : key === "INACTIVE" ? `⏸️ To'xtatilgan (${counts.INACTIVE})`
                : `❌ Muddati o'tgan (${counts.EXPIRED})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        renderItem={renderDiscount}
        keyExtractor={(d) => d.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyText}>{loading ? "Yuklanmoqda..." : "Chegirma topilmadi"}</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {editDiscount ? "✏️ Chegirmani tahrirlash" : "➕ Yangi chegirma"}
              </Text>

              {formError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <Input label="Promo-kod *" placeholder="SUMMER20" value={form.code}
                onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })}
                autoCapitalize="characters"
              />
              <Input label="Chegirma nomi *" placeholder="Yozgi aksiya" value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
              />

              {/* Type selector */}
              <Text style={styles.fieldLabel}>Chegirma turi *</Text>
              <View style={styles.optionRow}>
                {DISCOUNT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.optionBtn, form.type === t && styles.optionBtnActive]}
                    onPress={() => setForm({ ...form, type: t })}
                  >
                    <Text style={[styles.optionText, form.type === t && styles.optionTextActive]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label={form.type === "PERCENT" ? "Foiz (%) *" : "Miqdor (so'm) *"}
                placeholder={form.type === "PERCENT" ? "20" : "10000"}
                value={form.value}
                onChangeText={(v) => setForm({ ...form, value: v })}
                keyboardType="numeric"
              />

              {/* Target */}
              <Text style={styles.fieldLabel}>Kimga mo'ljallangan *</Text>
              <View style={styles.optionRow}>
                {DISCOUNT_TARGETS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.optionBtn, form.target === t && styles.optionBtnActive]}
                    onPress={() => setForm({ ...form, target: t })}
                  >
                    <Text style={[styles.optionText, form.target === t && styles.optionTextActive]}>
                      {TARGET_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Min. buyurtma summasi (so'm)" placeholder="Ixtiyoriy" value={form.minOrder}
                onChangeText={(v) => setForm({ ...form, minOrder: v })} keyboardType="numeric"
              />
              <Input label="Maksimal foydalanish soni" placeholder="Cheksiz bo'lsa bo'sh qoldiring" value={form.maxUses}
                onChangeText={(v) => setForm({ ...form, maxUses: v })} keyboardType="numeric"
              />
              <Input label="Boshlanish sanasi *" placeholder="2024-01-01" value={form.startDate}
                onChangeText={(v) => setForm({ ...form, startDate: v })}
              />
              <Input label="Tugash sanasi" placeholder="Bo'sh = cheksiz" value={form.endDate}
                onChangeText={(v) => setForm({ ...form, endDate: v })}
              />

              <View style={styles.modalBtns}>
                <Button title="Bekor qilish" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <Button title={editDiscount ? "Saqlash" : "Yaratish"} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },

  headerBar:    { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn:      { padding: 4 },
  backIcon:     { fontSize: 30, color: Colors.gray[700], lineHeight: 34 },
  headerTitle:  { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  headerSub:    { fontSize: 12, color: Colors.gray[400], marginTop: 1 },

  chipRow:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive:   { backgroundColor: SA_COLOR, borderColor: SA_COLOR },
  chipText:     { fontSize: 12, color: Colors.gray[600] },
  chipTextActive: { color: Colors.white, fontWeight: "600" },

  list:         { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  discountCard: { },

  cardHeader:   { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  codeBox:      { backgroundColor: SA_COLOR + "18", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  codeText:     { fontSize: 14, fontWeight: "800", color: SA_COLOR, letterSpacing: 1 },
  discountName: { fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginBottom: 3 },
  valueRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  valueText:    { fontSize: 16, fontWeight: "800", color: SA_COLOR },
  targetText:   { fontSize: 12, color: Colors.gray[500] },
  statusPill:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText:   { fontSize: 11, fontWeight: "600" },

  metaGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  metaItem:     { flex: 1, minWidth: "40%", backgroundColor: Colors.gray[50], borderRadius: 10, padding: 10 },
  metaLabel:    { fontSize: 10, color: Colors.gray[400], marginBottom: 2 },
  metaValue:    { fontSize: 13, fontWeight: "600", color: Colors.gray[800] },

  progressBox:  { marginBottom: 10 },
  progressTrack: { height: 6, backgroundColor: Colors.gray[100], borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill:  { height: 6, borderRadius: 3 },
  progressText:  { fontSize: 11, color: Colors.gray[400], textAlign: "right" },

  actionRow:    { flexDirection: "row", gap: 6 },
  actionBtn:    { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  actionBtnText:{ fontSize: 12, fontWeight: "600", color: Colors.gray[700] },

  empty:        { alignItems: "center", paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: Colors.gray[400] },

  fab:          { position: "absolute", right: 20, bottom: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: SA_COLOR, alignItems: "center", justifyContent: "center", shadowColor: SA_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText:      { fontSize: 28, color: Colors.white, fontWeight: "300", marginTop: -2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox:     { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 },
  errorBox:     { backgroundColor: Colors.dangerLight, padding: 10, borderRadius: 8, marginBottom: 12 },
  errorText:    { fontSize: 13, color: Colors.danger },

  fieldLabel:   { fontSize: 14, fontWeight: "500", color: Colors.gray[700], marginBottom: 8, marginTop: 4 },
  optionRow:    { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  optionBtn:    { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  optionBtnActive: { borderColor: SA_COLOR, backgroundColor: SA_COLOR + "10" },
  optionText:   { fontSize: 13, color: Colors.gray[600] },
  optionTextActive: { color: SA_COLOR, fontWeight: "600" },

  modalBtns:    { flexDirection: "row", gap: 12, marginTop: 8 },
});
