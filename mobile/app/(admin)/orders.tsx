"Admin buyurtmalar sahifasi — filter + haydovchi biriktirish + sana filtri"
import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
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

function getTimeSincePending(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} daqiqa`;
  const hours = Math.floor(minutes / 60);
  return `${hours}s ${minutes % 60}d`;
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

  const loadOrders = async () => {
    const params: Record<string, string> = { limit: "100" };
    if (statusFilter !== "ALL") params.status = statusFilter;
    const result = await ordersService.getOrders(params);
    if (result.success && result.data) setOrders(result.data.items);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadOrders(); }, []));
  React.useEffect(() => { if (!loading) loadOrders(); }, [statusFilter]);

  const onRefresh = async () => { setRefreshing(true); await loadOrders(); setRefreshing(false); };

  const filtered = useMemo(() => {
    let result = [...orders];

    // Sana filtri
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

    // Qidiruv
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
    const result = await ordersService.getDrivers();
    if (result.success && result.data) setDrivers(result.data);
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
    const isUrgent =
      item.status === "PENDING" &&
      Date.now() - new Date(item.createdAt).getTime() > 3600000; // 1 soat
    const isNew =
      item.status === "PENDING" &&
      Date.now() - new Date(item.createdAt).getTime() < 300000; // 5 daqiqa

    const pendingTime =
      item.status === "PENDING" ? getTimeSincePending(item.createdAt) : null;

    return (
      <Card
        style={[
          styles.orderCard,
          isUrgent && styles.orderCardUrgent,
          isNew && styles.orderCardNew,
        ]}
      >
        <View style={styles.orderHeader}>
          <View style={{ gap: 4 }}>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>⚠️ Kechikkan</Text>
                </View>
              )}
              {isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newText}>🆕 Yangi</Text>
                </View>
              )}
            </View>
            <StatusBadge status={item.status} />
            {pendingTime && (
              <Text style={[styles.pendingTime, isUrgent && { color: Colors.danger }]}>
                ⏱ {pendingTime}
              </Text>
            )}
          </View>
          <Text style={styles.orderAmount}>{item.totalAmount.toLocaleString()} so'm</Text>
        </View>

        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.customerAddress}>{item.customer.address}</Text>
        {item.customer.landmark ? (
          <Text style={styles.landmark}>Mo'ljal: {item.customer.landmark}</Text>
        ) : null}
        {item.driver ? <Text style={styles.driverInfo}>🚗 {item.driver.name}</Text> : null}

        <View style={styles.itemsRow}>
          {item.items.map((oi, i) => (
            <Text key={i} style={styles.itemChip}>
              {oi.product.name} ×{oi.quantity}
            </Text>
          ))}
        </View>

        {item.status === "PENDING" && (
          <Button
            title="🚚 Haydovchi biriktirish"
            onPress={() => handleAssign(item)}
            variant="outline"
            size="sm"
            style={styles.assignBtn}
          />
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Input
          placeholder="🔍 Ism, telefon yoki #..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Status filter tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(i) => i}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, statusFilter === item && styles.chipActive]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={[styles.chipText, statusFilter === item && styles.chipTextActive]}>
              {item === "ALL" ? "Barchasi" : ORDER_STATUS_LABELS[item] || item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Date filter */}
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

      {/* Results count when filtered */}
      {(dateFilter !== "ALL" || search) && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {filtered.length} ta buyurtma
          </Text>
          <TouchableOpacity
            onPress={() => { setDateFilter("ALL"); setSearch(""); }}
          >
            <Text style={styles.clearText}>Tozalash</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        renderItem={renderOrder}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              {loading ? "Yuklanmoqda..." : "Buyurtma topilmadi"}
            </Text>
          </View>
        }
      />

      {/* Assign Driver Modal */}
      <Modal visible={assignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚚 Haydovchi tanlang</Text>
            <Text style={styles.modalSub}>Buyurtma #{selectedOrder?.orderNumber} · {selectedOrder?.customer.name}</Text>

            {drivers.length === 0 ? (
              <Text style={styles.modalEmpty}>Yuklanmoqda...</Text>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(i) => i.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => {
                  const load = item.activeOrdersCount;
                  const color = load === 0 ? Colors.success : load <= 3 ? Colors.primary : Colors.warning;
                  return (
                    <TouchableOpacity
                      style={styles.driverRow}
                      onPress={() => confirmAssign(item.id, item.name)}
                      disabled={assignLoading}
                    >
                      <View style={[styles.driverAvatar, { backgroundColor: color }]}>
                        <Text style={styles.driverAvatarText}>{item.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.driverName}>{item.name}</Text>
                        <Text style={styles.driverPhone}>{item.phone}</Text>
                      </View>
                      <View style={[styles.driverBadge, { backgroundColor: color + "20" }]}>
                        <Text style={[styles.driverBadgeText, { color }]}>
                          {load === 0 ? "Bo'sh" : `${load} ta`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.gray[100] }} />}
              />
            )}

            {/* Load legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendText}>Bo'sh</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>1-3 ta</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.legendText}>4+ ta</Text>
              </View>
            </View>

            <Button
              title="Bekor qilish"
              onPress={() => setAssignModal(false)}
              variant="outline"
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: { paddingHorizontal: 16, paddingTop: 12 },
  filterList: {},
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.gray[600] },
  chipTextActive: { color: Colors.white, fontWeight: "600" },
  // Date filter
  dateFilterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  dateChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.gray[100] },
  dateChipActive: { backgroundColor: Colors.gray[800] },
  dateChipText: { fontSize: 12, color: Colors.gray[600] },
  dateChipTextActive: { color: Colors.white, fontWeight: "600" },
  // Result row
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 4 },
  resultText: { fontSize: 12, color: Colors.gray[500] },
  clearText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  orderCard: { padding: 14 },
  orderCardUrgent: { borderWidth: 1, borderColor: Colors.danger + "60", backgroundColor: "#FFF5F5" },
  orderCardNew: { borderWidth: 1, borderColor: Colors.success + "60", backgroundColor: "#F0FFF4" },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  orderNumberRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  orderNumber: { fontSize: 15, fontWeight: "700", color: Colors.gray[900] },
  urgentBadge: { backgroundColor: Colors.dangerLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  urgentText: { fontSize: 10, fontWeight: "600", color: Colors.danger },
  newBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  newText: { fontSize: 10, fontWeight: "600", color: Colors.success },
  pendingTime: { fontSize: 11, color: Colors.warning, fontWeight: "500" },
  orderAmount: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  customerName: { fontSize: 14, fontWeight: "600", color: Colors.gray[800] },
  customerAddress: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  landmark: { fontSize: 12, color: Colors.gray[400], marginTop: 1, fontStyle: "italic" },
  driverInfo: { fontSize: 12, color: Colors.secondary, marginTop: 4 },
  itemsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  itemChip: { fontSize: 11, backgroundColor: Colors.gray[100], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, color: Colors.gray[600] },
  assignBtn: { alignSelf: "flex-start", marginTop: 8 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray[500] },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  modalSub: { fontSize: 13, color: Colors.gray[500], marginTop: 4, marginBottom: 16 },
  modalEmpty: { textAlign: "center", color: Colors.gray[400], paddingVertical: 20 },
  driverRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  driverAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  driverAvatarText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  driverName: { fontSize: 15, fontWeight: "600", color: Colors.gray[800] },
  driverPhone: { fontSize: 12, color: Colors.gray[500] },
  driverBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  driverBadgeText: { fontSize: 12, fontWeight: "600" },
  legendRow: { flexDirection: "row", gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.gray[100], marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.gray[500] },
});
