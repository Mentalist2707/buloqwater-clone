/**
 * Admin (Director) buyurtmalar sahifasi (2026 redesign)
 */
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
  TextInput,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBadge, Button, Screen } from "@/components/ui";
import { ORDER_STATUS_LABELS } from "@/constants";
import { ordersService } from "@/services/orders";
import type { Order, Driver } from "@/types";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const STATUS_FILTERS = ["ALL", "PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
type DateFilter = "ALL" | "TODAY" | "YESTERDAY" | "WEEK";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "ALL", label: "Barchasi" },
  { key: "TODAY", label: "Bugun" },
  { key: "YESTERDAY", label: "Kecha" },
  { key: "WEEK", label: "Hafta" },
];

const FILTER_COLORS: Record<string, string> = {
  ALL: theme.primaryDark,
  PENDING: palette.amber500,
  ASSIGNED: palette.violet500,
  IN_TRANSIT: palette.aqua500,
  DELIVERED: palette.mint500,
  CANCELLED: palette.rose500,
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
    }, [statusFilter]),
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
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
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
      result = result.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone1.includes(q) ||
          String(o.orderNumber).includes(q),
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
      Alert.alert("Tayyor!", `${driverName}ga biriktirildi`);
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
      <View style={[styles.orderCard, isUrgent && styles.orderCardUrgent, isNew && styles.orderCardNew]}>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Feather name="alert-triangle" size={10} color={theme.danger} />
                  <Text style={styles.urgentText}>Kechikkan</Text>
                </View>
              )}
              {isNew && (
                <View style={styles.newBadge}>
                  <Feather name="zap" size={10} color={theme.success} />
                  <Text style={styles.newText}>Yangi</Text>
                </View>
              )}
            </View>
            <View style={styles.badgeRow}>
              <StatusBadge status={item.status} />
              {pendingTime && (
                <View style={styles.tickerBadge}>
                  <Feather name="clock" size={11} color={isUrgent ? theme.danger : palette.amber600} />
                  <Text style={[styles.pendingTime, isUrgent && { color: theme.danger }]}>{pendingTime}</Text>
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
            <Feather name="map-pin" size={13} color={theme.textSecondary} />
            <Text style={styles.customerAddress} numberOfLines={2}>
              {item.customer.address}
            </Text>
          </View>
          {item.customer.landmark ? <Text style={styles.landmark}>Mo'ljal: {item.customer.landmark}</Text> : null}
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

      {/* Status filters */}
      <View style={{ marginBottom: spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.filterListContainer}
          renderItem={({ item }) => {
            const isActive = statusFilter === item;
            const color = FILTER_COLORS[item] || theme.primaryDark;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive ? { backgroundColor: color, borderColor: color } : { borderColor: theme.border }]}
                onPress={() => setStatusFilter(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: isActive ? "#FFF" : theme.textSecondary }]}>
                  {item === "ALL" ? "Barchasi" : ORDER_STATUS_LABELS[item] || item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Date filters */}
      <View style={styles.dateFilterRow}>
        {DATE_FILTERS.map((df) => (
          <TouchableOpacity
            key={df.key}
            style={[styles.dateChip, dateFilter === df.key && styles.dateChipActive]}
            onPress={() => setDateFilter(df.key)}
          >
            <Text style={[styles.dateChipText, dateFilter === df.key && styles.dateChipTextActive]}>{df.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {(dateFilter !== "ALL" || search) && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>{filtered.length} ta buyurtma topildi</Text>
          <TouchableOpacity
            onPress={() => {
              setDateFilter("ALL");
              setSearch("");
            }}
          >
            <Text style={styles.clearText}>Tozalash</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        renderItem={renderOrder}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
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
                <Text style={styles.emptyText}>Buyurtmalar mavjud emas</Text>
              </>
            )}
          </View>
        }
      />

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
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: theme.surface,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  dateFilterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: theme.surface,
    padding: 4,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  dateChip: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: radius.sm },
  dateChipActive: { backgroundColor: theme.primary },
  dateChipText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.bold },
  dateChipTextActive: { color: "#fff" },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: theme.primaryTint,
    borderRadius: radius.md,
  },
  resultText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.bold },
  clearText: { fontSize: fontSize.sm, color: theme.primaryDark, fontWeight: fontWeight.extrabold },

  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 110 },
  orderCard: {
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    borderLeftWidth: 4,
    borderLeftColor: theme.border,
    ...shadow.sm,
  },
  orderCardUrgent: { borderLeftColor: theme.danger },
  orderCardNew: { borderLeftColor: theme.success },

  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  orderNumberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  orderNumber: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  urgentBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: theme.dangerSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  urgentText: { fontSize: 10, fontWeight: fontWeight.extrabold, color: theme.danger },
  newBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: theme.successSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  newText: { fontSize: 10, fontWeight: fontWeight.extrabold, color: theme.success },
  tickerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.warningSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  pendingTime: { fontSize: fontSize.xs, color: palette.amber600, fontWeight: fontWeight.bold },
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
  bottleBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  bottleLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.textSecondary },
  driverContainer: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  driverInfo: { fontSize: fontSize.sm, color: theme.primaryDark, fontWeight: fontWeight.bold },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 90 },
  emptyIconBox: { width: 78, height: 78, borderRadius: radius["2xl"], backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.base },
  emptyText: { fontSize: fontSize.md, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], padding: spacing.xl, maxHeight: "85%" },
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
