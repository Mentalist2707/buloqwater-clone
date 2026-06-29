/**
 * Director / Admin — Mahsulotlar sahifasi (Premium iOS Style)
 * Kompaniya mahsulotlarini ko'rish, narx o'zgartirish, faol/passiv qilish
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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Input, Button } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";
import type { ProductCategory, ProductUnit } from "@/types";

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
  WATER:       "💧 Suv",
  PROMO:       "🎁 Promo",
  ACCESSORIES: "🔧 Aksessuar",
};

const CATEGORY_STYLES: Record<ProductCategory, { bg: string; text: string }> = {
  WATER:       { bg: "rgba(2, 132, 199, 0.08)", text: "#0284C7" }, 
  PROMO:       { bg: "rgba(217, 119, 6, 0.08)",  text: "#D97706" }, 
  ACCESSORIES: { bg: "rgba(100, 116, 139, 0.08)", text: "#64748B" }, 
};

const UNIT_LABELS: Record<ProductUnit, string> = {
  PIECE: "dona",
  LITER: "litr",
};

const CATEGORIES: ProductCategory[] = ["WATER", "PROMO", "ACCESSORIES"];

function formatPrice(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catFilter, setCatFilter] = useState<ProductCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");

  // Narx tahrirlash modali uchun statelar
  const [priceModal, setPriceModal] = useState(false);
  const [selectedProduct, setSelected] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    const r = await api.get<Product[]>("/products");
    if (r.success && r.data) {
      setProducts(r.data);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Mahsulotni yoqish / o'chirish (Statusini o'zgartirish)
  const handleToggleActive = (p: Product) => {
    Alert.alert(
      p.isActive ? "⏸️ Mahsulotni o'chirish" : "▶️ Mahsulotni yoqish",
      p.isActive
        ? `"${p.name}" ni passiv qilasizmi? Operatorlar yangi buyurtmada bu mahsulotni ko'rmaydi.`
        : `"${p.name}" ni faollashtirasizmi?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: p.isActive ? "O'chirish" : "Yoqish",
          style: p.isActive ? "destructive" : "default",
          onPress: async () => {
            const r = await api.post(`/products/${p.id}/toggle`, {});
            if (r.success) {
              loadProducts();
            } else {
              Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
            }
          },
        },
      ]
    );
  };

  // Narx o'zgartirish oynasini ochish
  const openPriceEdit = (p: Product) => {
    setSelected(p);
    setNewPrice(String(p.price));
    setPriceModal(true);
  };

  // Yangi narxni saqlash
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
      Alert.alert("✅", "Narx yangilandi!");
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

  const totalActive   = products.filter((p) => p.isActive).length;
  const totalInactive = products.filter((p) => !p.isActive).length;

  const renderProduct = ({ item: p }: { item: Product }) => {
    const styleConfig = CATEGORY_STYLES[p.category] || CATEGORY_STYLES.WATER;

    return (
      <Card style={[styles.productCard, !p.isActive && styles.productCardInactive]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            {/* Kategoriya Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: styleConfig.bg }]}>
              <Text style={[styles.categoryText, { color: styleConfig.text }]}>
                {CATEGORY_LABELS[p.category] || p.category}
              </Text>
            </View>
            <Text style={[styles.productName, !p.isActive && styles.textMuted]}>
              {p.name}
            </Text>
            {p.description ? (
              <Text style={styles.productDesc} numberOfLines={2}>
                {p.description}
              </Text>
            ) : null}
          </View>

          {/* Narx qismi */}
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, !p.isActive && styles.textMuted]}>
              {p.price.toLocaleString()}
            </Text>
            <Text style={styles.priceUnit}>so'm / {UNIT_LABELS[p.unit] || "dona"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Boshqaruv tugmalari */}
        <View style={styles.cardActions}>
          {/* Faollik holati (Status Toggle) */}
          <TouchableOpacity
            style={[styles.statusToggleBtn, p.isActive ? styles.statusActiveBg : styles.statusInactiveBg]}
            onPress={() => handleToggleActive(p)}
            activeOpacity={0.7}
          >
            <View style={[styles.statusDot, { backgroundColor: p.isActive ? "#16A34A" : "#64748B" }]} />
            <Text style={[styles.statusToggleText, { color: p.isActive ? "#15803D" : "#475569" }]}>
              {p.isActive ? "Faol" : "Noaktiv"}
            </Text>
          </TouchableOpacity>

          {/* Narxni tahrirlash */}
          <TouchableOpacity
            style={styles.editPriceBtn}
            onPress={() => openPriceEdit(p)}
            activeOpacity={0.7}
          >
            <Text style={styles.editPriceBtnText}>💰 Narxni o'zgartirish</Text>
          </TouchableOpacity>
        </View>

        {/* Idish turi haqida yorliq */}
        {p.isBottle && (
          <View style={styles.bottleLabel}>
            <Text style={styles.bottleText}>🍶 Idish</Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Statistika summary paneli */}
      {!loading && products.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderLeftColor: "#16A34A" }]}>
            <Text style={[styles.statNum, { color: "#16A34A" }]}>{totalActive}</Text>
            <Text style={styles.statLabel}>Faol</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: "#94A3B8" }]}>
            <Text style={[styles.statNum, { color: "#64748B" }]}>{totalInactive}</Text>
            <Text style={styles.statLabel}>Yopiq</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: Colors.primary }]}>
            <Text style={[styles.statNum, { color: Colors.primary }]}>{products.length}</Text>
            <Text style={styles.statLabel}>Jami</Text>
          </View>
        </View>
      )}

      {/* Qidiruv inputi */}
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

      {/* Kategoriya filterlari */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {([
            { key: "ALL" as const, label: `Barchasi (${products.length})` },
            ...CATEGORIES.map((c) => ({
              key: c,
              label: `${CATEGORY_LABELS[c]} (${products.filter((p) => p.category === c).length})`,
            })),
          ]).map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, catFilter === f.key && styles.chipActive]}
              onPress={() => setCatFilter(f.key as any)}
            >
              <Text style={[styles.chipText, catFilter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.centerBox}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>Mahsulot topilmadi</Text>
              </>
            )}
          </View>
        }
      />

      {/* Narxni tahrirlash Modali (iOS Bottom Sheet Style) */}
      <Modal visible={priceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Narxni tahrirlash</Text>
            <Text style={styles.modalSub}>{selectedProduct?.name}</Text>

            <Text style={styles.inputLabel}>Yangi narx (so'mda):</Text>
            <Input
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder="Masalan: 15000"
              style={styles.priceInput}
            />

            {/* Tezkor narx tanlash tugmalari */}
            <Text style={styles.quickLabel}>Tez tanlash:</Text>
            <View style={styles.quickPricesRow}>
              {[10000, 12000, 15000, 18000, 20000].map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[styles.quickPriceChip, newPrice === String(price) && styles.quickPriceChipActive]}
                  onPress={() => setNewPrice(String(price))}
                >
                  <Text style={[styles.quickPriceChipText, newPrice === String(price) && styles.quickPriceChipTextActive]}>
                    {(price / 1000)}K
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal tugmalari */}
            <View style={styles.modalActionsRow}>
              <Button
                title="Bekor qilish"
                variant="outline"
                style={styles.modalBtn}
                onPress={() => setPriceModal(false)}
                disabled={saving}
              />
              <Button
                title={saving ? "Saqlanmoqda..." : "Saqlash"}
                style={styles.modalBtn}
                onPress={handleSavePrice}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingTop:40, paddingBottom:80 },
  listContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },

  // Stats summary
  statsRow: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 4 },
  statBox: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12,
    padding: 12, borderLeftWidth: 3,
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },

  // Search input
  searchWrapper: { position: "relative", paddingHorizontal: 16, marginBottom: 4, marginTop: 8 },
  clearBtn: { position: "absolute", right: 28, top: 14, padding: 6 },
  clearBtnText: { fontSize: 14, color: "#64748B", fontWeight: "600" },

  // Filter chiplari
  chipRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: "#64748B" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },

  // Mahsulot kartasi
  productCard: {
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
    overflow: "hidden",
  },
  productCardInactive: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    opacity: 0.75,
  },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 2,
  },
  categoryText: { fontSize: 11, fontWeight: "700" },
  
  productName: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  productDesc: { fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 18 },
  textMuted: { color: "#94A3B8", textDecorationLine: "line-through" },

  // Narx bloki
  priceContainer: { alignItems: "flex-end", backgroundColor: "#F8FAFC", padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "#F1F5F9" },
  priceValue: { fontSize: 17, fontWeight: "800", color: "#0284C7" },
  priceUnit: { fontSize: 11, color: "#64748B", fontWeight: "500", marginTop: 2 },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 },

  // Boshqaruv tugmalari
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  
  statusToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActiveBg: { backgroundColor: "rgba(22, 163, 74, 0.06)", borderColor: "rgba(22, 163, 74, 0.2)" },
  statusInactiveBg: { backgroundColor: "#E2E8F0", borderColor: "#CBD5E1" },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusToggleText: { fontSize: 12, fontWeight: "600" },

  editPriceBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  editPriceBtnText: { fontSize: 12, fontWeight: "600", color: "#1E293B" },

  // Shisha/Idish belgisi
  bottleLabel: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  bottleText: { fontSize: 9, fontWeight: "600", color: "#1E40AF" },

  // Bo'sh holat
  centerBox: { alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyIcon: { fontSize: 54, marginBottom: 14 },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "500" },

  // Modal (iOS Bottom Sheet)
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalIndicator: { width: 36, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  modalTitle: { fontSize: 19, fontWeight: "800", color: "#0F172A" },
  modalSub: { fontSize: 14, color: "#64748B", marginTop: 4, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  priceInput: { borderRadius: 12, height: 48, borderColor: "#CBD5E1", backgroundColor: "#F8FAFC", fontSize: 16 },

  // Tezkor narx chiplari
  quickLabel: { fontSize: 13, fontWeight: "500", color: "#64748B", marginBottom: 8, marginTop: 14 },
  quickPricesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 24 },
  quickPriceChip: { backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  quickPriceChipActive: { borderColor: Colors.primary, backgroundColor: "rgba(2, 132, 199, 0.08)" },
  quickPriceChipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  quickPriceChipTextActive: { color: Colors.primary },

  modalActionsRow: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, borderRadius: 12, height: 46 },
});