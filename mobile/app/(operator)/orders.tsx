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
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, StatusBadge, Button } from "@/components/ui";
import { Colors, ORDER_STATUS_LABELS } from "@/constants";
import { ordersService } from "@/services/orders";
import type { Order, Driver } from "@/types";

const STATUS_FILTERS = ["ALL", "PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED"];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Assign modal
  const [assignModal, setAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const loadOrders = async (pageNum = 1, statusFilter = filter) => {
    const params: Record<string, string> = { page: pageNum.toString(), limit: "20" };
    if (statusFilter !== "ALL") params.status = statusFilter;

    const result = await ordersService.getOrders(params);
    if (result.success && result.data) {
      if (pageNum === 1) {
        setOrders(result.data.items);
      } else {
        setOrders((prev) => [...prev, ...result.data!.items]);
      }
      setTotalPages(result.data.totalPages);
      setPage(pageNum);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders(1);
    }, [filter])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages) {
      loadOrders(page + 1);
    }
  };

  const handleAssign = async (order: Order) => {
    setSelectedOrder(order);
    setAssignModal(true);
    const result = await ordersService.getDrivers();
    if (result.success && result.data) {
      setDrivers(result.data);
    }
  };

  const confirmAssign = async (driverId: string) => {
    if (!selectedOrder) return;
    setAssignLoading(true);
    const result = await ordersService.assignDriver(selectedOrder.id, driverId);
    if (result.success) {
      Alert.alert("Tayyor!", "Haydovchi biriktirildi");
      setAssignModal(false);
      loadOrders(1);
    } else {
      Alert.alert("Xatolik", result.error || "Xatolik yuz berdi");
    }
    setAssignLoading(false);
  };

  const renderFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item === "ALL" ? "Hammasi" : ORDER_STATUS_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.orderAmount}>{item.totalAmount.toLocaleString()} so'm</Text>
      </View>

      <View style={styles.orderBody}>
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.customerAddress}>{item.customer.address}</Text>
        {item.driver && (
          <Text style={styles.driverInfo}>🚗 {item.driver.name}</Text>
        )}
      </View>

      <View style={styles.orderItems}>
        {item.items.map((oi) => (
          <Text key={oi.id} style={styles.itemText}>
            {oi.product.name} x{oi.quantity} = {oi.totalPrice.toLocaleString()}
          </Text>
        ))}
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

  return (
    <View style={styles.container}>
      {renderFilter()}

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              {loading ? "Yuklanmoqda..." : "Buyurtmalar topilmadi"}
            </Text>
          </View>
        }
      />

      {/* Assign Driver Modal */}
      <Modal visible={assignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Haydovchi tanlang</Text>
            <Text style={styles.modalSubtitle}>
              Buyurtma #{selectedOrder?.orderNumber}
            </Text>

            {drivers.length === 0 ? (
              <Text style={styles.modalEmpty}>Yuklanmoqda...</Text>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                style={styles.driverList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.driverItem}
                    onPress={() => confirmAssign(item.id)}
                    disabled={assignLoading}
                  >
                    <View>
                      <Text style={styles.driverName}>{item.name}</Text>
                      <Text style={styles.driverPhone}>{item.phone}</Text>
                    </View>
                    <View style={styles.driverBadge}>
                      <Text style={styles.driverBadgeText}>
                        {item.activeOrdersCount} ta
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
              />
            )}

            <Button
              title="Bekor qilish"
              onPress={() => setAssignModal(false)}
              variant="outline"
              style={styles.modalCancel}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterContainer: { paddingVertical: 12 },
  filterList: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.gray[600] },
  filterTextActive: { color: Colors.white, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  orderCard: { padding: 16 },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  orderHeaderLeft: { gap: 4 },
  orderNumber: { fontSize: 15, fontWeight: "700", color: Colors.gray[900] },
  orderAmount: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  orderBody: { marginBottom: 8 },
  customerName: { fontSize: 14, fontWeight: "600", color: Colors.gray[800] },
  customerAddress: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  driverInfo: { fontSize: 13, color: Colors.secondary, marginTop: 4 },
  orderItems: {
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  itemText: { fontSize: 12, color: Colors.gray[600], marginBottom: 2 },
  assignBtn: { alignSelf: "flex-start" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray[500] },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  modalSubtitle: { fontSize: 14, color: Colors.gray[500], marginTop: 4, marginBottom: 16 },
  modalEmpty: { textAlign: "center", color: Colors.gray[400], paddingVertical: 20 },
  driverList: { maxHeight: 300 },
  driverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  driverName: { fontSize: 15, fontWeight: "600", color: Colors.gray[800] },
  driverPhone: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  driverBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  driverBadgeText: { fontSize: 12, color: Colors.primaryDark, fontWeight: "600" },
  divider: { height: 1, backgroundColor: Colors.gray[100] },
  modalCancel: { marginTop: 16 },
});
