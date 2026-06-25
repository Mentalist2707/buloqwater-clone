/**
 * Customer — Buyurtma berish
 * Mahsulot tanlash + miqdor + izoh + manzil tasdiqlash
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { customerService } from "@/services/customer";
import type { Product } from "@/types";

const C = {
  primary:   "#00C6A2",
  dark:      "#00A88A",
  light:     "#E6FAF7",
  accent:    "#6C63FF",
  accentLight: "#EFEDFF",
  warn:      "#FF6B6B",
  bg:        "#F0FAF8",
  white:     "#FFFFFF",
  text:      "#1A2E2B",
  sub:       "#6B8F89",
  border:    "#C8E8E3",
};

const CAT_LABELS: Record<string, string> = {
  WATER: "💧 Suv",
  PROMO: "🎁 Promo",
  ACCESSORIES: "🔧 Aksessuar",
};

const CAT_COLORS: Record<string, string> = {
  WATER: C.primary,
  PROMO: "#F59E0B",
  ACCESSORIES: "#6B7280",
};

interface CartItem {
  product: Product;
  quantity: number;
}

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts]   = useState<Product[]>([]);
  const [cart, setCart]           = useState<Record<string, CartItem>>({});
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [catFilter, setCatFilter] = useState<string>("ALL");

  const load = async () => {
    setLoading(true);
    const r = await customerService.getProducts();
    if (r.success && r.data) setProducts(r.data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const addToCart = (p: Product) => {
    setCart((prev) => ({
      ...prev,
      [p.id]: { product: p, quantity: (prev[p.id]?.quantity || 0) + 1 },
    }));
  };

  const removeFromCart = (p: Product) => {
    setCart((prev) => {
      const q = (prev[p.id]?.quantity || 0) - 1;
      if (q <= 0) {
        const next = { ...prev };
        delete next[p.id];
        return next;
      }
      return { ...prev, [p.id]: { product: p, quantity: q } };
    });
  };

  const cartItems = Object.values(cart);
  const totalAmount = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity, 0
  );
  const totalBottles = cartItems.reduce(
    (sum, i) => sum + (i.product.isBottle ? i.quantity : 0), 0
  );

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Diqqat", "Hech bo'lmasa bitta mahsulot tanlang");
      return;
    }
    Alert.alert(
      "✅ Buyurtmani tasdiqlash",
      `Jami: ${totalAmount.toLocaleString()} so'm\n${totalBottles > 0 ? `Idish: ${totalBottles} ta\n` : ""}Davom etasizmi?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Buyurtma berish",
          onPress: async () => {
            setSubmitting(true);
            const items = cartItems.map((i) => ({
              productId: i.product.id,
              quantity: i.quantity,
            }));
            const r = await customerService.placeOrder(items, notes || undefined);
            setSubmitting(false);
            if (r.success) {
              setCart({});
              setNotes("");
              Alert.alert(
                "🎉 Buyurtma qabul qilindi!",
                "Operatorimiz tez orada siz bilan bog'lanadi.",
                [{ text: "OK" }]
              );
            } else {
              Alert.alert("Xato", (r as any).error || "Buyurtma berishda xatolik");
            }
          },
        },
      ]
    );
  };

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = catFilter === "ALL"
    ? products
    : products.filter((p) => p.category === catFilter);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💧 Buyurtma berish</Text>
        {cartItems.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartItems.length} xil</Text>
          </View>
        )}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, catFilter === cat && {
              backgroundColor: cat === "ALL" ? C.primary : (CAT_COLORS[cat] || C.primary),
              borderColor: "transparent",
            }]}
            onPress={() => setCatFilter(cat)}
          >
            <Text style={[styles.catText, catFilter === cat && styles.catTextActive]}>
              {cat === "ALL" ? "🌊 Barchasi" : CAT_LABELS[cat] || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Mahsulotlar yuklanmoqda...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Mahsulot topilmadi</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filtered.map((p) => {
              const qty = cart[p.id]?.quantity || 0;
              const color = CAT_COLORS[p.category] || C.primary;
              return (
                <View key={p.id} style={styles.productCard}>
                  {/* Category badge */}
                  <View style={[styles.prodCatBadge, { backgroundColor: color + "20" }]}>
                    <Text style={[styles.prodCatText, { color }]}>
                      {CAT_LABELS[p.category]?.split(" ")[0] || "📦"}
                    </Text>
                  </View>

                  <Text style={styles.prodName} numberOfLines={2}>{p.name}</Text>

                  {p.description ? (
                    <Text style={styles.prodDesc} numberOfLines={1}>{p.description}</Text>
                  ) : null}

                  <View style={styles.prodBottom}>
                    <View>
                      <Text style={[styles.prodPrice, { color }]}>
                        {p.price.toLocaleString()}
                      </Text>
                      <Text style={styles.prodUnit}>so'm</Text>
                    </View>

                    {/* Counter */}
                    {qty === 0 ? (
                      <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: color }]}
                        onPress={() => addToCart(p)}
                      >
                        <Text style={styles.addBtnText}>+ Qo'shish</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.counter}>
                        <TouchableOpacity
                          style={[styles.counterBtn, { borderColor: color }]}
                          onPress={() => removeFromCart(p)}
                        >
                          <Text style={[styles.counterBtnText, { color }]}>−</Text>
                        </TouchableOpacity>
                        <Text style={[styles.counterQty, { color }]}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.counterBtn, { backgroundColor: color, borderColor: color }]}
                          onPress={() => addToCart(p)}
                        >
                          <Text style={[styles.counterBtnText, { color: C.white }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Notes */}
        {cartItems.length > 0 && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>📝 Qo'shimcha izoh (ixtiyoriy)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Masalan: 3-qavat, 12-xonadon..."
              placeholderTextColor={C.sub}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        <View style={{ height: cartItems.length > 0 ? 140 : 32 }} />
      </ScrollView>

      {/* Order summary + button */}
      {cartItems.length > 0 && (
        <View style={[styles.orderBar, { paddingBottom: insets.bottom + 76 }]}>
          <View style={styles.orderSummary}>
            <View>
              <Text style={styles.orderSummaryLabel}>Jami summa</Text>
              <Text style={styles.orderSummaryAmount}>
                {totalAmount.toLocaleString()} so'm
              </Text>
            </View>
            {totalBottles > 0 && (
              <View style={styles.bottleBadge}>
                <Text style={styles.bottleBadgeText}>🍶 {totalBottles} ta idish</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.orderBtn, submitting && { opacity: 0.7 }]}
            onPress={handleOrder}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.orderBtnText}>✅ Buyurtma berish</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },

  header:       {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle:  { fontSize: 20, fontWeight: "800", color: C.text },
  cartBadge:    {
    backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  cartBadgeText:{ fontSize: 12, fontWeight: "700", color: C.white },

  catRow:       { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  catChip:      {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
  },
  catText:      { fontSize: 13, fontWeight: "600", color: C.sub },
  catTextActive:{ color: C.white },

  scroll:       { paddingHorizontal: 16 },
  loadingBox:   { alignItems: "center", paddingTop: 60, gap: 12 },
  loadingText:  { fontSize: 14, color: C.sub },
  emptyBox:     { alignItems: "center", paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: C.sub },

  productGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  productCard:  {
    width: "47%", backgroundColor: C.white, borderRadius: 18, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  prodCatBadge: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  prodCatText:  { fontSize: 20 },
  prodName:     { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4, lineHeight: 18 },
  prodDesc:     { fontSize: 11, color: C.sub, marginBottom: 8 },
  prodBottom:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" as any },
  prodPrice:    { fontSize: 16, fontWeight: "800" },
  prodUnit:     { fontSize: 10, color: C.sub },

  addBtn:       { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  addBtnText:   { fontSize: 11, fontWeight: "700", color: C.white },

  counter:      { flexDirection: "row", alignItems: "center", gap: 6 },
  counterBtn:   { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  counterBtnText: { fontSize: 16, fontWeight: "700" },
  counterQty:   { fontSize: 16, fontWeight: "800", minWidth: 20, textAlign: "center" },

  notesBox:     { marginTop: 8, marginBottom: 8 },
  notesLabel:   { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 8 },
  notesInput:   {
    backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text,
    textAlignVertical: "top",
  },

  orderBar:     {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.white,
    paddingHorizontal: 20, paddingTop: 16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 12,
  },
  orderSummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  orderSummaryLabel: { fontSize: 12, color: C.sub },
  orderSummaryAmount: { fontSize: 20, fontWeight: "800", color: C.text },
  bottleBadge:  { backgroundColor: C.accentLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  bottleBadgeText: { fontSize: 12, fontWeight: "600", color: "#6C63FF" },
  orderBtn:     {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16,
    alignItems: "center",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  orderBtnText: { fontSize: 16, fontWeight: "800", color: C.white },
});
