/**
 * Director / Admin — Mahsulotlar sahifasi (2026 redesign)
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button, Input, Header, Screen } from "@/components/ui";
import { api } from "@/services/api";
import type { ProductCategory, ProductUnit } from "@/types";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  unit: ProductUnit;
  isBottle: boolean;
  isActive: boolean;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  WATER: "Suv",
  PROMO: "Promo",
  ACCESSORIES: "Aksessuar",
};

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  WATER: palette.aqua500,
  PROMO: palette.amber500,
  ACCESSORIES: palette.slate500,
};

const UNIT_LABELS: Record<ProductUnit, string> = { PIECE: "dona", LITER: "litr" };
const CATEGORIES: ProductCategory[] = ["WATER", "PROMO", "ACCESSORIES"];

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catFilter, setCatFilter] = useState<ProductCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

  const [priceModal, setPriceModal] = useState(false);
  const [selectedProduct, setSelected] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Yangi mahsulot yaratish
  const [createModal, setCreateModal] = useState(false);
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cPrice, setCPrice] = useState("");
  const [cCategory, setCCategory] = useState<ProductCategory>("WATER");
  const [cUnit, setCUnit] = useState<ProductUnit>("PIECE");
  const [cIsBottle, setCIsBottle] = useState(true);
  const [creating, setCreating] = useState(false);

  const openCreate = () => {
    setCName("");
    setCDesc("");
    setCPrice("");
    setCCategory("WATER");
    setCUnit("PIECE");
    setCIsBottle(true);
    setCreateModal(true);
  };

  const handleCreate = async () => {
    if (!cName.trim()) {
      Alert.alert("Diqqat", "Mahsulot nomini kiriting");
      return;
    }
    const price = Number(cPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Diqqat", "Narxni to'g'ri kiriting");
      return;
    }
    setCreating(true);
    const r = await api.post("/products", {
      name: cName.trim(),
      description: cDesc.trim() || undefined,
      price,
      category: cCategory,
      unit: cUnit,
      isBottle: cIsBottle,
    });
    setCreating(false);
    if (r.success) {
      Alert.alert("Bajarildi!", "Yangi mahsulot qo'shildi");
      setCreateModal(false);
      loadProducts();
    } else {
      Alert.alert("Xato", (r as any).error || "Mahsulot yaratishda xatolik");
    }
  };

  const loadProducts = async () => {
    const r = await api.get<Product[]>("/products");
    if (r.success && r.data) setProducts(r.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleToggleActive = (p: Product) => {
    Alert.alert(
      p.isActive ? "Mahsulotni o'chirish" : "Mahsulotni yoqish",
      p.isActive ? `"${p.name}" ni passiv qilasizmi?` : `"${p.name}" ni faollashtirasizmi?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: p.isActive ? "O'chirish" : "Yoqish",
          style: p.isActive ? "destructive" : "default",
          onPress: async () => {
            const r = await api.post(`/products/${p.id}/toggle`, {});
            if (r.success) loadProducts();
            else Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
          },
        },
      ],
    );
  };

  const openPriceEdit = (p: Product) => {
    setSelected(p);
    setNewPrice(String(p.price));
    setPriceModal(true);
  };

  const handleSavePrice = async () => {
    if (!selectedProduct) return;
    const price = Number(newPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Xato", "Narx to'g'ri kiritilmadi");
      return;
    }
    setSaving(true);
    const r = await api.put(`/products/${selectedProduct.id}`, { price });
    setSaving(false);
    if (r.success) {
      Alert.alert("Bajarildi", "Narx yangilandi!");
      setPriceModal(false);
      loadProducts();
    } else {
      Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
    }
  };

  const filtered = products.filter((p) => {
    if (catFilter !== "ALL" && p.category !== catFilter) return false;
    if (search.trim()) return p.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const totalActive = products.filter((p) => p.isActive).length;
  const totalInactive = products.filter((p) => !p.isActive).length;

  const renderProduct = ({ item: p }: { item: Product }) => {
    const catColor = CATEGORY_COLORS[p.category] || theme.primary;
    return (
      <View style={[styles.productCard, !p.isActive && styles.productCardInactive]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}>
              <Text style={[styles.categoryText, { color: catColor }]}>{CATEGORY_LABELS[p.category] || p.category}</Text>
            </View>
            <Text style={[styles.productName, !p.isActive && styles.textMuted]}>{p.name}</Text>
            {p.description ? (
              <Text style={styles.productDesc} numberOfLines={2}>
                {p.description}
              </Text>
            ) : null}
            {p.isBottle && (
              <View style={styles.bottleTag}>
                <Feather name="droplet" size={11} color={theme.primaryDark} />
                <Text style={styles.bottleText}>Idishli</Text>
              </View>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, !p.isActive && styles.textMuted]}>{p.price.toLocaleString()}</Text>
            <Text style={styles.priceUnit}>so'm/{UNIT_LABELS[p.unit] || "dona"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.statusToggleBtn, { backgroundColor: p.isActive ? theme.successSoft : theme.surfaceAlt }]}
            onPress={() => handleToggleActive(p)}
            activeOpacity={0.7}
          >
            <View style={[styles.statusDot, { backgroundColor: p.isActive ? theme.success : theme.textMuted }]} />
            <Text style={[styles.statusToggleText, { color: p.isActive ? theme.success : theme.textSecondary }]}>
              {p.isActive ? "Faol" : "Noaktiv"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editPriceBtn} onPress={() => openPriceEdit(p)} activeOpacity={0.7}>
            <Feather name="edit-2" size={13} color={theme.primaryDark} />
            <Text style={styles.editPriceBtnText}>Narx</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <Header title="Mahsulotlar" onBack={() => router.back()} />
      <View style={styles.searchBox}>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput placeholder="Mahsulot qidirish..." placeholderTextColor={theme.textMuted} value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      {!loading && products.length > 0 && (
        <View style={styles.statsRow}>
          <StatBox value={String(totalActive)} label="Faol" color={theme.success} />
          <StatBox value={String(totalInactive)} label="Yopiq" color={theme.textSecondary} />
          <StatBox value={String(products.length)} label="Jami" color={theme.primaryDark} />
        </View>
      )}

      <View style={{ marginBottom: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {[{ key: "ALL" as const, label: `Barchasi (${products.length})` }, ...CATEGORIES.map((c) => ({ key: c, label: `${CATEGORY_LABELS[c]} (${products.filter((p) => p.category === c).length})` }))].map((f) => (
            <TouchableOpacity key={f.key} style={[styles.chip, catFilter === f.key && styles.chipActive]} onPress={() => setCatFilter(f.key as any)}>
              <Text style={[styles.chipText, catFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderProduct}
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
                  <Feather name="box" size={34} color={theme.primary} />
                </View>
                <Text style={styles.emptyText}>Mahsulot topilmadi</Text>
              </>
            )}
          </View>
        }
      />

      {/* Yangi mahsulot qo'shish tugmasi */}
      {!loading && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 92 }, shadow.brand]}
          onPress={openCreate}
          activeOpacity={0.9}
        >
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Yangi mahsulot modal */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Yangi mahsulot</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              <Input label="Nomi *" placeholder="Masalan: 19L suv" value={cName} onChangeText={setCName} icon="box" />
              <Input label="Tavsif (ixtiyoriy)" placeholder="Qisqacha ma'lumot" value={cDesc} onChangeText={setCDesc} icon="file-text" />
              <Input label="Narx (so'm) *" placeholder="15000" keyboardType="numeric" value={cPrice} onChangeText={setCPrice} icon="dollar-sign" />

              <Text style={styles.fieldLabel}>Turkum</Text>
              <View style={styles.selectRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.selectChip, cCategory === c && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setCCategory(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.selectChipText, cCategory === c && { color: "#fff" }]}>{CATEGORY_LABELS[c]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>O'lchov birligi</Text>
              <View style={styles.selectRow}>
                {(["PIECE", "LITER"] as ProductUnit[]).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.selectChip, cUnit === u && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setCUnit(u)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.selectChipText, cUnit === u && { color: "#fff" }]}>{UNIT_LABELS[u]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setCIsBottle(!cIsBottle)} activeOpacity={0.7}>
                <View style={[styles.checkbox, cIsBottle && styles.checkboxChecked]}>
                  {cIsBottle && <Feather name="check" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxLabel}>Idishli mahsulot</Text>
                  <Text style={styles.checkboxHint}>Qaytariladigan idish (masalan 19L balon)</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalActionsRow}>
              <Button title="Bekor" variant="outline" style={{ flex: 1 }} onPress={() => setCreateModal(false)} disabled={creating} />
              <Button title="Saqlash" style={{ flex: 1 }} onPress={handleCreate} loading={creating} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={priceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Narxni tahrirlash</Text>
            <Text style={styles.modalSub}>{selectedProduct?.name}</Text>

            <Input label="Yangi narx (so'm)" keyboardType="numeric" value={newPrice} onChangeText={setNewPrice} placeholder="15000" icon="dollar-sign" />

            <Text style={styles.quickLabel}>Tez tanlash</Text>
            <View style={styles.quickPricesRow}>
              {[10000, 12000, 15000, 18000, 20000].map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[styles.quickChip, newPrice === String(price) && styles.quickChipActive]}
                  onPress={() => setNewPrice(String(price))}
                >
                  <Text style={[styles.quickChipText, newPrice === String(price) && styles.quickChipTextActive]}>{price / 1000}K</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <Button title="Bekor" variant="outline" style={{ flex: 1 }} onPress={() => setPriceModal(false)} disabled={saving} />
              <Button title="Saqlash" style={{ flex: 1 }} onPress={handleSavePrice} loading={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.statBox, { borderTopColor: color }]}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
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

  statsRow: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  statBox: { flex: 1, backgroundColor: theme.surface, borderRadius: radius.md, padding: spacing.md, borderTopWidth: 3, borderWidth: 1, borderColor: theme.borderSoft, ...shadow.xs },
  statNum: { fontSize: fontSize.xl, fontWeight: fontWeight.black, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.bold, textTransform: "uppercase" },

  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.base, paddingVertical: 9, borderRadius: radius.md, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.bold },
  chipTextActive: { color: "#fff" },

  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 40 },
  productCard: { padding: spacing.base, borderRadius: radius.xl, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderSoft, ...shadow.sm },
  productCardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  categoryText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  productName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text, marginTop: 2 },
  productDesc: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, lineHeight: 18 },
  textMuted: { color: theme.textMuted, textDecorationLine: "line-through" },
  bottleTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 4 },
  bottleText: { fontSize: fontSize.xs, color: theme.primaryDark, fontWeight: fontWeight.semibold },

  priceContainer: { alignItems: "flex-end", backgroundColor: theme.bg, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: theme.border },
  priceValue: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.primaryDark },
  priceUnit: { fontSize: 10, color: theme.textSecondary, fontWeight: fontWeight.medium, marginTop: 2 },

  divider: { height: 1, backgroundColor: theme.border, marginVertical: spacing.md },
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  statusToggleBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusToggleText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  editPriceBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: theme.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  editPriceBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.primaryDark },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 90 },
  emptyIconBox: { width: 78, height: 78, borderRadius: radius["2xl"], backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.base },
  emptyText: { fontSize: fontSize.md, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], padding: spacing.xl },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text },
  modalSub: { fontSize: fontSize.base, color: theme.textSecondary, marginTop: 4, marginBottom: spacing.lg, fontWeight: fontWeight.semibold },
  quickLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary, marginBottom: spacing.sm },
  quickPricesRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  quickChip: { backgroundColor: theme.surfaceAlt, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1.5, borderColor: theme.border },
  quickChipActive: { borderColor: theme.primary, backgroundColor: theme.primaryTint },
  quickChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.textSecondary },
  quickChipTextActive: { color: theme.primaryDark },
  modalActionsRow: { flexDirection: "row", gap: spacing.md },

  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.text, marginBottom: spacing.sm, marginTop: spacing.xs, paddingLeft: 2 },
  selectRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.base, flexWrap: "wrap" },
  selectChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  selectChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.textSecondary },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.base, marginTop: spacing.xs },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bg,
  },
  checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkboxLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  checkboxHint: { fontSize: fontSize.xs, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },
});
