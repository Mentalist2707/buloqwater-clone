import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Input, Card } from "@/components/ui";
import { Colors, PAYMENT_TYPE_LABELS } from "@/constants";
import { driverService } from "@/services/driver";

type PaymentOption = "CASH" | "CLICK" | "CREDIT";

export default function DeliverScreen() {
  const params = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    totalAmount: string;
    bottlesDelivered: string;
  }>();

  const [paymentType, setPaymentType] = useState<PaymentOption | null>(null);
  const [bottlesReturned, setBottlesReturned] = useState("0");
  const [loading, setLoading] = useState(false);

  const handleDeliver = async () => {
    if (!paymentType) {
      Alert.alert("Diqqat", "To'lov turini tanlang");
      return;
    }

    const returned = parseInt(bottlesReturned) || 0;
    const delivered = parseInt(params.bottlesDelivered || "0");

    if (returned > delivered) {
      Alert.alert("Xatolik", "Qaytarilgan idish soni yetkazilgandan ko'p bo'lishi mumkin emas");
      return;
    }

    Alert.alert(
      "Tasdiqlash",
      `Buyurtma #${params.orderNumber}\nTo'lov: ${PAYMENT_TYPE_LABELS[paymentType]}\nQaytarilgan idish: ${returned}`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Tasdiqlash",
          onPress: async () => {
            setLoading(true);
            const result = await driverService.deliverOrder({
              orderId: params.orderId!,
              paymentType,
              bottlesReturned: returned,
            });

            if (result.success) {
              Alert.alert("Muvaffaqiyat!", "Buyurtma yetkazildi", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } else {
              Alert.alert("Xatolik", result.error || "Xatolik yuz berdi");
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Order Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.orderLabel}>Buyurtma</Text>
        <Text style={styles.orderNumber}>#{params.orderNumber}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Summa:</Text>
          <Text style={styles.infoValue}>
            {parseInt(params.totalAmount || "0").toLocaleString()} so'm
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Yetkazilgan idish:</Text>
          <Text style={styles.infoValue}>{params.bottlesDelivered} dona</Text>
        </View>
      </Card>

      {/* Payment Type */}
      <Text style={styles.sectionTitle}>To'lov turi</Text>
      <View style={styles.paymentOptions}>
        {(["CASH", "CLICK", "CREDIT"] as PaymentOption[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.paymentOption,
              paymentType === type && styles.paymentSelected,
            ]}
            onPress={() => setPaymentType(type)}
            activeOpacity={0.7}
          >
            <Text style={styles.paymentIcon}>
              {type === "CASH" ? "💵" : type === "CLICK" ? "💳" : "📝"}
            </Text>
            <Text
              style={[
                styles.paymentText,
                paymentType === type && styles.paymentTextSelected,
              ]}
            >
              {PAYMENT_TYPE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentType === "CREDIT" && (
        <View style={styles.creditWarning}>
          <Text style={styles.creditWarningText}>
            ⚠️ Mijozning qarziga {parseInt(params.totalAmount || "0").toLocaleString()} so'm qo'shiladi
          </Text>
        </View>
      )}

      {/* Bottles Returned */}
      <Text style={styles.sectionTitle}>Qaytarilgan idish soni</Text>
      <View style={styles.bottleCounter}>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => {
            const val = Math.max(0, parseInt(bottlesReturned) - 1);
            setBottlesReturned(val.toString());
          }}
        >
          <Text style={styles.counterBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{bottlesReturned}</Text>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => {
            const val = parseInt(bottlesReturned) + 1;
            setBottlesReturned(val.toString());
          }}
        >
          <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <Button
        title="Buyurtmani yetkazdim"
        onPress={handleDeliver}
        loading={loading}
        variant="success"
        size="lg"
        style={styles.submitBtn}
        disabled={!paymentType}
      />

      <Button
        title="Bekor qilish"
        onPress={() => router.back()}
        variant="outline"
        size="md"
        style={styles.cancelBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  infoCard: { padding: 20, marginBottom: 24 },
  orderLabel: { fontSize: 13, color: Colors.gray[500] },
  orderNumber: { fontSize: 28, fontWeight: "800", color: Colors.gray[900], marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  infoLabel: { fontSize: 14, color: Colors.gray[600] },
  infoValue: { fontSize: 14, fontWeight: "600", color: Colors.gray[900] },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray[800],
    marginBottom: 12,
  },
  paymentOptions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  paymentSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  paymentIcon: { fontSize: 24, marginBottom: 4 },
  paymentText: { fontSize: 13, color: Colors.gray[600], fontWeight: "500" },
  paymentTextSelected: { color: Colors.primaryDark, fontWeight: "700" },
  creditWarning: {
    backgroundColor: Colors.warningLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  creditWarningText: { fontSize: 13, color: Colors.gray[700] },
  bottleCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: { fontSize: 24, fontWeight: "700", color: Colors.gray[700] },
  counterValue: { fontSize: 32, fontWeight: "800", color: Colors.gray[900], minWidth: 40, textAlign: "center" },
  submitBtn: { marginBottom: 12 },
  cancelBtn: {},
});
