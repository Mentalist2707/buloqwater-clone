/**
 * Admin (Director) Mijozlar sahifasi (2026 redesign)
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button, Input, Screen } from "@/components/ui";
import { customersService } from "@/services/customers";
import { openLocation } from "@/utils/maps";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

interface Customer {
  id: string;
  name: string;
  phone1: string;
  phone2?: string | null;
  address: string;
  landmark?: string | null;
  locationLink?: string | null;
  notes?: string | null;
  bottleBalance: number;
  debtBalance: number;
  createdAt: string;
  _count?: { orders: number };
}

export default function AdminCustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const insets = useSafeAreaInsets();

  const [createModal, setCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [phone1, setPhone1] = useState("998");
  const [phone2, setPhone2] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [notes, setNotes] = useState("");

  const loadCustomers = async () => {
    const params: any = { limit: "100" };
    if (search) params.search = search;
    const result = await customersService.getCustomers(params);
    if (result.success && result.data) {
      setCustomers(result.data.items as Customer[]);
      setTotal(result.data.total);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCustomers();
    }, [search]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const handleOpenCreate = () => {
    setName("");
    setPhone1("998");
    setPhone2("");
    setAddress("");
    setLandmark("");
    setLocationLink("");
    setNotes("");
    setErrorMsg("");
    setCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone1.trim() || !address.trim()) {
      setErrorMsg("Ism, telefon va manzil majburiy");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    const result = await customersService.createCustomer({
      name,
      phone1,
      phone2: phone2 || undefined,
      address,
      landmark: landmark || undefined,
      locationLink: locationLink || undefined,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (result.success) {
      Alert.alert("Bajarildi!", "Yangi mijoz qo'shildi");
      setCreateModal(false);
      loadCustomers();
    } else {
      setErrorMsg((result as any).error || "Xatolik yuz berdi");
    }
  };

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
  const handleOpenMap = (c: Customer) => {
    const ok = openLocation({ locationLink: c.locationLink, address: c.address });
    if (!ok) Alert.alert("Lokatsiya yo'q", "Bu mijoz uchun manzil kiritilmagan");
  };

  const totalDebt = customers.reduce((sum, c) => sum + c.debtBalance, 0);
  const totalBottles = customers.reduce((sum, c) => sum + c.bottleBalance, 0);
  const customersWithDebt = customers.filter((c) => c.debtBalance > 0).length;
  const customersWithBottles = customers.filter((c) => c.bottleBalance > 0).length;

  const renderCustomer = ({ item: c }: { item: Customer }) => {
    const hasDebt = c.debtBalance > 0;
    const hasBottles = c.bottleBalance > 0;
    const orderCount = c._count?.orders || 0;
    return (
      <TouchableOpacity
        style={styles.customerCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/customer/${c.id}`)}
      >
        <View style={styles.nameRow}>
          <Text style={styles.customerName}>{c.name}</Text>
          {orderCount > 0 && (
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{orderCount} buyurtma</Text>
            </View>
          )}
        </View>

        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.phoneChip} onPress={() => handleCall(c.phone1)}>
            <Feather name="phone" size={13} color={theme.primaryDark} />
            <Text style={styles.phoneText}>+{c.phone1}</Text>
          </TouchableOpacity>
          {c.phone2 && (
            <TouchableOpacity style={styles.phoneChip} onPress={() => handleCall(c.phone2!)}>
              <Feather name="phone" size={13} color={theme.textSecondary} />
              <Text style={[styles.phoneText, { color: theme.textSecondary }]}>+{c.phone2}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.addressRow}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <Text style={styles.addressText} numberOfLines={2}>
            {c.address}
          </Text>
          {c.locationLink && (
            <TouchableOpacity onPress={() => handleOpenMap(c)}>
              <Feather name="map" size={18} color={theme.primaryDark} />
            </TouchableOpacity>
          )}
        </View>
        {c.landmark && <Text style={styles.landmarkText}>Mo'ljal: {c.landmark}</Text>}

        {(hasDebt || hasBottles) && (
          <View style={styles.balanceContainer}>
            {hasBottles && (
              <View style={[styles.balancePill, { backgroundColor: theme.primaryTint, borderColor: palette.aqua200 }]}>
                <Feather name="droplet" size={14} color={theme.primaryDark} />
                <Text style={[styles.balanceText, { color: theme.primaryDark }]}>{c.bottleBalance} ta idish</Text>
              </View>
            )}
            {hasDebt && (
              <View style={[styles.balancePill, { backgroundColor: theme.dangerSoft, borderColor: palette.rose400 + "55" }]}>
                <Feather name="credit-card" size={14} color={theme.danger} />
                <Text style={[styles.balanceText, { color: theme.danger }]}>{c.debtBalance.toLocaleString()} so'm</Text>
              </View>
            )}
          </View>
        )}

        {c.notes && (
          <View style={styles.notesContainer}>
            <Feather name="file-text" size={14} color={palette.amber600} />
            <Text style={styles.notesText} numberOfLines={2}>
              {c.notes}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <View style={[styles.headerPanel, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.pageTitle}>Mijozlar</Text>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput
            placeholder="Ism, telefon yoki manzil..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {!loading && customers.length > 0 && (
        <View style={styles.statsRow}>
          <StatBox value={String(total)} label="Jami" color={theme.primaryDark} />
          {customersWithDebt > 0 && <StatBox value={`${(totalDebt / 1000).toFixed(0)}K`} label="Qarz" color={theme.danger} />}
          {customersWithBottles > 0 && <StatBox value={String(totalBottles)} label="Idish" color={palette.aqua500} />}
        </View>
      )}

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                <View style={styles.emptyIconBox}>
                  <Feather name="users" size={34} color={theme.primary} />
                </View>
                <Text style={styles.emptyText}>Mijozlar topilmadi</Text>
              </>
            )}
          </View>
        }
      />

      {!loading && (
        <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 92 }, shadow.brand]} onPress={handleOpenCreate} activeOpacity={0.9}>
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Yangi mijoz qo'shish</Text>
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={14} color={theme.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              <Input label="Ism va familiya *" placeholder="Ali Valiyev" value={name} onChangeText={setName} icon="user" />
              <Input label="Telefon 1 *" placeholder="998901234567" keyboardType="numeric" value={phone1} onChangeText={setPhone1} icon="phone" />
              <Input label="Telefon 2 (ixtiyoriy)" placeholder="998901234567" keyboardType="numeric" value={phone2} onChangeText={setPhone2} icon="phone" />
              <Input label="Manzil *" placeholder="To'liq manzil" value={address} onChangeText={setAddress} icon="map-pin" />
              <Input label="Mo'ljal (ixtiyoriy)" placeholder="Oloy bozori yonida" value={landmark} onChangeText={setLandmark} icon="flag" />
              <Input label="GPS lokatsiya (ixtiyoriy)" placeholder="Maps link" value={locationLink} onChangeText={setLocationLink} icon="link" />
              <Input label="Eslatmalar (ixtiyoriy)" placeholder="Qo'shimcha ma'lumot" value={notes} onChangeText={setNotes} icon="file-text" />
            </ScrollView>
            <View style={styles.modalActionsRow}>
              <Button title="Bekor" variant="outline" style={{ flex: 1 }} onPress={() => setCreateModal(false)} disabled={submitting} />
              <Button title="Saqlash" style={{ flex: 1 }} onPress={handleSubmit} loading={submitting} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.statBox, { borderTopColor: color }]}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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

  statsRow: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  statNum: { fontSize: fontSize.xl, fontWeight: fontWeight.black, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.bold, textTransform: "uppercase" },

  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 110 },
  customerCard: {
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm, flexWrap: "wrap" },
  customerName: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text },
  orderBadge: { backgroundColor: theme.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  orderBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: theme.primaryDark },

  phoneRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm, flexWrap: "wrap" },
  phoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  phoneText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.primaryDark },

  addressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 4 },
  addressText: { flex: 1, fontSize: fontSize.base, color: theme.textSecondary, lineHeight: 20, fontWeight: fontWeight.medium },
  landmarkText: { fontSize: fontSize.sm, color: theme.textSecondary, fontStyle: "italic", marginLeft: 22, fontWeight: fontWeight.medium },

  balanceContainer: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.border, flexWrap: "wrap" },
  balancePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md, borderWidth: 1 },
  balanceText: { fontSize: fontSize.sm, fontWeight: fontWeight.extrabold },

  notesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: theme.warningSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  notesText: { flex: 1, fontSize: fontSize.sm, color: palette.amber600, fontWeight: fontWeight.semibold, lineHeight: 18 },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 90 },
  emptyIconBox: { width: 78, height: 78, borderRadius: radius["2xl"], backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.base },
  emptyText: { fontSize: fontSize.md, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], padding: spacing.xl, maxHeight: "90%" },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  errorText: { color: theme.danger, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },
  modalActionsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
});
