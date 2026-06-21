import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Card, StatusBadge, Button } from "@/components/ui";
import { Colors } from "@/constants";
import { driverService } from "@/services/driver";
import { useAuthStore } from "@/store/auth";
import type { Order, DriverTasksResponse } from "@/types";

export default function DriverTasksScreen() {
  const [data, setData] = useState<DriverTasksResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();

  const loadTasks = async () => {
    const result = await driverService.getTasks(true);
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleStartDelivery = async (orderId: string) => {
    const result = await driverService.startDelivery(orderId);
    if (result.success) {
      loadTasks();
    } else {
      Alert.alert("Xatolik", result.error || "Xatolik yuz berdi");
    }
  };

  const handleDeliver = (order: Order) => {
    router.push({
      pathname: "/(driver)/deliver",
      params: { orderId: order.id, orderNumber: order.orderNumber.toString(), totalAmount: order.totalAmount.toString(), bottlesDelivered: order.bottlesDelivered.toString() },
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMap = (locationLink: string) => {
    Linking.openURL(locationLink);
  };

  const handleLogout = () => {
    Alert.alert("Chiqish", "Tizimdan chiqmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Chiqish", style: "destructive", onPress: () => { logout(); router.replace("/(auth)/login"); } },
    ]);
  };

  const renderStats = () => {
    if (!data?.stats) return null;
    const { stats } = data;
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingCount}</Text>
          <Text style={styles.statLabel}>Kutilmoqda</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>{stats.deliveredToday}</Text>
          <Text style={styles.statLabel}>Yetkazildi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.primary }]}>
            {(stats.totalAmountToday / 1000).toFixed(0)}k
          </Text>
          <Text style={styles.statLabel}>Summa</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.bottlesDeliveredToday}</Text>
          <Text style={styles.statLabel}>Idish</Text>
        </View>
      </View>
    );
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.orderAmount}>
          {item.totalAmount.toLocaleString()} so'm
        </Text>
      </View>

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.customerAddress}>{item.customer.address}</Text>
        {item.customer.landmark && (
          <Text style={styles.landmark}>Mo'ljal: {item.customer.landmark}</Text>
        )}
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {item.items.map((orderItem) => (
          <Text key={orderItem.id} style={styles.itemText}>
            {orderItem.product.name} x{orderItem.quantity}
          </Text>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleCall(item.customer.phone1)}
        >
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionText}>Qo'ng'iroq</Text>
        </TouchableOpacity>

        {item.customer.locationLink && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenMap(item.customer.locationLink!)}
          >
            <Text style={styles.actionIcon}>🗺</Text>
            <Text style={styles.actionText}>Xarita</Text>
          </TouchableOpacity>
        )}

        {item.status === "ASSIGNED" && (
          <Button
            title="Yo'lga chiqdim"
            onPress={() => handleStartDelivery(item.id)}
            variant="secondary"
            size="sm"
          />
        )}

        {(item.status === "ASSIGNED" || item.status === "IN_TRANSIT") && (
          <Button
            title="Yetkazdim"
            onPress={() => handleDeliver(item)}
            variant="success"
            size="sm"
          />
        )}
      </View>
    </Card>
  );

  const activeTasks = data?.tasks.filter(
    (t) => t.status === "ASSIGNED" || t.status === "IN_TRANSIT"
  ) || [];
  const deliveredTasks = data?.tasks.filter((t) => t.status === "DELIVERED") || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>Salom, {user?.name} 👋</Text>
          <Text style={styles.companyName}>{user?.company?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      {renderStats()}

      <FlatList
        data={[...activeTasks, ...deliveredTasks]}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              {loading ? "Yuklanmoqda..." : "Hozircha buyurtma yo'q"}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: { fontSize: 18, fontWeight: "700", color: Colors.gray[900] },
  companyName: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 14, color: Colors.danger },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  statLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  orderCard: { padding: 16 },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderNumber: { fontSize: 16, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 },
  orderAmount: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  customerInfo: { marginBottom: 10 },
  customerName: { fontSize: 15, fontWeight: "600", color: Colors.gray[800] },
  customerAddress: { fontSize: 13, color: Colors.gray[600], marginTop: 2 },
  landmark: { fontSize: 12, color: Colors.gray[500], marginTop: 2, fontStyle: "italic" },
  itemsContainer: {
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  itemText: { fontSize: 13, color: Colors.gray[700], marginBottom: 2 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionIcon: { fontSize: 16 },
  actionText: { fontSize: 13, color: Colors.gray[700] },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray[500] },
});
