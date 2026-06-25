/**
 * Super Admin — Global Mahsulotlar bazasi
 * Barcha kompaniyalarga umumiy bo'lgan mahsulotlar shablonlari
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
import type { ProductCategory, ProductUnit } from "@/types";

const SA_COLOR = "#6366F1";

interface GlobalProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  unit: ProductUnit;
  isBottle: boolean;
  isActive: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  WATER:       "💧 Suv",
  PROMO:       "🎁 Promo",
  ACCESSORIES: "🔧 Aksessuar",
};

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  WATER:       Colors.primary,
  PROMO:       Colors.warning,
  ACCESSORIES: Colors.gray[600],
};

const UNIT_LABELS: Record<ProductUnit, string> = {
  PIECE: "dona",
  LITER: "litr",
};

const CATEGORIES: ProductCategory[] = ["WATER", "PROMO", "ACCESSORIES"];
const UNITS: ProductUnit[] = ["PIECE", "LITER"];

function formatPrice(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

const emptyForm = {
  name: "", description: "", price: "",
  category: "WATER" as ProductCategory,
  unit: "PIECE" as ProductUnit,
  isBottle: false,
};

export default function ProductsScreen() {
  const [products, setProducts]     = useState<GlobalProduct[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState<ProductCategory | "ALL">("ALL");

  // Create / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct]   = useState<GlobalProduct | null>(null);
  const [form, setForm]                 = useState({ ...emptyForm });
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState("");

  const load = async () => {
    const r = await api.get<GlobalProduct[]>("/superadmin/products");
    if (r.success && r.data) setProducts(r.data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openCreate = () => {
    setEditProduct(null);
    setForm({ ...emptyForm });
    setFormError("");
    setModalVisible(true);
  };

  const openEdit = (p: GlobalProduct) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      category: p.category,
      unit: p.unit,
      isBottle: p.isBottle,
    });
    setFormError("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Mahsulot nomi kiritilmadi"); return; }
    if (!form.price || isNaN(Number(form.price))) { setFormError("Narx to'g'ri kiritilmadi"); return; }
    setSaving(true); setFormError("");

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      category: form.category,
      unit: form.unit,
      isBottle: form.isBottle,
    };

    const r = editProduct
      ? await api.put(`/superadmin/products/${editProduct.id}`, body)
      : await api.post("/superadmin/products", body);

    setSaving(false);
    if (r.success) {
      Alert.alert("✅", editProduct ? "Mahsulot yangilandi!" : "Mahsulot yaratildi!");
      setModalVisible(false);
      load();
    } else {
      setFormError((r as any).error || "Xatolik yuz berdi");
    }
  };

  const handleToggleActive = (p: GlobalProduct) => {
    Alert.alert(
      p.isActive ? "Mahsulotni o'chirish" : "Mahsulotni yoqish",
      p.isActive
        ? `"${p.name}" ni passiv holga o'tkazasizmi? Kompaniyalar bu mahsulotni ko'rmaydi.`
        : `"${p.name}" ni faollashtirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: p.isActive ? "O'chirish" : "Yoqish",
          style: p.isActive ? "destructive" : "default",
          onPress: async () => {
            await api.post(`/superadmin/products/${p.id}/toggle`, {});
            load();
          },
        },
      ]
    );
  };

  const handleDelete = (p: GlobalProduct) => {
    Alert.alert(
      "🗑️ O'chirish",
      `"${p.name}" ni butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: async () => {
            const r = await api.delete(`/superadmin/products/${p.id}`);
            if (r.success) {
              load();
            } else {
              Alert.alert("Xato", (r as any).error || "O'chirib bo'lmadi");
            }
          },
        },
      ]
    );
  };

  const filtered = products.filter((p) => {
    if (catFilter !== "ALL" && p.category !== catFilter) return false;
    if (search.trim()) return p.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const renderProduct = ({ item: p }: { item: GlobalProduct }) => {
    const color = CATEGORY_COLORS[p.category];
    return (
      <Card style={[styles.productCard, !p.isActive && styles.productCardInactive]} padding={14}>
        <View style={styles.cardRow}>
          <View style={[styles.catIcon, { backgroundColor: color + "18" }]}>
            <Text style={styles.catIconText}>{CATEGORY_LABELS[p.category].split(" ")[0]}</Text>
          </View>
          <View style={styles.productInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
              {!p.isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>Passiv</Text>
                </View>
              )}
              {p.isBottle && (
                <View style={styles.bottleBadge}>
                  <Text style={styles.bottleText}>🍶 Ballon</Text>
                </View>
              )}
            </View>
            {p.description ? (
              <Text style={styles.productDesc} numberOfLines={1}>{p.description}</Text>
            ) : null}
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{formatPrice(p.price)}</Text>
              <Text style={styles.unitText}>/ {UNIT_LABELS[p.unit]}</Text>
              <View style={[styles.catPill, { backgroundColor: color + "15" }]}>
                <Text style={[styles.catPillText, { color }]}>{CATEGORY_LABELS[p.category]}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(p)}>
            <Text style={styles.actionBtnText}>✏️ Tahrirlash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, {
              backgroundColor: p.isActive ? Colors.warningLight : Colors.successLight,
              borderColor: p.isActive ? Colors.warning + "50" : Colors.success + "50",
            }]}
            onPress={() => handleToggleActive(p)}
          >
            <Text style={[styles.actionBtnText, { color: p.isActive ? Colors.warning : Colors.success }]}>
              {p.isActive ? "⏸️ O'chirish" : "▶️ Yoqish"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.dangerLight, borderColor: Colors.danger + "50" }]}
            onPress={() => handleDelete(p)}
          >
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Mahsulotlar bazasi</Text>
          <Text style={styles.headerSub}>{products.length} ta mahsulot</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="🔍 Mahsulot nomi..."
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

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {([{ key: "ALL" as const, label: `Barchasi (${products.length})` },
          ...CATEGORIES.map((c) => ({
            key: c,
            label: `${CATEGORY_LABELS[c]} (${products.filter((p) => p.category === c).length})`,
          }))
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, catFilter === f.key && styles.chipActive]}
            onPress={() => setCatFilter(f.key as any)}
          >
            <Text style={[styles.chipText, catFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>{loading ? "Yuklanmoqda..." : "Mahsulot topilmadi"}</Text>
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
                {editProduct ? "✏️ Mahsulotni tahrirlash" : "➕ Yangi mahsulot"}
              </Text>

              {formError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <Input label="Nomi *" placeholder="19L Toza Suv" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
              <Input label="Tavsif" placeholder="Ixtiyoriy..." value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
              <Input label="Narx (so'm) *" placeholder="15000" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} keyboardType="numeric" />

              {/* Category */}
              <Text style={styles.fieldLabel}>Kategoriya *</Text>
              <View style={styles.optionRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.optionBtn, form.category === c && styles.optionBtnActive]}
                    onPress={() => setForm({ ...form, category: c })}
                  >
                    <Text style={[styles.optionText, form.category === c && styles.optionTextActive]}>
                      {CATEGORY_LABELS[c]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Unit */}
              <Text style={styles.fieldLabel}>Birlik *</Text>
              <View style={styles.optionRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.optionBtn, form.unit === u && styles.optionBtnActive]}
                    onPress={() => setForm({ ...form, unit: u })}
                  >
                    <Text style={[styles.optionText, form.unit === u && styles.optionTextActive]}>
                      {UNIT_LABELS[u]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* isBottle toggle */}
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setForm({ ...form, isBottle: !form.isBottle })}
              >
                <View style={[styles.checkbox, form.isBottle && styles.checkboxActive]}>
                  {form.isBottle && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>🍶 Bu mahsulot ballon (qaytariladigan idish)</Text>
              </TouchableOpacity>

              <View style={styles.modalBtns}>
                <Button title="Bekor qilish" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <Button title={editProduct ? "Saqlash" : "Yaratish"} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },

  headerBar:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn:       { padding: 4 },
  backIcon:      { fontSize: 30, color: Colors.gray[700], lineHeight: 34 },
  headerTitle:   { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  headerSub:     { fontSize: 12, color: Colors.gray[400], marginTop: 1 },

  searchWrapper: { position: "relative", paddingHorizontal: 16, marginBottom: 4 },
  clearBtn:      { position: "absolute", right: 28, top: 14, padding: 6 },
  clearBtnText:  { fontSize: 14, color: Colors.gray[500], fontWeight: "600" },

  chipRow:       { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive:    { backgroundColor: SA_COLOR, borderColor: SA_COLOR },
  chipText:      { fontSize: 13, color: Colors.gray[600] },
  chipTextActive:{ color: Colors.white, fontWeight: "600" },

  list:          { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  productCard:   { },
  productCardInactive: { opacity: 0.6 },

  cardRow:       { flexDirection: "row", gap: 12, marginBottom: 10 },
  catIcon:       { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  catIconText:   { fontSize: 22 },
  productInfo:   { flex: 1 },
  nameRow:       { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 },
  productName:   { fontSize: 15, fontWeight: "600", color: Colors.gray[900] },
  inactiveBadge: { backgroundColor: Colors.gray[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  inactiveText:  { fontSize: 10, color: Colors.gray[500], fontWeight: "600" },
  bottleBadge:   { backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  bottleText:    { fontSize: 10, color: Colors.primary, fontWeight: "600" },
  productDesc:   { fontSize: 12, color: Colors.gray[500], marginBottom: 6 },
  priceRow:      { flexDirection: "row", alignItems: "center", gap: 6 },
  priceText:     { fontSize: 15, fontWeight: "700", color: SA_COLOR },
  unitText:      { fontSize: 12, color: Colors.gray[400] },
  catPill:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catPillText:   { fontSize: 11, fontWeight: "600" },

  actionRow:     { flexDirection: "row", gap: 6 },
  actionBtn:     { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: Colors.gray[700] },

  empty:         { alignItems: "center", paddingTop: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 16, color: Colors.gray[400] },

  fab:           { position: "absolute", right: 20, bottom: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: SA_COLOR, alignItems: "center", justifyContent: "center", shadowColor: SA_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText:       { fontSize: 28, color: Colors.white, fontWeight: "300", marginTop: -2 },

  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox:      { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 20 },
  modalTitle:    { fontSize: 18, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 },
  errorBox:      { backgroundColor: Colors.dangerLight, padding: 10, borderRadius: 8, marginBottom: 12 },
  errorText:     { fontSize: 13, color: Colors.danger },

  fieldLabel:    { fontSize: 14, fontWeight: "500", color: Colors.gray[700], marginBottom: 8, marginTop: 4 },
  optionRow:     { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  optionBtn:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  optionBtnActive: { borderColor: SA_COLOR, backgroundColor: SA_COLOR + "10" },
  optionText:    { fontSize: 13, color: Colors.gray[600] },
  optionTextActive: { color: SA_COLOR, fontWeight: "600" },

  checkRow:      { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, paddingVertical: 4 },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.gray[300], alignItems: "center", justifyContent: "center" },
  checkboxActive:{ borderColor: SA_COLOR, backgroundColor: SA_COLOR },
  checkmark:     { fontSize: 12, color: Colors.white, fontWeight: "700" },
  checkLabel:    { fontSize: 14, color: Colors.gray[700], flex: 1 },

  modalBtns:     { flexDirection: "row", gap: 12, marginTop: 4 },
});
