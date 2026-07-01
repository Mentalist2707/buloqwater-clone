/**
 * Customer — Buyurtma berish sahifasi (2026 redesign)
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { customerService } from "@/services/customer";
import type { Product } from "@/types";
import { Screen } from "@/components/ui";
import {
  theme,
  palette,
  gradients,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";

const CAT_LABELS: Record<string, string> = {
  WATER: "Suv",
  PROMO: "Promo",
  ACCESSORIES: "Aksessuarlar",
};

const CAT_COLORS: Record<string, string> = {
  WATER: palette.aqua500,
  PROMO: palette.amber500,
  ACCESSORIES: palette.slate500,
};

const CAT_ICONS: Record<string, React.ReactElement<{ color?: string; size?: number }>> = {
  ALL: <Ionicons name="apps-outline" size={16} color={theme.text} />,
  WATER: <Ionicons name="water-outline" size={16} color={palette.aqua500} />,
  PROMO: <Feather name="gift" size={16} color={palette.amber500} />,
  ACCESSORIES: <Feather name="tool" size={16} color={palette.slate500} />,
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
  const totalAmount = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const totalBottles = cartItems.reduce((sum, i) => sum + (i.product.isBottle ? i.quantity : 0), 0);

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Diqqat", "Hech bo'lmasa bitta mahsulot tanlang");
      return;
    }
    Alert.alert(
      "Buyurtmani tasdiqlash",
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
              Alert.alert("Qabul qilindi!", "Operatorimiz tez orada siz bilan bog'lanadi.", [
                { text: "OK" },
              ]);
            } else {
              Alert.alert("Xato", (r as any).error || "Buyurtma berishda xatolik");
            }
          },
        },
      ],
    );
  };

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = catFilter === "ALL" ? products : products.filter((p) => p.category === catFilter);
  const showCompany = new Set(products.map((p) => p.companyId)).size > 1;

  return (
    <Screen>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Buyurtma berish</Text>
          <Text style={styles.headerSubtitle}>Kerakli mahsulotlarni tanlang</Text>
        </View>
        {cartItems.length > 0 && (
          <View style={styles.cartBadge}>
            <Feather name="shopping-bag" size={13} color="#FFF" />
            <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
          </View>
        )}
      </View>

      {/* Kategoriya chiplar */}
      <View style={{ marginBottom: spacing.base }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {categories.map((cat) => {
            const isActive = catFilter === cat;
            const activeColor = cat === "ALL" ? theme.primary : CAT_COLORS[cat] || theme.primary;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  isActive && { backgroundColor: activeColor, borderColor: "transparent" },
                ]}
                onPress={() => setCatFilter(cat)}
                activeOpacity={0.7}
              >
                {React.cloneElement(CAT_ICONS[cat] || CAT_ICONS.ALL, {
                  color: isActive ? "#FFF" : CAT_COLORS[cat] || theme.text,
                })}
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {cat === "ALL" ? "Barchasi" : CAT_LABELS[cat] || cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Mahsulotlar */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.mutedText}>Mahsulotlar yuklanmoqda...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerBox}>
            <View style={styles.emptyIcon}>
              <Feather name="box" size={40} color={theme.textMuted} />
            </View>
            {products.length === 0 ? (
              <>
                <Text style={styles.emptyText}>Hali kompaniyaga a'zo emassiz</Text>
                <TouchableOpacity style={styles.findBtn} onPress={() => router.push("/(customer)/companies")} activeOpacity={0.85}>
                  <Ionicons name="business-outline" size={16} color="#fff" />
                  <Text style={styles.findBtnText}>Kompaniya qidirish</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>Mahsulot topilmadi</Text>
            )}
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filtered.map((p) => {
              const qty = cart[p.id]?.quantity || 0;
              const themeColor = CAT_COLORS[p.category] || theme.primary;
              const hasQty = qty > 0;
              return (
                <View key={p.id} style={[styles.productCard, hasQty && { borderColor: themeColor }]}>
                  <View style={[styles.prodCatBadge, { backgroundColor: themeColor + "15" }]}>
                    {React.cloneElement(CAT_ICONS[p.category] || CAT_ICONS.ALL, {
                      color: themeColor,
                      size: 16,
                    })}
                  </View>

                  <Text style={styles.prodName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  {showCompany && p.company?.name ? (
                    <View style={styles.prodCompanyRow}>
                      <Ionicons name="business" size={11} color={theme.primaryDark} />
                      <Text style={styles.prodCompany} numberOfLines={1}>
                        {p.company.name}
                      </Text>
                    </View>
                  ) : null}
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

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: themeColor }]}
                        onPress={() => addToCart(p)}
                        activeOpacity={0.8}
                      >
                        <Feather name="plus" size={16} color="#FFF" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.counter}>
                        <TouchableOpacity
                          style={[styles.counterBtn, { borderColor: themeColor }]}
                          onPress={() => removeFromCart(p)}
                        >
                          <Feather name="minus" size={14} color={themeColor} />
                        </TouchableOpacity>
                        <Text style={styles.counterQty}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.counterBtn, { backgroundColor: themeColor, borderColor: themeColor }]}
                          onPress={() => addToCart(p)}
                        >
                          <Feather name="plus" size={14} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Izoh */}
        {cartItems.length > 0 && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Qo'shimcha izoh (ixtiyoriy)</Text>
            <View style={styles.notesInputWrapper}>
              <TextInput
                style={styles.notesInput}
                placeholder="Masalan: 3-qavat, domofon 12K..."
                placeholderTextColor={theme.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        )}

        <View style={{ height: cartItems.length > 0 ? 220 : 120 }} />
      </ScrollView>

      {/* Pastki order panel */}
      {cartItems.length > 0 && (
        <View style={[styles.orderBar, { paddingBottom: insets.bottom + 92 }]}>
          <View style={styles.orderSummary}>
            <View>
              <Text style={styles.orderSummaryLabel}>Jami summa</Text>
              <Text style={styles.orderSummaryAmount}>
                {totalAmount.toLocaleString()}{" "}
                <Text style={styles.orderSummaryUnit}>so'm</Text>
              </Text>
            </View>
            {totalBottles > 0 && (
              <View style={styles.bottleBadge}>
                <MaterialCommunityIcons name="bottle-soda-classic-outline" size={14} color={theme.primaryDark} />
                <Text style={styles.bottleBadgeText}>{totalBottles} ta idish</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.orderBtnTouch, shadow.brandSoft]}
            onPress={handleOrder}
            disabled={submitting}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orderBtnGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                  <Text style={styles.orderBtnText}>Buyurtmani tasdiqlash</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.extrabold,
    color: theme.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium },
  cartBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  cartBadgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: "#FFF" },

  catRow: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  catText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.text },
  catTextActive: { color: "#FFF" },

  scroll: { paddingHorizontal: spacing.xl },
  centerBox: { alignItems: "center", paddingTop: 70, gap: spacing.md },
  mutedText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: fontSize.md, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  productCard: {
    width: "47.5%",
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  prodCatBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  prodName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: theme.text,
    marginBottom: 4,
    lineHeight: 19,
  },
  prodDesc: { fontSize: fontSize.xs, color: theme.textSecondary, marginBottom: spacing.md, fontWeight: fontWeight.medium },
  prodCompanyRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  prodCompany: { fontSize: 11, color: theme.primaryDark, fontWeight: fontWeight.bold, flex: 1 },
  findBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  findBtnText: { color: "#fff", fontSize: fontSize.base, fontWeight: fontWeight.bold },
  prodBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  prodPrice: { fontSize: fontSize.lg, fontWeight: fontWeight.black, letterSpacing: -0.3 },
  prodUnit: { fontSize: 10, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
  },
  counterQty: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, minWidth: 18, textAlign: "center", color: theme.text },

  notesBox: { marginTop: spacing.lg },
  notesLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: theme.text,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
  notesInputWrapper: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: theme.border,
    overflow: "hidden",
  },
  notesInput: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: theme.text,
    height: 64,
    textAlignVertical: "top",
  },

  orderBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    borderTopWidth: 1,
    borderTopColor: theme.borderSoft,
    ...shadow.lg,
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  orderSummaryLabel: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  orderSummaryAmount: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: theme.text,
    letterSpacing: -0.5,
  },
  orderSummaryUnit: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary },
  bottleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  bottleBadgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.primaryDark },

  orderBtnTouch: { borderRadius: radius.lg, overflow: "hidden" },
  orderBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  orderBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: "#FFF" },
});
