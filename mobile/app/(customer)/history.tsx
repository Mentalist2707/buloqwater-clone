/**
 * Customer — Buyurtmalar tarixi
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, StatusBar,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { customerService } from "@/services/customer";
import type { Order } from "@/types";

const C = {
  primary: "#00C6A2", dark: "#00A88A", light: "#E6FAF7",
  bg: "#F0FAF8", white: "#FFFFFF", text: "#1A2E2B", sub: "#6B8F89",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:    { label: "Kutilmoqda",   color: "#F59E0B", bg: "#FEF3C7", icon: "⏳" },
  ASSIGNED:   { label: "Tayinlangan",  color: "#6C63FF", bg: "#EFEDFF", icon: "✅" },
  IN_TRANSIT: { label: "Yo'lda",       color: "#00C6A2", bg: "#E6FAF7", icon: "🚚" },
  DELIVERED:  { label: "Yetkazildi",   color: "#22C55E", bg: "#DCFCE7", icon: "🎉" },
  CANCELLED:  { label: "Bekor qilindi",color: "#EF4444", bg: "#FEE2E2", icon: "❌" },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderOrder = ({ item: o }: { item: Order }) => {
    const s = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.PENDING;
    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderNumBox}>
            <Text style={styles.orderNum}>#{o.orderNumber}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <Text style={styles.statusIcon}>{s.icon}</Text>
            <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsBox}>
          {o.items.map((item, i) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemDot}>•</Text>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>{item.totalPrice.toLocaleString()} so'm</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Jami</Text>
            <Text style={styles.totalAmount}>{o.totalAmount.toLocaleString()} so'm</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(o.createdAt)}</Text>
        </View>

        {/* Driver info */}
        {o.driver && (
          <View style={styles.driverRow}>
            <Text style={styles.driverIcon}>🚚</Text>
            <Text style={styles.driverName}>{o.driver.name}</Text>
            <Text style={styles.driverPhone}>{o.driver.phone}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Buyurtmalar tarixi</Text>
        <Text style={styles.headerSub}>{orders.length} ta buyurtma</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{loading ? "⏳" : "📋"}</Text>
            <Text style={styles.emptyTitle}>{loading ? "Yuklanmoqda..." : "Buyurtmalar yo'q"}</Text>
            <Text style={styles.emptySub}>
              {loading ? "" : "Birinchi buyurtmangizni bering!"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header:    { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: C.text },
  headerSub:   { fontSize: 13, color: C.sub, marginTop: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  card: {
    backgroundColor: C.white, borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  orderNumBox: { backgroundColor: C.light, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  orderNum:    { fontSize: 13, fontWeight: "800", color: C.dark },
  statusPill:  { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusIcon:  { fontSize: 13 },
  statusLabel: { fontSize: 12, fontWeight: "700" },

  itemsBox:  { backgroundColor: C.bg, borderRadius: 12, padding: 10, marginBottom: 12 },
  itemRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  itemDot:   { color: C.primary, fontSize: 14, width: 14 },
  itemName:  { flex: 1, fontSize: 13, color: C.text, fontWeight: "500" },
  itemQty:   { fontSize: 12, color: C.sub, width: 28, textAlign: "center" },
  itemPrice: { fontSize: 13, fontWeight: "700", color: C.dark },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  totalLabel: { fontSize: 11, color: C.sub },
  totalAmount: { fontSize: 18, fontWeight: "800", color: C.text },
  dateText:   { fontSize: 11, color: C.sub },

  driverRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E6FAF7" },
  driverIcon: { fontSize: 14 },
  driverName: { fontSize: 13, fontWeight: "600", color: C.text },
  driverPhone:{ fontSize: 12, color: C.sub },

  empty:      { alignItems: "center", paddingTop: 80 },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  emptySub:   { fontSize: 14, color: C.sub, marginTop: 6 },
});
