/**
 * Customer — Buyurtma berish sahifasi
 * Organic Liquid & Claymorphism Style (Premium UI)
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { customerService } from "@/services/customer";
import type { Product } from "@/types";

// ─── Rang Palitrasi ──────────────────────────────────────────
const C = {
  bgGradient: ["#E6FFFA", "#EBF5FF", "#F4FAFF"],
  cardWhite: "#FFFFFF",
  textDark: "#0F172A",
  textSub: "#64748B",
  borderSoft: "rgba(226, 232, 240, 0.8)",

  cyan: "#06B6D4",
  cyanLight: "#E0F7FA",
  blue: "#0284C7",
  blueLight: "#E0F2FE",
  emerald: "#10B981",
  emeraldLight: "#D1FAE5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  slate: "#64748B",
  slateLight: "#F1F5F9",
};

const CAT_LABELS: Record<string, string> = {
  WATER: "Suv",
  PROMO: "Promo",
  ACCESSORIES: "Aksessuarlar",
};

const CAT_COLORS: Record<string, string> = {
  WATER: C.cyan,
  PROMO: C.amber,
  ACCESSORIES: C.slate,
};

// Kategoriya ikonkalari
const CAT_ICONS: Record<string, React.ReactNode> = {
  ALL: <Ionicons name="apps-outline" size={16} color={C.textDark} />,
  WATER: <Ionicons name="water-outline" size={16} color={C.cyan} />,
  PROMO: <Feather name="gift" size={16} color={C.amber} />,
  ACCESSORIES: <Feather name="tool" size={16} color={C.slate} />,
};

interface CartItem {
  product: Product;
  quantity: number;
}

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [catFilter, setCatFilter] = useState<string>("ALL");

  const load = async () => {
    setLoading(true);
    const r = await customerService.getProducts();
    if (r.success && r.data) setProducts(r.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

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
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const totalBottles = cartItems.reduce(
    (sum, i) => sum + (i.product.isBottle ? i.quantity : 0),
    0,
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
            const r = await customerService.placeOrder(
              items,
              notes || undefined,
            );
            setSubmitting(false);
            if (r.success) {
              setCart({});
              setNotes("");
              Alert.alert(
                "🎉 Qabul qilindi!",
                "Operatorimiz tez orada siz bilan bog'lanadi.",
                [{ text: "OK" }],
              );
            } else {
              Alert.alert(
                "Xato",
                (r as any).error || "Buyurtma berishda xatolik",
              );
            }
          },
        },
      ],
    );
  };

  const categories = [
    "ALL",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];
  const filtered =
    catFilter === "ALL"
      ? products
      : products.filter((p) => p.category === catFilter);

  return (
    <LinearGradient colors={C.bgGradient} style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Orqa fon pufakchalari */}
      <View style={styles.fluidBubble1} />

      {/* ── Header ──────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Buyurtma berish</Text>
          <Text style={styles.headerSubtitle}>
            Kerakli mahsulotlarni tanlang
          </Text>
        </View>
        {cartItems.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartItems.length} xil</Text>
          </View>
        )}
      </View>

      {/* ── Kategoriya filtri (Silliq Gorizontal chiplar) ───── */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}>
          {categories.map((cat) => {
            const isActive = catFilter === cat;
            const activeColor =
              cat === "ALL" ? C.cyan : CAT_COLORS[cat] || C.cyan;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  isActive && {
                    backgroundColor: activeColor,
                    borderColor: "transparent",
                  },
                ]}
                onPress={() => setCatFilter(cat)}
                activeOpacity={0.7}>
                {/* Ikonkani faol rangga qarab moslash */}
                {React.cloneElement(CAT_ICONS[cat] || CAT_ICONS.ALL, {
                  color: isActive ? "#FFF" : CAT_COLORS[cat] || C.textDark,
                })}
                <Text
                  style={[styles.catText, isActive && styles.catTextActive]}>
                  {cat === "ALL" ? "Barchasi" : CAT_LABELS[cat] || cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Mahsulotlar ro'yxati ───────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.cyan} />
            <Text style={styles.loadingText}>Mahsulotlar yuklanmoqda...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="box" size={48} color={C.textSub} />
            <Text style={styles.emptyText}>Mahsulot topilmadi</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filtered.map((p) => {
              const qty = cart[p.id]?.quantity || 0;
              const themeColor = CAT_COLORS[p.category] || C.cyan;
              const hasQty = qty > 0;

              return (
                <View
                  key={p.id}
                  style={[
                    styles.productCard,
                    hasQty && { borderColor: themeColor },
                  ]}>
                  {/* Kategoriya kichik nishoni */}
                  <View
                    style={[
                      styles.prodCatBadge,
                      { backgroundColor: themeColor + "15" },
                    ]}>
                    {React.cloneElement(
                      CAT_ICONS[p.category] || CAT_ICONS.ALL,
                      {
                        color: themeColor,
                        size: 16,
                      },
                    )}
                  </View>

                  <Text style={styles.prodName} numberOfLines={2}>
                    {p.name}
                  </Text>

                  {p.description ? (
                    <Text style={styles.prodDesc} numberOfLines={1}>
                      {p.description}
                    </Text>
                  ) : (
                    <View style={{ height: 16 }} />
                  )}

                  <View style={styles.prodBottom}>
                    <View>
                      <Text style={[styles.prodPrice, { color: themeColor }]}>
                        {p.price.toLocaleString()}
                      </Text>
                      <Text style={styles.prodUnit}>so'm</Text>
                    </View>

                    {/* Qo'shish / Hisoblagich (Counter) */}
                    {qty === 0 ? (
                      <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: themeColor }]}
                        onPress={() => addToCart(p)}
                        activeOpacity={0.8}>
                        <Text style={styles.addBtnText}>+ Qo'shish</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.counter}>
                        <TouchableOpacity
                          style={[
                            styles.counterBtn,
                            { borderColor: themeColor },
                          ]}
                          onPress={() => removeFromCart(p)}>
                          <Text
                            style={[
                              styles.counterBtnText,
                              { color: themeColor },
                            ]}>
                            −
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={[styles.counterQty, { color: C.textDark }]}>
                          {qty}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.counterBtn,
                            {
                              backgroundColor: themeColor,
                              borderColor: themeColor,
                            },
                          ]}
                          onPress={() => addToCart(p)}>
                          <Text
                            style={[styles.counterBtnText, { color: "#FFF" }]}>
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Izoh yozish qismi (Silliq Clay Input) ───────────── */}
        {cartItems.length > 0 && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Qo'shimcha izoh (ixtiyoriy)</Text>
            <View style={styles.notesInputWrapper}>
              <TextInput
                style={styles.notesInput}
                placeholder="Masalan: 3-qavat, domofon 12K..."
                placeholderTextColor={C.textSub}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        )}

        {/* Bo'sh joy xavfsizlik uchun */}
        <View style={{ height: cartItems.length > 0 ? 180 : 40 }} />
      </ScrollView>

      {/* ── Pastki Buyurtma paneli (Premium Suyuq Banner) ────── */}
      {cartItems.length > 0 && (
        <View style={[styles.orderBar, { paddingBottom: insets.bottom + 84 }]}>
          <View style={styles.orderSummary}>
            <View>
              <Text style={styles.orderSummaryLabel}>Jami summa</Text>
              <Text style={styles.orderSummaryAmount}>
                {totalAmount.toLocaleString()}{" "}
                <Text style={{ fontSize: 14, fontWeight: "600" }}>so'm</Text>
              </Text>
            </View>

            {totalBottles > 0 && (
              <View style={styles.bottleBadge}>
                <MaterialCommunityIcons
                  name="bottle-wine"
                  size={14}
                  color={C.blue}
                />
                <Text style={styles.bottleBadgeText}>
                  {totalBottles} ta idish
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.orderBtnTouch}
            onPress={handleOrder}
            disabled={submitting}
            activeOpacity={0.85}>
            <LinearGradient
              colors={["#06B6D4", "#0284C7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orderBtnGradient}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#FFF"
                  />
                  <Text style={styles.orderBtnText}>Buyurtmani tasdiqlash</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fluidBubble1: {
    position: "absolute",
    top: -30,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(6, 182, 212, 0.04)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerLeft: { gap: 2 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, color: C.textSub, fontWeight: "500" },
  cartBadge: {
    backgroundColor: C.cyan,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  cartBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFF" },

  // Chiplar satri
  filterWrapper: { marginBottom: 16 },
  catRow: { paddingHorizontal: 24, gap: 10 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: C.cardWhite,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  catText: { fontSize: 13, fontWeight: "700", color: C.textDark },
  catTextActive: { color: "#FFF" },

  // Ro'yxat
  scroll: { paddingHorizontal: 24 },
  loadingBox: { alignItems: "center", paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 14, color: C.textSub, fontWeight: "500" },
  emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, color: C.textSub, fontWeight: "600" },

  // Mahsulot Grid paneli
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  productCard: {
    width: "47%",
    backgroundColor: C.cardWhite,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  prodCatBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  prodName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 4,
    lineHeight: 18,
  },
  prodDesc: {
    fontSize: 11,
    color: C.textSub,
    marginBottom: 12,
    fontWeight: "500",
  },
  prodBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  prodPrice: { fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  prodUnit: { fontSize: 10, color: C.textSub, fontWeight: "600" },

  // Tugmalar va Counter
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { fontSize: 11, fontWeight: "700", color: "#FFF" },

  counter: { flexDirection: "row", alignItems: "center", gap: 8 },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cardWhite,
  },
  counterBtnText: { fontSize: 14, fontWeight: "700" },
  counterQty: {
    fontSize: 15,
    fontWeight: "800",
    minWidth: 18,
    textAlign: "center",
  },

  // Izoh formasi
  notesBox: { marginTop: 20 },
  notesLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 8,
    paddingLeft: 4,
  },
  notesInputWrapper: {
    backgroundColor: C.cardWhite,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    overflow: "hidden",
  },
  notesInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.textDark,
    height: 60,
    textAlignVertical: "top",
  },

  // Pastki suzuvchi xarid oynasi
  orderBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderSummaryLabel: { fontSize: 12, color: C.textSub, fontWeight: "600" },
  orderSummaryAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.5,
  },
  bottleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bottleBadgeText: { fontSize: 12, fontWeight: "700", color: C.blue },

  orderBtnTouch: { borderRadius: 20, overflow: "hidden" },
  orderBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  orderBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
