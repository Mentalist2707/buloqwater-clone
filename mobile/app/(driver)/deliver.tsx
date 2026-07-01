/**
 * Haydovchi — Buyurtmani yetkazishni yakunlash (2026 redesign)
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Alert } from "@/utils/alert";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button, Header, Screen } from "@/components/ui";
import { PAYMENT_TYPE_LABELS } from "@/constants";
import { driverService } from "@/services/driver";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

type PaymentOption = "CASH" | "CLICK" | "CREDIT";

const PAYMENT_ICONS: Record<PaymentOption, keyof typeof Feather.glyphMap> = {
  CASH: "dollar-sign",
  CLICK: "credit-card",
  CREDIT: "book",
};

export default function DeliverScreen() {
  const params = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    totalAmount: string;
    bottlesDelivered: string;
  }>();

  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId || "";
  const orderNumber = Array.isArray(params.orderNumber) ? params.orderNumber[0] : params.orderNumber || "0";
  const totalAmount = Array.isArray(params.totalAmount) ? params.totalAmount[0] : params.totalAmount || "0";
  const bottlesDelivered = Array.isArray(params.bottlesDelivered) ? params.bottlesDelivered[0] : params.bottlesDelivered || "0";

  const [paymentType, setPaymentType] = useState<PaymentOption | null>(null);
  const [bottlesReturned, setBottlesReturned] = useState("0");
  const [loading, setLoading] = useState(false);

  const handleDeliver = async () => {
    if (!paymentType) {
      Alert.alert("Diqqat", "To'lov turini tanlang");
      return;
    }
    const returned = parseInt(bottlesReturned) || 0;
    const delivered = parseInt(bottlesDelivered);
    if (returned > delivered) {
      Alert.alert("Xatolik", "Qaytarilgan idish soni yetkazilgandan ko'p bo'lishi mumkin emas");
      return;
    }
    Alert.alert(
      "Tasdiqlash",
      `Buyurtma #${orderNumber}\nTo'lov: ${PAYMENT_TYPE_LABELS[paymentType]}\nQaytarilgan idish: ${returned}`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Tasdiqlash",
          onPress: async () => {
            setLoading(true);
            const result = await driverService.deliverOrder({ orderId, paymentType, bottlesReturned: returned });
            if (result.success) {
              Alert.alert("Muvaffaqiyat!", "Buyurtma yetkazildi", [{ text: "OK", onPress: () => router.back() }]);
            } else {
              Alert.alert("Xatolik", result.error || "Xatolik yuz berdi");
            }
            setLoading(false);
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Header title={`Buyurtma #${orderNumber}`} subtitle="Yetkazishni yakunlash" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <View style={styles.orderCard}>
          <View style={styles.statRow}>
            <View style={styles.statLabelRow}>
              <Feather name="dollar-sign" size={15} color={theme.textSecondary} />
              <Text style={styles.statLabel}>To'lov summasi</Text>
            </View>
            <Text style={styles.statValue}>{parseInt(totalAmount).toLocaleString()} so'm</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={styles.statLabelRow}>
              <Feather name="droplet" size={15} color={theme.textSecondary} />
              <Text style={styles.statLabel}>Yetkazilgan idish</Text>
            </View>
            <Text style={styles.statValue}>{bottlesDelivered} dona</Text>
          </View>
        </View>

        {/* Payment */}
        <Text style={styles.sectionTitle}>To'lov turini tanlang</Text>
        <View style={styles.paymentGrid}>
          {(["CASH", "CLICK", "CREDIT"] as PaymentOption[]).map((type) => {
            const selected = paymentType === type;
            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.85}
                onPress={() => setPaymentType(type)}
                style={[styles.paymentCard, selected && styles.paymentCardSelected]}
              >
                <Feather name={PAYMENT_ICONS[type]} size={22} color={selected ? theme.primaryDark : theme.textSecondary} />
                <Text style={[styles.paymentName, selected && styles.paymentNameSelected]}>{PAYMENT_TYPE_LABELS[type]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {paymentType === "CREDIT" && (
          <View style={styles.warningCard}>
            <Feather name="alert-triangle" size={18} color={palette.amber600} />
            <Text style={styles.warningText}>
              {parseInt(totalAmount).toLocaleString()} so'm mijoz qarziga qo'shiladi.
            </Text>
          </View>
        )}

        {/* Counter */}
        <Text style={styles.sectionTitle}>Qaytarilgan idish</Text>
        <View style={styles.counterCard}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setBottlesReturned(String(Math.max(0, parseInt(bottlesReturned) - 1)))}
          >
            <Feather name="minus" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.counterNumber}>{bottlesReturned}</Text>
            <Text style={styles.counterLabel}>dona</Text>
          </View>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setBottlesReturned(String(parseInt(bottlesReturned) + 1))}>
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <Button title="Yetkazishni yakunlash" onPress={handleDeliver} loading={loading} disabled={!paymentType} size="lg" />

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Bekor qilish</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  orderCard: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statLabel: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium },
  statValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: spacing.base },

  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing.base, color: theme.text },

  paymentGrid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  paymentCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderWidth: 2,
    borderColor: theme.border,
  },
  paymentCardSelected: { borderColor: theme.primary, backgroundColor: theme.primaryTint },
  paymentName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary },
  paymentNameSelected: { color: theme.primaryDark, fontWeight: fontWeight.bold },

  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: theme.warningSoft,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  warningText: { flex: 1, color: palette.amber600, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  counterCard: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.brandSoft,
  },
  counterNumber: { fontSize: fontSize["4xl"], fontWeight: fontWeight.black, textAlign: "center", color: theme.text },
  counterLabel: { textAlign: "center", color: theme.textSecondary, fontWeight: fontWeight.medium },

  cancelButton: { marginTop: spacing.base, alignItems: "center" },
  cancelText: { color: theme.textSecondary, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
});
