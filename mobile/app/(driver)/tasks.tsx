/**
 * Haydovchi vazifalar ekrani
 * Web: /driver/tasks — buyurtma kartalar, qo'ng'iroq/xarita/yopish tugmalari
 * Mobile xususiyatlar: stats bar, "Yo'lga chiqdim" tugmasi, kechikkan highlight
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
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Card, StatusBadge, Button } from "@/components/ui";
import { Colors } from "@/constants";
import { driverService } from "@/services/driver";
import { useAuthStore } from "@/store/auth";
import type { Order, DriverTasksResponse } from "@/types";
import { PAYMENT_TYPE_LABELS } from "@/constants";

type PaymentOption = "CASH" | "CLICK" | "CREDIT";

export default function DriverTasksScreen() {
  const [data, setData] = useState<DriverTasksResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();

  // Inline deliver modal (web drawer kabi)
  const [deliverModal, setDeliverModal] = useState<Order | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentOption>("CASH");
  const [bottlesReturned, setBottlesReturned] = useState(0);
  const [deliverLoading, setDeliverLoading] = useState(false);

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
      Alert.alert("Xatolik", (result as any).error || "Xatolik yuz berdi");
    }
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
      Alert.alert("✅ Muvaffaqiyat!", "Buyurtma yetkazildi!");
      loadTasks();
    } else {
      Alert.alert("Xatolik", (result as any).error || "Xatolik yuz berdi");
    }
    setDeliverLoading(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMap = (locationLink: string | null | undefined, address: string) => {
    const url = locationLink || `https://yandex.uz/maps/?text=${encodeURIComponent(address)}`;
    Linking.openURL(url);
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
            {stats.totalAmountToday >= 1000
              ? `${(stats.totalAmountToday / 1000).toFixed(0)}K`
              : stats.totalAmountToday}
          </Text>
          <Text style={styles.statLabel}>Summa</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.bottlesDeliveredToday}</Text>
          <Text style={styles.statLabel}>🫙 Idish</Text>
        </View>
      </View>
    );
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const isLate =
      Date.now() - new Date(item.createdAt).getTime() > 7200000; // 2 soat
    const isDelivered = item.status === "DELIVERED";

    return (
      <View
        style={[
          styles.orderCard,
          isLate && !isDelivered && styles.orderCardLate,
          isDelivered && styles.orderCardDelivered,
        ]}
      >
        {/* Header */}
        <View style={[styles.orderTop, isLate && !isDelivered ? styles.orderTopLate : styles.orderTopNormal]}>
          <View style={styles.orderTopLeft}>
            <View
              style={[
                styles.orderIndex,
                { backgroundColor: isLate && !isDelivered ? Colors.danger : Colors.primary },
              ]}
            >
              <Text style={styles.orderIndexText}>{index + 1}</Text>
            </View>
            <View>
              <Text style={styles.orderCustomerName}>{item.customer.name}</Text>
              <Text style={styles.orderNumberText}>
                #{item.orderNumber}{isLate && !isDelivered ? " · ⚠️ Kechikmoqda" : ""}
              </Text>
            </View>
          </View>
          <View style={styles.orderTopRight}>
            <Text style={styles.orderAmount}>{item.totalAmount.toLocaleString()} so'm</Text>
            <StatusBadge status={item.status} />
          </View>
        </View>

        {/* Info */}
        <View style={styles.orderBody}>
          {/* Manzil */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText}>{item.customer.address}</Text>
              {item.customer.landmark ? (
                <Text style={styles.landmarkText}>Mo'ljal: {item.customer.landmark}</Text>
              ) : null}
            </View>
          </View>

          {/* Mahsulotlar */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📦</Text>
            <View style={styles.itemsWrap}>
              {item.items.map((orderItem) => (
                <View key={orderItem.id} style={styles.itemChip}>
                  <Text style={styles.itemChipText}>
                    {orderItem.product.name} ×{orderItem.quantity}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action buttons — web bilan bir xil 3 ta katta tugma */}
        {!isDelivered && (
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnCall]}
              onPress={() => handleCall(item.customer.phone1)}
            >
              <Text style={styles.actionBtnIcon}>📞</Text>
              <Text style={styles.actionBtnText}>Qo'ng'iroq</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnMap]}
              onPress={() => handleOpenMap(item.customer.locationLink, item.customer.address)}
            >
              <Text style={styles.actionBtnIcon}>🗺️</Text>
              <Text style={styles.actionBtnText}>
                {item.customer.locationLink ? "Xarita" : "Manzil"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDeliver]}
              onPress={() => openDeliverModal(item)}
            >
              <Text style={styles.actionBtnIcon}>✅</Text>
              <Text style={styles.actionBtnText}>Yopish</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* "Yo'lga chiqdim" tugmasi — faqat ASSIGNED holatida */}
        {item.status === "ASSIGNED" && (
          <TouchableOpacity
            style={styles.startDeliveryBtn}
            onPress={() => handleStartDelivery(item.id)}
          >
            <Text style={styles.startDeliveryText}>🚛 Yo'lga chiqdim</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const activeTasks =
    data?.tasks.filter((t) => t.status === "ASSIGNED" || t.status === "IN_TRANSIT") || [];
  const deliveredTasks = data?.tasks.filter((t) => t.status === "DELIVERED") || [];
  const allTasks = [...activeTasks, ...deliveredTasks];

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
        data={allTasks}
        renderItem={({ item, index }) => renderOrder({ item, index })}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <Text style={styles.emptyText}>Yuklanmoqda...</Text>
            ) : (
              <>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyTitle}>Barcha vazifalar bajarildi!</Text>
                <Text style={styles.emptyText}>Yangi buyurtma tushganda bu yerda ko'rinadi</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={loadTasks}>
                  <Text style={styles.refreshBtnText}>Yangilash</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      />

      {/* Deliver Modal — web drawer kabi */}
      <Modal
        visible={!!deliverModal}
        animationType="slide"
        transparent
        onRequestClose={() => setDeliverModal(null)}
      >
        <View style={styles.deliverOverlay}>
          <TouchableOpacity
            style={styles.deliverBackdrop}
            onPress={() => setDeliverModal(null)}
          />
          <View style={styles.deliverSheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.deliverHeader}>
                <Text style={styles.deliverTitle}>Buyurtmani yakunlash</Text>
                <Text style={styles.deliverSub}>
                  {deliverModal?.customer.name} · {deliverModal?.totalAmount.toLocaleString()} so'm
                </Text>
              </View>

              {/* To'lov turi */}
              <Text style={styles.deliverSectionTitle}>To'lov turi</Text>
              <View style={styles.paymentOptions}>
                {([
                  { value: "CASH" as PaymentOption, label: "Naqd", icon: "💵" },
                  { value: "CLICK" as PaymentOption, label: "Click/Payme", icon: "📱" },
                  { value: "CREDIT" as PaymentOption, label: "Qarz", icon: "📝" },
                ]).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.paymentOption,
                      paymentType === opt.value && styles.paymentOptionSelected,
                    ]}
                    onPress={() => setPaymentType(opt.value)}
                  >
                    <Text style={styles.paymentOptionIcon}>{opt.icon}</Text>
                    <Text
                      style={[
                        styles.paymentOptionText,
                        paymentType === opt.value && styles.paymentOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Qarz ogohlantirish */}
              {paymentType === "CREDIT" && deliverModal && (
                <View style={styles.creditWarning}>
                  <Text style={styles.creditWarningText}>
                    ⚠️ Mijozning qarziga {deliverModal.totalAmount.toLocaleString()} so'm qo'shiladi
                  </Text>
                </View>
              )}

              {/* Qaytarilgan idishlar */}
              <Text style={styles.deliverSectionTitle}>
                Qaytarilgan baxlalar{" "}
                <Text style={styles.deliverSectionSub}>
                  (berilgan: {deliverModal?.bottlesDelivered})
                </Text>
              </Text>
              <View style={styles.bottleCounter}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setBottlesReturned(Math.max(0, bottlesReturned - 1))}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{bottlesReturned}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setBottlesReturned(bottlesReturned + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Yakunlash */}
              <TouchableOpacity
                style={[styles.confirmBtn, deliverLoading && styles.confirmBtnDisabled]}
                onPress={handleDeliver}
                disabled={deliverLoading}
              >
                <Text style={styles.confirmBtnText}>
                  {deliverLoading ? "Yakunlanmoqda..." : "✅ Yakunlash"}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Stats
  statsContainer: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
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
  statLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 2, textAlign: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  // Order card
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  orderCardLate: { borderWidth: 2, borderColor: Colors.danger + "60" },
  orderCardDelivered: { opacity: 0.7 },
  orderTop: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderTopNormal: { backgroundColor: Colors.gray[50] },
  orderTopLate: { backgroundColor: "#FEF2F2" },
  orderTopLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  orderIndex: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  orderIndexText: { color: Colors.white, fontWeight: "800", fontSize: 16 },
  orderCustomerName: { fontSize: 15, fontWeight: "700", color: Colors.gray[900] },
  orderNumberText: { fontSize: 12, color: Colors.gray[500], marginTop: 1 },
  orderTopRight: { alignItems: "flex-end", gap: 4 },
  orderAmount: { fontSize: 15, fontWeight: "700", color: Colors.gray[900] },
  orderBody: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIcon: { fontSize: 18, marginTop: 1 },
  addressText: { fontSize: 15, fontWeight: "500", color: Colors.gray[900] },
  landmarkText: { fontSize: 13, color: Colors.gray[500], marginTop: 2, fontStyle: "italic" },
  itemsWrap: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  itemChip: { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  itemChipText: { fontSize: 13, color: "#1D4ED8", fontWeight: "600" },
  // Action buttons — 3 ta katta tugma (web bilan bir xil)
  actionGrid: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingBottom: 12 },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, gap: 4 },
  actionBtnCall: { backgroundColor: "#3B82F6" },
  actionBtnMap: { backgroundColor: "#8B5CF6" },
  actionBtnDeliver: { backgroundColor: "#22C55E" },
  actionBtnIcon: { fontSize: 22 },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: Colors.white },
  // Yo'lga chiqdim
  startDeliveryBtn: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  startDeliveryText: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
  // Empty
  empty: { alignItems: "center", paddingTop: 80, paddingBottom: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.gray[500] },
  refreshBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 },
  refreshBtnText: { color: Colors.white, fontSize: 15, fontWeight: "600" },
  // Deliver Modal
  deliverOverlay: { flex: 1, justifyContent: "flex-end" },
  deliverBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  deliverSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    maxHeight: "85%",
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray[300], borderRadius: 2, alignSelf: "center", marginVertical: 12 },
  deliverHeader: { alignItems: "center", marginBottom: 24 },
  deliverTitle: { fontSize: 18, fontWeight: "700", color: Colors.gray[900] },
  deliverSub: { fontSize: 14, color: Colors.gray[500], marginTop: 4 },
  deliverSectionTitle: { fontSize: 14, fontWeight: "600", color: Colors.gray[700], marginBottom: 12 },
  deliverSectionSub: { fontSize: 13, color: Colors.gray[400], fontWeight: "400" },
  paymentOptions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  paymentOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  paymentOptionIcon: { fontSize: 26, marginBottom: 6 },
  paymentOptionText: { fontSize: 12, color: Colors.gray[600], fontWeight: "600" },
  paymentOptionTextSelected: { color: Colors.primaryDark, fontWeight: "700" },
  creditWarning: {
    backgroundColor: Colors.warningLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  creditWarningText: { fontSize: 13, color: Colors.gray[700] },
  bottleCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginBottom: 28,
    paddingVertical: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 14,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.gray[200],
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: { fontSize: 26, fontWeight: "700", color: Colors.gray[700] },
  counterValue: { fontSize: 36, fontWeight: "800", color: Colors.gray[900], minWidth: 48, textAlign: "center" },
  confirmBtn: {
    paddingVertical: 18,
    backgroundColor: Colors.success,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: { backgroundColor: Colors.success + "80" },
  confirmBtnText: { fontSize: 18, fontWeight: "700", color: Colors.white },
});
