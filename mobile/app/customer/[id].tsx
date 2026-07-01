/**
 * Mijoz tafsilotlari — director/operator uchun.
 * ────────────────────────────────────────────────────────────
 * Mijozning barcha manzillari, idish/qarz qoldig'i, buyurtmalar tarixi
 * va statistikasi. Ro'yxatdan mijoz ustiga bosilganda ochiladi.
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Alert } from "@/utils/alert";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { customersService, type CustomerDetail } from "@/services/customers";
import { openLocation } from "@/utils/maps";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_TYPE_LABELS } from "@/constants";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await customersService.getCustomerDetail(id);
    if (res.success && res.data) setData(res.data);
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);
  const openMap = (a: { locationLink?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null }) => {
    const ok = openLocation({ locationLink: a.locationLink, address: a.address, latitude: a.latitude, longitude: a.longitude });
    if (!ok) Alert.alert("Lokatsiya yo'q", "Bu manzil uchun koordinata yo'q");
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mijoz</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.muted}>Mijoz topilmadi</Text>
        </View>
      </Screen>
    );
  }

  const { customer, addresses, orders, stats } = data;

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {customer.name}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}
      >
        {/* Profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{customer.name}</Text>
          {customer.hasAppAccount && (
            <View style={styles.appBadge}>
              <Feather name="smartphone" size={11} color={theme.success} />
              <Text style={styles.appBadgeText}>Ilovada ro'yxatdan o'tgan</Text>
            </View>
          )}
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.phoneChip} onPress={() => call(customer.phone1)} activeOpacity={0.8}>
              <Feather name="phone" size={14} color={theme.primaryDark} />
              <Text style={styles.phoneText}>{customer.phone1}</Text>
            </TouchableOpacity>
            {customer.phone2 && (
              <TouchableOpacity style={styles.phoneChip} onPress={() => call(customer.phone2!)} activeOpacity={0.8}>
                <Feather name="phone" size={14} color={theme.primaryDark} />
                <Text style={styles.phoneText}>{customer.phone2}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Qoldiq / statistika */}
        <View style={styles.statsRow}>
          <StatCard
            icon="droplet"
            value={`${customer.bottleBalance}`}
            label="Idish qoldiq"
            color={customer.bottleBalance > 0 ? theme.warning : theme.textSecondary}
          />
          <StatCard
            icon="credit-card"
            value={customer.debtBalance > 0 ? `${(customer.debtBalance / 1000).toFixed(0)}K` : "0"}
            label="Qarz (so'm)"
            color={customer.debtBalance > 0 ? theme.danger : theme.success}
          />
          <StatCard icon="package" value={`${stats.totalOrders}`} label="Buyurtma" color={theme.primaryDark} />
        </View>

        <View style={styles.spentCard}>
          <Text style={styles.spentLabel}>Jami sarflangan (yetkazilgan)</Text>
          <Text style={styles.spentValue}>{stats.totalSpent.toLocaleString()} so'm</Text>
        </View>

        {/* Manzillar */}
        <Text style={styles.sectionTitle}>Manzillar ({addresses.length})</Text>
        {addresses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.muted}>Manzil kiritilmagan</Text>
          </View>
        ) : (
          addresses.map((a) => (
            <View key={a.id} style={styles.addressCard}>
              <View style={styles.addressIcon}>
                <Feather name="map-pin" size={16} color={theme.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.addressLabelRow}>
                  <Text style={styles.addressLabel}>{a.label}</Text>
                  {a.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Asosiy</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{a.address}</Text>
                {a.landmark ? <Text style={styles.addressLandmark}>Mo'ljal: {a.landmark}</Text> : null}
              </View>
              {(a.locationLink || (a.latitude && a.longitude)) && (
                <TouchableOpacity style={styles.mapBtn} onPress={() => openMap(a)} activeOpacity={0.8}>
                  <Feather name="map" size={16} color={theme.primaryDark} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Eslatma */}
        {customer.notes ? (
          <>
            <Text style={styles.sectionTitle}>Eslatma</Text>
            <View style={styles.notesCard}>
              <Feather name="file-text" size={15} color={palette.amber600} />
              <Text style={styles.notesText}>{customer.notes}</Text>
            </View>
          </>
        ) : null}

        {/* Buyurtmalar tarixi */}
        <Text style={styles.sectionTitle}>Buyurtmalar tarixi ({orders.length})</Text>
        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.muted}>Buyurtmalar yo'q</Text>
          </View>
        ) : (
          orders.map((o) => {
            const statusColor = ORDER_STATUS_COLORS[o.status] || theme.textSecondary;
            return (
              <View key={o.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={styles.orderNumRow}>
                    <Text style={styles.orderNum}>#{o.orderNumber}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusColor + "1A" }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString("uz-UZ")}</Text>
                </View>

                <View style={styles.orderItems}>
                  {o.items.map((it, i) => (
                    <Text key={i} style={styles.orderItemText} numberOfLines={1}>
                      {it.product.name} ×{it.quantity}
                    </Text>
                  ))}
                </View>

                <View style={styles.orderBottom}>
                  <View style={styles.orderMetaRow}>
                    {o.bottlesDelivered > 0 && (
                      <View style={styles.orderMeta}>
                        <MaterialCommunityIcons name="bottle-soda-classic-outline" size={13} color={theme.textSecondary} />
                        <Text style={styles.orderMetaText}>{o.bottlesDelivered} ta</Text>
                      </View>
                    )}
                    {o.paymentType && (
                      <Text style={styles.orderMetaText}>{PAYMENT_TYPE_LABELS[o.paymentType] || o.paymentType}</Text>
                    )}
                  </View>
                  <Text style={styles.orderAmount}>{o.totalAmount.toLocaleString()} so'm</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

function StatCard({ icon, value, label, color }: { icon: keyof typeof Feather.glyphMap; value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium },

  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.4, flex: 1 },

  content: { paddingHorizontal: spacing.lg, gap: spacing.md },

  profileCard: {
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  avatar: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: theme.primaryDark },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: theme.text, marginTop: spacing.md },
  appBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: theme.successSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.sm },
  appBadgeText: { fontSize: fontSize.xs, color: theme.success, fontWeight: fontWeight.bold },
  phoneRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap", justifyContent: "center" },
  phoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.primarySoft,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  phoneText: { fontSize: fontSize.sm, color: theme.primaryDark, fontWeight: fontWeight.bold },

  statsRow: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.black },
  statLabel: { fontSize: 10, color: theme.textSecondary, fontWeight: fontWeight.semibold, textTransform: "uppercase" },

  spentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.primaryTint,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: palette.aqua200,
  },
  spentLabel: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  spentValue: { fontSize: fontSize.lg, fontWeight: fontWeight.black, color: theme.primaryDark },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.sm,
    paddingLeft: 2,
  },

  emptyBox: { backgroundColor: theme.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", borderWidth: 1, borderColor: theme.borderSoft },

  addressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  addressIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  addressLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addressLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  defaultBadge: { backgroundColor: theme.successSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm },
  defaultBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: theme.success },
  addressText: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 3, lineHeight: 19, fontWeight: fontWeight.medium },
  addressLandmark: { fontSize: fontSize.xs, color: theme.textSecondary, fontStyle: "italic", marginTop: 2 },
  mapBtn: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },

  notesCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: theme.warningSoft,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  notesText: { flex: 1, fontSize: fontSize.sm, color: palette.amber600, fontWeight: fontWeight.semibold, lineHeight: 19 },

  orderCard: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
    gap: spacing.sm,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNumRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  orderNum: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: theme.text },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  orderDate: { fontSize: fontSize.xs, color: theme.textMuted, fontWeight: fontWeight.medium },
  orderItems: { gap: 2 },
  orderItemText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, paddingTop: spacing.sm },
  orderMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderMetaText: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  orderAmount: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: theme.primaryDark },
});
