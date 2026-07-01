import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBadge, Button, Screen } from "@/components/ui";
import { ORDER_STATUS_LABELS } from "@/constants";
import { ordersService } from "@/services/orders";
import type { Order, Driver } from "@/types";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const STATUS_FILTERS = ["ALL", "PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED"];

const FILTER_COLORS: Record<string, string> = {
  ALL: theme.primaryDark,
  PENDING: palette.amber500,
  ASSIGNED: palette.violet500,
  IN_TRANSIT: palette.aqua500,
  DELIVERED: palette.mint500,
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [assignModal, setAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const loadOrders = async (pageNum = 1, statusFilter = filter) => {
    const params: Record<string, string> = { page: pageNum.toString(), limit: "20" };
    if (statusFilter !== "ALL") params.status = statusFilter;
    const result = await ordersService.getOrders(params);
    if (result.success && result.data) {
      if (pageNum === 1) setOrders(result.data.items);
      else setOrders((prev) => [...prev, ...result.data!.items]);
      setTotalPages(result.data.totalPages);
      setPage(pageNum);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders(1);
    }, []),
  );

  React.useEffect(() => {
    if (!loading) loadOrders(1);
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages) loadOrders(page + 1);
  };

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
    const result = await ordersService.assignDriver(selectedOrder.id, driverId);
    if (result.success) {
      Alert.alert("Tayyor!", `${driverName}ga biriktirildi`);
      setAssignModal(false);
      loadOrders(1);
    } else {
      Alert.alert("Xatolik", result.error || "Xatolik yuz berdi");
    }
    setAssignLoading(false);
  };

  const visibleOrders = search.trim()
    ? orders.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          o.customer.phone1.includes(search) ||
          String(o.orderNumber).includes(search),
      )
    : orders;

  const renderOrder = ({ item }: { item: Order }) => {
    const totalQty = item.items.reduce((sum, i) => sum + i.quantity, 0);
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.orderAmount}>{item.totalAmount.toLocaleString()} so'm</Text>
        </View>

        <View style={styles.customerBlock}>
          <Text style={styles.customerName}>{item.customer.name}</Text>
          <Text style={styles.customerPhone}>{item.customer.phone1}</Text>
          <View style={styles.infoLine}>
            <Feather name="map-pin" size={13} color={theme.textSecondary} />
            <Text style={styles.customerAddress} numberOfLines={2}>
              {item.customer.address}
            </Text>
          </View>
          {item.customer.landmark && <Text style={styles.landmark}>Mo'ljal: {item.customer.landmark}</Text>}
        </View>

        <View style={styles.itemsDivider} />

        <View style={styles.itemsRow}>
          {item.items.map((oi, i) => (
            <Text key={i} style={styles.itemChip}>
              {oi.product.name} ×{oi.quantity}
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.bottleBox}>
            <Feather name="droplet" size={13} color={theme.textSecondary} />
            <Text style={styles.bottleLabel}>Idish: {totalQty} ta</Text>
          </View>
          {item.driver && (
            <View style={styles.driverContainer}>
              <Feather name="truck" size={13} color={theme.primaryDark} />
              <Text style={styles.driverInfo}>{item.driver.name}</Text>
            </View>
          )}
        </View>

        {item.status === "PENDING" && (
          <Button title="Haydovchi biriktirish" onPress={() => handleAssign(item)} size="sm" icon={<Feather name="user-plus" size={15} color="#fff" />} />
        )}
      </View>
    );
  };

  return (
    <Screen>
      {/* Header */}
      <View style={[styles.headerPanel, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.pageTitle}>Buyurtmalar</Text>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput
            placeholder="Ism, telefon yoki raqam..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={{ marginBottom: spacing.md }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.filterListContainer}
          renderItem={({ item }) => {
            const isActive = filter === item;
            const color = FILTER_COLORS[item] || theme.primaryDark;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive ? { backgroundColor: color, borderColor: color } : { borderColor: theme.border }]}
                onPress={() => setFilter(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : theme.textSecondary }]}>
                  {item === "ALL" ? "Hammasi" : ORDER_STATUS_LABELS[item] || item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={visibleOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                <View style={styles.emptyIconBox}>
                  <Feather name="inbox" size={34} color={theme.primary} />
                </View>
                <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
              </>
            )}
          </View>
        }
      />

      {/* Assign Modal */}
      <Modal visible={assignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Haydovchini tanlang</Text>
            <Text style={styles.modalSub}>
              Buyurtma #{selectedOrder?.orderNumber} · {selectedOrder?.customer.name}
            </Text>

            {driversLoading ? (
              <View style={{ paddingVertical: 40 }}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : drivers.length === 0 ? (
              <Text style={styles.modalEmpty}>Haydovchilar topilmadi</Text>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(i) => i.id}
                style={{ maxHeight: 340 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const load = item.activeOrdersCount;
                  const color = load === 0 ? theme.success : load <= 3 ? theme.primary : theme.warning;
                  return (
                    <TouchableOpacity style={styles.driverRow} onPress={() => confirmAssign(item.id, item.name)} disabled={assignLoading}>
                      <View style={[styles.driverAvatar, { backgroundColor: color + "18" }]}>
                        <Text style={[styles.driverAvatarText, { color }]}>{item.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.driverName}>{item.name}</Text>
                        <Text style={styles.driverPhone}>{item.phone}</Text>
                      </View>
                      <View style={[styles.driverBadge, { backgroundColor: color + "14" }]}>
                        <Text style={[styles.driverBadgeText, { color }]}>{load === 0 ? "Bo'sh" : `${load} ta`}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border }} />}
              />
            )}

            <Button title="Yopish" onPress={() => setAssignModal(false)} variant="outline" style={{ marginTop: spacing.base }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerPanel: { paddingHorizontal: spacing.lg, paddingBottom: spacing.base, gap: spacing.md },
  pageTitle: { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.6 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    height: 50,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  searchInput: { flex: 1, fontSize: fontSize.base, color: theme.text, fontWeight: fontWeight.medium },

  filterListContainer: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.base,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: theme.surface,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 110 },
  orderCard: {
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  orderNumber: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text },
  orderAmount: { fontSize: fontSize.lg, fontWeight: fontWeight.black, color: theme.primaryDark, letterSpacing: -0.5 },

  customerBlock: { gap: 5, marginBottom: spacing.md },
  customerName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  customerPhone: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  infoLine: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 2 },
  customerAddress: { flex: 1, fontSize: fontSize.base, color: theme.textSecondary, lineHeight: 20 },
  landmark: { fontSize: fontSize.sm, color: theme.textSecondary, fontStyle: "italic", marginLeft: 19, fontWeight: fontWeight.medium },

  itemsDivider: { height: 1, backgroundColor: theme.border, marginVertical: spacing.md },
  itemsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  itemChip: {
    fontSize: fontSize.sm,
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    color: theme.textSecondary,
    fontWeight: fontWeight.semibold,
    overflow: "hidden",
  },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  bottleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  bottleLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.textSecondary },
  driverContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  driverInfo: { fontSize: fontSize.sm, color: theme.primaryDark, fontWeight: fontWeight.bold },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 90 },
  emptyIconBox: {
    width: 78,
    height: 78,
    borderRadius: radius["2xl"],
    backgroundColor: theme.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  emptyText: { fontSize: fontSize.md, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    padding: spacing.xl,
    maxHeight: "85%",
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text },
  modalSub: { fontSize: fontSize.base, color: theme.textSecondary, marginTop: 4, marginBottom: spacing.lg, fontWeight: fontWeight.semibold },
  modalEmpty: { textAlign: "center", color: theme.textMuted, paddingVertical: 40, fontSize: fontSize.base, fontWeight: fontWeight.semibold },

  driverRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.base, gap: spacing.md },
  driverAvatar: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  driverAvatarText: { fontWeight: fontWeight.extrabold, fontSize: fontSize.lg },
  driverName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },
  driverPhone: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold, marginTop: 2 },
  driverBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md },
  driverBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.extrabold },
});
