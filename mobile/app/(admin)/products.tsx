/**
 * Director — Mahsulotlar
 * Kompaniya mahsulotlarini ko'rish, narx o'zgartirish, faol/passiv qilish
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView,
  ActivityIndicator,
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

function formatPrice(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

export default function DirectorProductsScreen() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catFilter, setCatFilter]   = useState<ProductCategory | "ALL">("ALL");
  const [search, setSearch]         = useState("");

  // Price edit modal
  const [priceModal, setPriceModal]     = useState(false);
  const [selectedProduct, setSelected] = useState<Product | null>(null);
  const [newPrice, setNewPrice]         = useState("");
  const [saving, setSaving]             = useState(false);

  const load = async () => {
    const r = await api.get<Product[]>("/products");
    if (r.success && r.data) setProducts(r.data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

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
      Alert.alert("✅", "Narx yangilandi!");
      setPriceModal(false);
      load();
    } else {
      Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
    }
  };

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
              load();
            } else {
              Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
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

  // Statistika
  const totalActive   = products.filter((p) => p.isActive).length;
  const totalInactive = products.filter((p) => !p.isActive).length;

  const renderProduct = ({ item: p }: { item: Product }) => {
    const color = CATEGORY_COLORS[p.category];
    return (
      <Card style={[styles.card, !p.isActive && styles.cardInactive]} padding={14}>
        <View style={styles.cardRow}>
          {/* Category icon */}
          <View style={[styles.catIcon, { backgroundColor: color + "18" }]}>
            <Text style={styles.catEmoji}>{CATEGORY_LABELS[p.category].split(" ")[0]}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.productName, !p.isActive && styles.textMuted]} numberOfLines={1}>
                {p.name}
              </Text>
              {p.isBottle && (
                <View style={styles.bottlePill}>
                  <Text style={styles.bottleText}>🍶</Text>
                </View>
              )}
              {!p.isActive && (
                <View style={styles.inactivePill}>
                  <Text style={styles.inactiveText}>Yopiq</Text>
                </View>
              )}
            </View>

            {p.description ? (
              <Text style={styles.desc} numberOfLines={1}>{p.description}</Text>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={[styles.price, !p.isActive && styles.textMuted]}>
                {formatPrice(p.price)}
              </Text>
              <Text style={styles.unit}>/ {UNIT_LABELS[p.unit]}</Text>
              <View style={[styles.catPill, { backgroundColor: color + "15" }]}>
                <Text style={[styles.catPillText, { color }]}>{CATEGORY_LABELS[p.category]}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.priceBtn]}
            onPress={() => openPriceEdit(p)}
          >
            <Text style={styles.priceBtnText}>💰 Narxni o'zgartirish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              p.isActive
                ? { backgroundColor: Colors.warningLight, borderColor: Colors.warning + "50" }
                : { backgroundColor: Colors.successLight, borderColor: Colors.success + "50" },
            ]}
            onPress={() => handleToggleActive(p)}
          >
            <Text style={[
              styles.actionBtnText,
              { color: p.isActive ? Colors.warning : Colors.success },
            ]}>
              {p.isActive ? "⏸️" : "▶️"}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats summary */}
      {!loading && products.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderLeftColor: Colors.success }]}>
            <Text style={[styles.statNum, { color: Colors.success }]}>{totalActive}</Text>
            <Text style={styles.statLabel}>Faol</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: Colors.gray[400] }]}>
            <Text style={[styles.statNum, { color: Colors.gray[500] }]}>{totalInactive}</Text>
            <Text style={styles.statLabel}>Yopiq</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: Colors.primary }]}>
            <Text style={[styles.statNum, { color: Colors.primary }]}>{products.length}</Text>
            <Text style={styles.statLabel}>Jami</Text>
          </View>
        </View>
      )}

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

      {/* Category chips */}
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
            <Text style={styles.emptyText}>
              {loading ? "Yuklanmoqda..." : "Mahsulot topilmadi"}
            </Text>
          </View>
        }
      />

      {/* Price Edit Modal */}
      <Modal visible={priceModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />

            <View style={styles.modalProductRow}>
              <View style={[styles.modalIcon, {
                backgroundColor: (CATEGORY_COLORS[selectedProduct?.category ?? "WATER"]) + "18",
              }]}>
                <Text style={styles.modalIconText}>
                  {selectedProduct ? CATEGORY_LABELS[selectedProduct.category].split(" ")[0] : ""}
                </Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
                <Text style={styles.modalSub}>
                  Joriy narx: <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                    {selectedProduct ? formatPrice(selectedProduct.price) : ""}
                  </Text>
                </Text>
              </View>
            </View>

            <Input
              label="Yangi narx (so'm) *"
              placeholder="Masalan: 15000"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
            />

            {/* Quick price buttons */}
            <Text style={styles.quickLabel}>Tez tanlash:</Text>
            <View style={styles.quickRow}>
              {[10000, 12000, 15000, 18000, 20000].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.quickBtn, newPrice === String(p) && styles.quickBtnActive]}
                  onPress={() => setNewPrice(String(p))}
                >
                  <Text style={[styles.quickBtnText, newPrice === String(p) && styles.quickBtnTextActive]}>
                    {(p / 1000)}K
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <Button
                title="Bekor qilish"
                variant="outline"
                onPress={() => setPriceModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Saqlash"
                onPress={handleSavePrice}
                loading={saving}
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

  // Stats
  statsRow:     { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 4 },
  statBox:      {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12,
    padding: 12, borderLeftWidth: 3,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statNum:      { fontSize: 22, fontWeight: "800" },
  statLabel:    { fontSize: 11, color: Colors.gray[500], marginTop: 2 },

  // Search
  searchWrapper:{ position: "relative", paddingHorizontal: 16, marginBottom: 4, marginTop: 8 },
  clearBtn:     { position: "absolute", right: 28, top: 14, padding: 6 },
  clearBtnText: { fontSize: 14, color: Colors.gray[500], fontWeight: "600" },

  // Chips
  chipRow:      { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:     { fontSize: 12, color: Colors.gray[600] },
  chipTextActive: { color: Colors.white, fontWeight: "600" },

  // List
  list:         { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  card:         {},
  cardInactive: { opacity: 0.65 },
  cardRow:      { flexDirection: "row", gap: 12, marginBottom: 10 },
  catIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  catEmoji:     { fontSize: 22 },
  cardInfo:     { flex: 1 },
  nameRow:      { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 },
  productName:  { fontSize: 15, fontWeight: "600", color: Colors.gray[900] },
  textMuted:    { color: Colors.gray[400] },
  bottlePill:   { backgroundColor: Colors.primaryLight, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  bottleText:   { fontSize: 11 },
  inactivePill: { backgroundColor: Colors.gray[100], paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  inactiveText: { fontSize: 10, color: Colors.gray[500], fontWeight: "600" },
  desc:         { fontSize: 12, color: Colors.gray[500], marginBottom: 6 },
  priceRow:     { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  price:        { fontSize: 15, fontWeight: "700", color: Colors.primary },
  unit:         { fontSize: 12, color: Colors.gray[400] },
  catPill:      { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  catPillText:  { fontSize: 10, fontWeight: "600" },

  // Actions
  actionRow:    { flexDirection: "row", gap: 8 },
  actionBtn:    { paddingVertical: 9, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  priceBtn:     { flex: 1, borderColor: Colors.primary + "50", backgroundColor: Colors.primaryLight },
  priceBtnText: { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },
  actionBtnText:{ fontSize: 14, fontWeight: "600" },

  // Empty
  empty:        { alignItems: "center", paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: Colors.gray[400] },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox:     { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 20 },
  modalProductRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  modalIcon:    { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalIconText:{ fontSize: 24 },
  modalTitle:   { fontSize: 17, fontWeight: "700", color: Colors.gray[900] },
  modalSub:     { fontSize: 13, color: Colors.gray[500], marginTop: 2 },

  // Quick price
  quickLabel:   { fontSize: 13, fontWeight: "500", color: Colors.gray[600], marginBottom: 8, marginTop: -4 },
  quickRow:     { flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  quickBtn:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.white },
  quickBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  quickBtnText: { fontSize: 13, color: Colors.gray[600], fontWeight: "600" },
  quickBtnTextActive: { color: Colors.primaryDark },

  modalBtns:    { flexDirection: "row", gap: 12 },
});
