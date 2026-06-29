"Admin buyurtmalar sahifasi — To'liq xatosiz StyleSheet versiyasi"
import React, { useState, useCallback, useMemo } from "react";
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
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card, StatusBadge, Button, Input } from "@/components/ui";
import { Colors, ORDER_STATUS_LABELS } from "@/constants";
import { ordersService } from "@/services/orders";
import type { Order, Driver } from "@/types";

const STATUS_FILTERS = ["ALL", "PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
type DateFilter = "ALL" | "TODAY" | "YESTERDAY" | "WEEK";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "ALL", label: "Barchasi" },
  { key: "TODAY", label: "Bugun" },
  { key: "YESTERDAY", label: "Kecha" },
  { key: "WEEK", label: "Hafta" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  ALL:        { bg: "rgba(2, 132, 199, 0.08)", text: "#0284C7" },
  PENDING:    { bg: "rgba(217, 119, 6, 0.08)",  text: "#D97706" },
  ASSIGNED:   { bg: "rgba(99, 102, 241, 0.08)", text: "#6366F1" },
  IN_TRANSIT: { bg: "rgba(14, 165, 233, 0.08)", text: "#0EA5E9" },
  DELIVERED:  { bg: "rgba(22, 163, 74, 0.08)",  text: "#16A34A" },
  CANCELLED:  { bg: "rgba(220, 38, 38, 0.08)",  text: "#DC2626" },
};

function getTimeSincePending(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}s ${minutes % 60}m`;
}

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [search, setSearch] = useState("");
  
  const [assignModal, setAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const loadOrders = async () => {
    const params: Record<string, string> = { limit: "100" };
    if (statusFilter !== "ALL") params.status = statusFilter;
    const result = await ordersService.getOrders(params);
    if (result.success && result.data) setOrders(result.data.items);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [statusFilter])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let result = [...orders];

    if (dateFilter !== "ALL") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);

      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt);
        if (dateFilter === "TODAY") return orderDate >= todayStart;
        if (dateFilter === "YESTERDAY") return orderDate >= yesterdayStart && orderDate < todayStart;
        if (dateFilter === "WEEK") return orderDate >= weekStart;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone1.includes(q) ||
        String(o.orderNumber).includes(q)
      );
    }

    return result;
  }, [orders, dateFilter, search]);

  const handleAssign = async (order: Order) => {
    setSelectedOrder(order);
    setAssignModal(true);
    setDriversLoading(true);
    const result = await ordersService.getDrivers();
    if (result.success && result.data) setDrivers(result.data);
    setDriversLoading(false);
  };

  const confirmAssign = async (driverId: string, driverName: string) => {
    if (!selectedOrder) return;
    setAssignLoading(true);
    const r = await ordersService.assignDriver(selectedOrder.id, driverId);
    if (r.success) {
      Alert.alert("✅ Tayyor!", `${driverName}ga biriktirildi`);
      setAssignModal(false);
      loadOrders();
    } else {
      Alert.alert("Xatolik", (r as any).error || "Xatolik yuz berdi");
    }
    setAssignLoading(false);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const isUrgent = item.status === "PENDING" && Date.now() - new Date(item.createdAt).getTime() > 3600000;
    const isNew = item.status === "PENDING" && Date.now() - new Date(item.createdAt).getTime() < 300000;
    const pendingTime = item.status === "PENDING" ? getTimeSincePending(item.createdAt) : null;
    const totalQty = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <Card
        style={[
          styles.orderCard,
          isUrgent && styles.orderCardUrgent,
          isNew && styles.orderCardNew,
        ]}
      >
        <View style={styles.orderHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>⚠️ Kechikkan</Text>
                </View>
              )}
              {isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newText}>✨ Yangi</Text>
                </View>
              )}
            </View>
            <View style={styles.badgeRow}>
              <StatusBadge status={item.status} />
              {pendingTime && (
                <View style={styles.tickerBadge}>
                  <Ionicons name="time-outline" size={12} color={isUrgent ? Colors.danger : "#D97706"} />
                  <Text style={[styles.pendingTime, isUrgent && { color: Colors.danger }]}>
                    {pendingTime}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.orderAmount}>{item.totalAmount.toLocaleString()} so'm</Text>
        </View>

        <View style={styles.customerBlock}>
          <Text style={styles.customerName}>{item.customer.name}</Text>
          <Text style={styles.customerPhone}>{item.customer.phone1}</Text>
          <View style={styles.infoLine}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.customerAddress} numberOfLines={2}>{item.customer.address}</Text>
          </View>
          {item.customer.landmark ? (
            <Text style={styles.landmark}>Mo'ljal: {item.customer.landmark}</Text>
          ) : null}
        </View>

        <View style={styles.itemsDivider} />

        <View style={styles.itemsRow}>
          {item.items.map((oi, i) => (
            <Text key={i} style={styles.itemChip}>
              {oi.product.name} <Text style={{ fontWeight: '700' }}>×{oi.quantity}</Text>
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.bottleBox}>
            <Ionicons name="water-outline" size={14} color="#64748B" />
            <Text style={styles.bottleLabel}>Idish: {totalQty} ta</Text>
          </View>
          {item.driver && (
            <View style={styles.driverContainer}>
              <Ionicons name="car-outline" size={14} color="#334155" />
              <Text style={styles.driverInfo}>Haydovchi: {item.driver.name}</Text>
            </View>
          )}
        </View>

        {item.status === "PENDING" && (
          <Button
            title="Haydovchi biriktirish"
            onPress={() => handleAssign(item)}
            variant="primary"
            size="sm"
            style={styles.assignBtn}
          />
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerPanel, { paddingTop: insets.top > 0 ? insets.top + 8 : 14 }]}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
          <Input
            placeholder="Ism, telefon yoki buyurtma raqami..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={{ height: 34, marginBottom: 4 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.filterListContainer}
          renderItem={({ item }) => {
            const isActive = statusFilter === item;
            const config = STATUS_STYLES[item] || STATUS_STYLES.ALL;
            return (
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: isActive ? config.text : config.bg }]}
                onPress={() => setStatusFilter(item)}
              >
                <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : config.text }]}>
                  {item === "ALL" ? "Barchasi" : ORDER_STATUS_LABELS[item] || item}
                </Text>
              </TouchableOpacity>
              
            )}}
         />
      </View>

      <View style={styles.dateFilterRow}>
        {DATE_FILTERS.map((df) => (
          <TouchableOpacity
            key={df.key}
            style={[styles.dateChip, dateFilter === df.key && styles.dateChipActive]}
            onPress={() => setDateFilter(df.key)}
          >
            <Text style={[styles.dateChipText, dateFilter === df.key && styles.dateChipTextActive]}>
              {df.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(dateFilter !== "ALL" || search) && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>{filtered.length} ta buyurtma topildi</Text>
          <TouchableOpacity onPress={() => { setDateFilter("ALL"); setSearch(""); }}>
            <Text style={styles.clearText}>Filtrni tozalash</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        renderItem={renderOrder}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>Buyurtmalar mavjud emas</Text>
              </>
            )}
          </View>
        }
      />

      <Modal visible={assignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Haydovchini tanlang</Text>
            <Text style={styles.modalSub}>Buyurtma #{selectedOrder?.orderNumber} · {selectedOrder?.customer.name}</Text>

            {driversLoading ? (
              <View style={{ paddingVertical: 40 }}><ActivityIndicator color={Colors.primary} /></View>
            ) : drivers.length === 0 ? (
              <Text style={styles.modalEmpty}>Haydovchilar topilmadi</Text>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(i) => i.id}
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const load = item.activeOrdersCount;
                  const color = load === 0 ? Colors.success : load <= 3 ? Colors.primary : Colors.warning;
                  return (
                    <TouchableOpacity
                      style={styles.driverRow}
                      onPress={() => confirmAssign(item.id, item.name)}
                      disabled={assignLoading}
                    >
                      <View style={[styles.driverAvatar, { backgroundColor: color + "15" }]}>
                        <Text style={[styles.driverAvatarText, { color }]}>{item.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.driverName}>{item.name}</Text>
                        <Text style={styles.driverPhone}>{item.phone}</Text>
                      </View>
                      <View style={[styles.driverBadge, { backgroundColor: color + "10" }]}>
                        <Text style={[styles.driverBadgeText, { color }]}>
                          {load === 0 ? "Bo'sh" : `${load} ta buyurtma`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#F1F5F9" }} />}
              />
            )}

            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>Bo'sh</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary }]} /><Text style={styles.legendText}>1-3 ta</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.warning }]} /><Text style={styles.legendText}>4+ ta</Text></View>
            </View>

            <Button
              title="Yopish"
              onPress={() => setAssignModal(false)}
              variant="outline"
              style={{ marginTop: 16, borderRadius: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerPanel: { paddingHorizontal: 16, paddingBottom: 6 },
  
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: 54, borderBottomWidth: 0, backgroundColor: "transparent",marginBottom:0 },
  
  filterListContainer: { paddingHorizontal: 16, gap: 6 },
  chip: { paddingHorizontal: 12, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 12, fontWeight: "600" },
  
  dateFilterRow: { flexDirection: "row", gap: 4, paddingHorizontal: 16, backgroundColor: "#F1F5F9", padding: 3, borderRadius: 10, marginHorizontal: 16, marginBottom: 12, marginTop: 8 },
  dateChip: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 8 },
  dateChipActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  dateChipText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  dateChipTextActive: { color: "#1E293B", fontWeight: "700" },
  
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 10 },
  resultText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  clearText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  orderCard: { padding: 16, borderRadius: 16, backgroundColor: Colors.white, borderLeftWidth: 4, borderLeftColor: "#CBD5E1", borderWidth: 1, borderColor: "#E2E8F0" },
  orderCardUrgent: { borderLeftColor: Colors.danger, backgroundColor: "#FFF5F5" },
  orderCardNew: { borderLeftColor: Colors.success, backgroundColor: "#F0FFF4" },
  
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  orderNumberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderNumber: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 },
  urgentBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  urgentText: { fontSize: 10, fontWeight: "700", color: Colors.danger },
  newBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  newText: { fontSize: 10, fontWeight: "700", color: Colors.success },
  tickerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(217, 119, 6, 0.06)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pendingTime: { fontSize: 11, color: "#D97706", fontWeight: "600" },
  orderAmount: { fontSize: 16, fontWeight: "800", color: Colors.primary },
  
  customerBlock: { gap: 4, marginBottom: 10, paddingVertical: 2 },
  customerName: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  customerPhone: { fontSize: 12, color: "#64748B" },
  infoLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  customerAddress: { flex: 1, fontSize: 13, color: "#475569" },
  landmark: { fontSize: 12, color: "#64748B", fontStyle: "italic", marginLeft: 18 },
  
  itemsDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  itemsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4, marginBottom: 12 },
  itemChip: { fontSize: 12, backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: "#334155" },
  
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  bottleBox: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bottleLabel: { fontSize: 12, fontWeight: "600", color: "#475569" },
  driverContainer: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  driverInfo: { fontSize: 12, color: "#334155", fontWeight: "600" },
  
  assignBtn: { marginTop: 4, borderRadius: 10, width: '100%' },
  
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 54, marginBottom: 14 },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "500" },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.3)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 34, maxHeight: "85%" },
  modalIndicator: { width: 36, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalSub: { fontSize: 13, color: "#64748B", marginTop: 4, marginBottom: 20 },
  modalEmpty: { textAlign: "center", color: "#94A3B8", paddingVertical: 30, fontSize: 14 },
  
  driverRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  driverAvatarText: { fontWeight: "700", fontSize: 15 },
  driverName: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  driverPhone: { fontSize: 12, color: "#64748B" },
  driverBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  driverBadgeText: { fontSize: 11, fontWeight: "600" },
  
  legendRow: { flexDirection: "row", gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9", marginTop: 12, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: "#64748B" },
});