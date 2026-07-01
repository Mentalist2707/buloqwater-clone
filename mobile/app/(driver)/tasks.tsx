/**
 * Haydovchi vazifalar ekrani (2026 redesign)
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { StatusBadge, Screen } from "@/components/ui";
import { driverService } from "@/services/driver";
import { useAuthStore } from "@/store/auth";
import { openLocation } from "@/utils/maps";
import type { Order, DriverTasksResponse } from "@/types";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

type PaymentOption = "CASH" | "CLICK" | "CREDIT";

export default function DriverTasksScreen() {
  const [data, setData] = useState<DriverTasksResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [deliverModal, setDeliverModal] = useState<Order | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentOption>("CASH");
  const [bottlesReturned, setBottlesReturned] = useState(0);
  const [deliverLoading, setDeliverLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const loadTasks = async () => {
    const result = await driverService.getTasks(true);
    if (result.success && result.data) setData(result.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleStartDelivery = async (orderId: string) => {
    setStartingId(orderId);
    const result = await driverService.startDelivery(orderId);
    setStartingId(null);
    if (result.success) loadTasks();
    else Alert.alert("Xatolik", (result as any).error || "Xatolik yuz berdi");
  };

  const openDeliverModal = (order: Order) => {
    setDeliverModal(order);
    setPaymentType("CASH");
    setBottlesReturned(order.bottlesDelivered);
  };

  const handleDeliver = async () => {
    if (!deliverModal) return;
    setDeliverLoading(true);
    const result = await driverService.deliverOrder({
      orderId: deliverModal.id,
      paymentType,
      bottlesReturned,
    });
    if (result.success) {
      setDeliverModal(null);
      Alert.alert("Muvaffaqiyat!", "Buyurtma yetkazildi!");
      loadTasks();
    } else {
      Alert.alert("Xatolik", (result as any).error || "Xatolik yuz berdi");
    }
    setDeliverLoading(false);
  };

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
  const openMap = (customer: Order["customer"]) => {
    const ok = openLocation({
      locationLink: customer.locationLink,
      address: customer.address,
      latitude: customer.latitude,
      longitude: customer.longitude,
    });
    if (!ok) Alert.alert("Lokatsiya yo'q", "Bu mijoz uchun manzil/koordinata kiritilmagan");
  };

  const handleLogout = () => {
    Alert.alert("Chiqish", "Tizimdan chiqmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "Chiqish",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const isLate = Date.now() - new Date(item.createdAt).getTime() > 7200000;
    const isDelivered = item.status === "DELIVERED";

    return (
      <View style={[styles.orderCard, isLate && !isDelivered && styles.orderCardLate, isDelivered && styles.orderCardDelivered]}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.orderIndex, isLate && !isDelivered && { backgroundColor: theme.danger }]}>
              <Text style={styles.orderIndexText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderCustomerName} numberOfLines={1}>
                {item.customer.name}
              </Text>
              <View style={styles.orderMetaRow}>
                <Text style={styles.orderNumberText}>#{item.orderNumber}</Text>
                {isLate && !isDelivered && (
                  <View style={styles.lateBadge}>
                    <Feather name="clock" size={10} color={theme.danger} />
                    <Text style={styles.lateText}>Kechikmoqda</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.orderHeaderRight}>
            <Text style={styles.orderAmount}>{item.totalAmount.toLocaleString()}</Text>
            <Text style={styles.orderCurrency}>so'm</Text>
            <StatusBadge status={item.status} />
          </View>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={16} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText}>{item.customer.address}</Text>
              {item.customer.landmark && <Text style={styles.landmarkText}>Mo'ljal: {item.customer.landmark}</Text>}
            </View>
          </View>

          <View style={styles.itemsRow}>
            {item.items.map((orderItem) => (
              <View key={orderItem.id} style={styles.itemChip}>
                <Text style={styles.itemChipText}>
                  {orderItem.product.name} ×{orderItem.quantity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {!isDelivered && (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primaryDark }]} onPress={() => handleCall(item.customer.phone1)}>
              <Feather name="phone" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Qo'ng'iroq</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.violet500 }]} onPress={() => openMap(item.customer)}>
              <Feather name="map" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Xarita</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }]} onPress={() => openDeliverModal(item)}>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Yopish</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === "ASSIGNED" && (
          <TouchableOpacity
            style={[styles.startDeliveryBtn, startingId === item.id && { opacity: 0.7 }]}
            onPress={() => handleStartDelivery(item.id)}
            disabled={startingId === item.id}
          >
            {startingId === item.id ? (
              <ActivityIndicator color={theme.primaryDark} />
            ) : (
              <>
                <Ionicons name="car" size={18} color={theme.primaryDark} />
                <Text style={styles.startDeliveryText}>Yo'lga chiqdim</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const activeTasks = data?.tasks.filter((t) => t.status === "ASSIGNED" || t.status === "IN_TRANSIT") || [];
  const deliveredTasks = data?.tasks.filter((t) => t.status === "DELIVERED") || [];
  const allTasks = [...activeTasks, ...deliveredTasks];

  return (
    <Screen>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Buyurtmalar</Text>
          <Text style={styles.greeting}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {data?.stats && (
        <View style={styles.statsRow}>
          <StatBox value={data.stats.pendingCount} label="Kutilmoqda" color={palette.amber500} icon="clock" />
          <StatBox value={data.stats.deliveredToday} label="Yetkazildi" color={theme.success} icon="check-circle" />
          <StatBox
            value={
              data.stats.totalAmountToday >= 1000
                ? `${(data.stats.totalAmountToday / 1000).toFixed(0)}K`
                : String(data.stats.totalAmountToday)
            }
            label="Summa"
            color={theme.primaryDark}
            icon="dollar-sign"
          />
          <StatBox value={data.stats.bottlesDeliveredToday} label="Idish" color={palette.aqua500} icon="droplet" />
        </View>
      )}

      <FlatList
        data={allTasks}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                <View style={styles.emptyIconBox}>
                  <Feather name="check-circle" size={34} color={theme.success} />
                </View>
                <Text style={styles.emptyTitle}>Barcha vazifalar bajarildi!</Text>
                <Text style={styles.emptyText}>Yangi buyurtma tushganda bu yerda ko'rinadi</Text>
              </>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />

      {/* Deliver Modal */}
      <Modal visible={!!deliverModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Buyurtmani yakunlash</Text>
            <Text style={styles.modalSub}>
              {deliverModal?.customer.name} · {deliverModal?.totalAmount.toLocaleString()} so'm
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>To'lov turi</Text>
              <View style={styles.paymentOptions}>
                {[
                  { value: "CASH" as PaymentOption, label: "Naqd", icon: "dollar-sign" as const },
                  { value: "CLICK" as PaymentOption, label: "Click/Payme", icon: "credit-card" as const },
                  { value: "CREDIT" as PaymentOption, label: "Qarz", icon: "book" as const },
                ].map((opt) => {
                  const selected = paymentType === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
                      onPress={() => setPaymentType(opt.value)}
                    >
                      <Feather name={opt.icon} size={22} color={selected ? theme.primaryDark : theme.textSecondary} />
                      <Text style={[styles.paymentOptionText, selected && styles.paymentOptionTextSelected]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {paymentType === "CREDIT" && deliverModal && (
                <View style={styles.creditWarning}>
                  <Feather name="alert-triangle" size={18} color={palette.amber600} />
                  <Text style={styles.creditWarningText}>
                    Mijozning qarziga {deliverModal.totalAmount.toLocaleString()} so'm qo'shiladi
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Qaytarilgan idishlar (berilgan: {deliverModal?.bottlesDelivered})</Text>
              <View style={styles.bottleCounter}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setBottlesReturned(Math.max(0, bottlesReturned - 1))}>
                  <Feather name="minus" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{bottlesReturned}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setBottlesReturned(bottlesReturned + 1)}>
                  <Feather name="plus" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.confirmBtn, deliverLoading && { opacity: 0.6 }]} onPress={handleDeliver} disabled={deliverLoading}>
                {deliverLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Yakunlash</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeliverModal(null)}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function StatBox({
  value,
  label,
  color,
  icon,
}: {
  value: string | number;
  label: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={[styles.statBox, { borderTopColor: color }]}>
      <Feather name={icon} size={14} color={color} />
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  pageTitle: { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.6 },
  greeting: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.semibold, marginTop: 2 },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },

  statsRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.base },
  statBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    gap: 4,
    ...shadow.xs,
  },
  statNum: { fontSize: fontSize.xl, fontWeight: fontWeight.black, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: theme.textSecondary, fontWeight: fontWeight.bold, textTransform: "uppercase" },

  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 100 },

  orderCard: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  orderCardLate: { borderWidth: 1.5, borderColor: palette.rose400 },
  orderCardDelivered: { opacity: 0.6 },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  orderHeaderLeft: { flexDirection: "row", gap: spacing.md, flex: 1 },
  orderIndex: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  orderIndexText: { color: "#fff", fontWeight: fontWeight.black, fontSize: fontSize.lg },
  orderCustomerName: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text, marginBottom: 4 },
  orderMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  orderNumberText: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  lateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.dangerSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  lateText: { fontSize: 10, fontWeight: fontWeight.extrabold, color: theme.danger },
  orderHeaderRight: { alignItems: "flex-end", gap: 4 },
  orderAmount: { fontSize: fontSize.lg, fontWeight: fontWeight.black, color: theme.text, letterSpacing: -0.5 },
  orderCurrency: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.semibold, marginBottom: 4 },

  orderBody: { padding: spacing.base, gap: spacing.md },
  infoRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  addressText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: theme.text, lineHeight: 20 },
  landmarkText: { fontSize: fontSize.xs, color: theme.textSecondary, marginTop: 4, fontStyle: "italic" },

  itemsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  itemChip: {
    backgroundColor: theme.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  itemChipText: { fontSize: fontSize.sm, color: theme.primaryDark, fontWeight: fontWeight.bold },

  actionGrid: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  actionBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.extrabold, color: "#fff" },

  startDeliveryBtn: {
    margin: spacing.md,
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    backgroundColor: theme.primarySoft,
    borderWidth: 1.5,
    borderColor: palette.aqua200,
  },
  startDeliveryText: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: theme.primaryDark },

  empty: { alignItems: "center", paddingTop: 90 },
  emptyIconBox: {
    width: 78,
    height: 78,
    borderRadius: radius["2xl"],
    backgroundColor: theme.successSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text, marginBottom: 6 },
  emptyText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    padding: spacing.xl,
    maxHeight: "90%",
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text, textAlign: "center" },
  modalSub: { fontSize: fontSize.base, color: theme.textSecondary, marginTop: 4, marginBottom: spacing.lg, textAlign: "center", fontWeight: fontWeight.semibold },

  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: theme.textSecondary, marginBottom: spacing.md, marginTop: 4 },

  paymentOptions: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  paymentOptionSelected: { borderColor: theme.primary, backgroundColor: theme.primaryTint },
  paymentOptionText: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  paymentOptionTextSelected: { color: theme.primaryDark, fontWeight: fontWeight.extrabold },

  creditWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: theme.warningSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  creditWarningText: { flex: 1, fontSize: fontSize.sm, color: palette.amber600, fontWeight: fontWeight.semibold },

  bottleCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing["2xl"],
    marginBottom: spacing.xl,
    paddingVertical: spacing.base,
    backgroundColor: theme.bg,
    borderRadius: radius.lg,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.brandSoft,
  },
  counterValue: { fontSize: fontSize["4xl"], fontWeight: fontWeight.black, color: theme.text, minWidth: 48, textAlign: "center", letterSpacing: -1 },

  confirmBtn: {
    paddingVertical: spacing.base,
    backgroundColor: theme.success,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  confirmBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: "#fff" },
  cancelBtn: { paddingVertical: spacing.md, alignItems: "center" },
  cancelBtnText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.bold },
});
