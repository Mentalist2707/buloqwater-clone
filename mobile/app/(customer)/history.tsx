/**
 * Customer — Buyurtmalar tarixi (2026 redesign)
 */
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { customerService } from "@/services/customer";
import type { Order } from "@/types";
import { Screen } from "@/components/ui";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: keyof typeof Feather.glyphMap }
> = {
  PENDING: { label: "Kutilmoqda", color: palette.amber500, bg: palette.amber100, icon: "clock" },
  ASSIGNED: { label: "Tayinlangan", color: palette.violet500, bg: palette.violet100, icon: "user-check" },
  IN_TRANSIT: { label: "Yo'lda", color: palette.aqua500, bg: palette.aqua100, icon: "truck" },
  DELIVERED: { label: "Yetkazildi", color: palette.mint500, bg: palette.mint100, icon: "check-circle" },
  CANCELLED: { label: "Bekor qilindi", color: palette.rose500, bg: palette.rose100, icon: "x-circle" },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const r = await customerService.getOrders();
    if (r.success && r.data) setOrders(r.data as any);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderOrder = ({ item: o }: { item: Order }) => {
    const s = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.PENDING;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.orderNumBox}>
            <Text style={styles.orderNum}>#{o.orderNumber}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <Feather name={s.icon} size={13} color={s.color} />
            <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.itemsBox}>
          {o.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Ionicons name="water" size={12} color={theme.primary} style={styles.itemIcon} />
              <Text style={styles.itemName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>{item.totalPrice.toLocaleString()} so'm</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Jami summa</Text>
            <Text style={styles.totalAmount}>{o.totalAmount.toLocaleString()} so'm</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(o.createdAt)}</Text>
        </View>

        {o.driver && (
          <View style={styles.driverRow}>
            <View style={styles.driverIconBox}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={16} color={theme.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{o.driver.name}</Text>
              <Text style={styles.driverPhone}>{o.driver.phone}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Buyurtmalar tarixi</Text>
        <View style={styles.counterBadge}>
          <Text style={styles.headerSub}>{orders.length} ta</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Feather name={loading ? "loader" : "clipboard"} size={34} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {loading ? "Yuklanmoqda..." : "Buyurtmalar mavjud emas"}
            </Text>
            <Text style={styles.emptySub}>
              {loading ? "Tizimdan ma'lumotlar olinmoqda" : "Sizda hali birorta ham buyurtma yo'q!"}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.extrabold,
    color: theme.text,
    letterSpacing: -0.5,
  },
  counterBadge: {
    backgroundColor: theme.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  headerSub: { fontSize: fontSize.xs, color: theme.primaryDark, fontWeight: fontWeight.bold },

  list: { paddingHorizontal: spacing.xl, paddingBottom: 150 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  orderNumBox: {
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  orderNum: { fontSize: fontSize.sm, fontWeight: fontWeight.extrabold, color: theme.textSecondary },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
  },
  statusLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  itemsBox: {
    backgroundColor: theme.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemIcon: { marginRight: 6 },
  itemName: { flex: 1, fontSize: fontSize.base, color: theme.text, fontWeight: fontWeight.semibold },
  itemQty: { fontSize: fontSize.sm, color: theme.textSecondary, width: 34, textAlign: "center", fontWeight: fontWeight.medium },
  itemPrice: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  totalLabel: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.semibold, textTransform: "uppercase" },
  totalAmount: { fontSize: fontSize.lg, fontWeight: fontWeight.black, color: theme.text, letterSpacing: -0.3 },
  dateText: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.medium },

  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  driverIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: theme.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.text },
  driverPhone: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.medium, marginTop: 1 },

  empty: { alignItems: "center", paddingTop: 100 },
  emptyIconBox: {
    width: 78,
    height: 78,
    borderRadius: radius["2xl"],
    backgroundColor: theme.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },
  emptySub: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 4, fontWeight: fontWeight.medium },
});
