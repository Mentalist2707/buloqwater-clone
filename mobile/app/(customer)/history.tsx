/**
 * Customer — Buyurtmalar tarixi
 * Organic Liquid & Claymorphism Style
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { customerService } from "@/services/customer";
import type { Order } from "@/types";

// ─── Yangilangan Shaffof va Toza Rang Palitrasi ──────────────────
const C = {
  bgGradient: ["#E6FFFA", "#EBF5FF", "#F4FAFF"], // Suyuq orqa fon
  cardWhite: "#FFFFFF",
  textDark: "#0F172A",
  textSub: "#64748B",

  cyan: "#06B6D4",
  cyanLight: "#E0F7FA",
  blue: "#0284C7",
  blueLight: "#E0F2FE",
};

// Statuslar uchun zamonaviy ranglar va Feather/Ionicons konfiguri
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    icon: keyof typeof Feather.glyphMap;
  }
> = {
  PENDING: {
    label: "Kutilmoqda",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "clock",
  },
  ASSIGNED: {
    label: "Tayinlangan",
    color: "#6366F1",
    bg: "#EEF2FF",
    icon: "user-check",
  },
  IN_TRANSIT: {
    label: "Yo'lda",
    color: "#06B6D4",
    bg: "#E0F7FA",
    icon: "truck",
  },
  DELIVERED: {
    label: "Yetkazildi",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "check-circle",
  },
  CANCELLED: {
    label: "Bekor qilindi",
    color: "#F43F5E",
    bg: "#FFE4E6",
    icon: "x-circle",
  },
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
      <View style={[styles.card, styles.clayCard]}>
        {/* Header (Buyurtma raqami va Status) */}
        <View style={styles.cardHeader}>
          <View style={styles.orderNumBox}>
            <Text style={styles.orderNum}>#{o.orderNumber}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <Feather name={s.icon} size={13} color={s.color} />
            <Text style={[styles.statusLabel, { color: s.color }]}>
              {s.label}
            </Text>
          </View>
        </View>

        {/* Ichidagi mahsulotlar ro'yxati (Ichki tonlangan quti) */}
        <View style={styles.itemsBox}>
          {o.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Ionicons
                name="water"
                size={12}
                color={C.cyan}
                style={styles.itemIcon}
              />
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                {item.totalPrice.toLocaleString()} so'm
              </Text>
            </View>
          ))}
        </View>

        {/* Footer (Sana va Jami summa) */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Jami summa</Text>
            <Text style={styles.totalAmount}>
              {o.totalAmount.toLocaleString()} so'm
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(o.createdAt)}</Text>
        </View>

        {/* Haydovchi ma'lumotlari biriktirilgan bo'lsa */}
        {o.driver && (
          <View style={styles.driverRow}>
            <View style={styles.driverIconBox}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={16}
                color={C.blue}
              />
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
    <LinearGradient colors={C.bgGradient} style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Suyuq pufakchalar dekoratsiyasi */}
      <View style={styles.fluidBubble1} />
      <View style={styles.fluidBubble2} />

      {/* Ekran Sarlavhasi */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Buyurtmalar tarixi</Text>
        <View style={styles.counterBadge}>
          <Text style={styles.headerSub}>{orders.length} ta buyurtma</Text>
        </View>
      </View>

      {/* Ro'yxat */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(o) => o.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.cyan}
          />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Feather
                name={loading ? "loader" : "clipboard"}
                size={36}
                color={C.cyan}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {loading ? "Yuklanmoqda..." : "Buyurtmalar mavjud emas"}
            </Text>
            <Text style={styles.emptySub}>
              {loading
                ? "Tizimdan ma'lumotlar olinmoqda"
                : "Sizda hali birorta ham buyurtma yo'q!"}
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Orqa fon suyuqlik effektlari
  fluidBubble1: {
    position: "absolute",
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(6, 182, 212, 0.05)",
  },
  fluidBubble2: {
    position: "absolute",
    bottom: 40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(2, 132, 199, 0.04)",
  },

  // Sarlavha qismi
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.textDark,
    letterSpacing: -0.5,
  },
  counterBadge: {
    backgroundColor: C.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerSub: { fontSize: 12, color: C.blue, fontWeight: "700" },

  list: { paddingHorizontal: 24, paddingBottom: 120 },

  // Claymorphic Karta dizayni
  card: {
    backgroundColor: C.cardWhite,
    borderRadius: 24,
    padding: 18,
  },
  clayCard: {
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.03,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  orderNumBox: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  orderNum: { fontSize: 13, fontWeight: "800", color: "#475569" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusLabel: { fontSize: 12, fontWeight: "700" },

  // Mahsulotlar konteyneri
  itemsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemIcon: { marginRight: 6 },
  itemName: { flex: 1, fontSize: 14, color: C.textDark, fontWeight: "600" },
  itemQty: {
    fontSize: 13,
    color: C.textSub,
    width: 34,
    textAlign: "center",
    fontWeight: "500",
  },
  itemPrice: { fontSize: 14, fontWeight: "700", color: C.textDark },

  // Karta pastki qismi
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: "600",
    uppercase: true,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: -0.3,
  },
  dateText: { fontSize: 12, color: C.textSub, fontWeight: "500" },

  // Haydovchi paneli
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: "rgba(241, 245, 249, 0.8)",
  },
  driverIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: { fontSize: 13, fontWeight: "700", color: C.textDark },
  driverPhone: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: "500",
    marginTop: 1,
  },

  // Bo'sh holat oynasi
  empty: { alignItems: "center", paddingTop: 100 },
  emptyIconBox: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: C.cyanLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.textDark },
  emptySub: { fontSize: 13, color: C.textSub, marginTop: 4, fontWeight: "500" },
});
