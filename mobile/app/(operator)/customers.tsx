/**
 * Operator mijozlar ekrani (2026 redesign)
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
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button, Input, Screen } from "@/components/ui";
import { customersService } from "@/services/customers";
import { openLocation } from "@/utils/maps";
import type { Customer } from "@/types";
import { theme, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone1, setNewPhone1] = useState("");
  const [newPhone2, setNewPhone2] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newLocationLink, setNewLocationLink] = useState("");
  const [creating, setCreating] = useState(false);

  const insets = useSafeAreaInsets();

  const loadCustomers = async (pageNum = 1) => {
    const params: Record<string, string> = { page: pageNum.toString(), limit: "20" };
    if (search.trim()) params.search = search.trim();
    const result = await customersService.getCustomers(params);
    if (result.success && result.data) {
      if (pageNum === 1) setCustomers(result.data.items);
      else setCustomers((prev) => [...prev, ...result.data!.items]);
      setTotalPages(result.data.totalPages);
      setPage(pageNum);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers(1);
    }, []),
  );

  React.useEffect(() => {
    if (!loading) loadCustomers(1);
  }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages) loadCustomers(page + 1);
  };

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
  const handleOpenMap = (item: Customer) => {
    const ok = openLocation({ locationLink: item.locationLink, address: item.address });
    if (!ok) Alert.alert("Lokatsiya yo'q", "Bu mijoz uchun manzil kiritilmagan");
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim() || !newPhone1.trim() || !newAddress.trim()) {
      Alert.alert("Diqqat", "Ism, telefon va manzil to'ldirilishi shart");
      return;
    }
    setCreating(true);
    const phone1 = newPhone1.trim().startsWith("+") ? newPhone1.trim() : `+998${newPhone1.trim().replace(/\D/g, "")}`;
    const phone2 = newPhone2.trim()
      ? newPhone2.trim().startsWith("+")
        ? newPhone2.trim()
        : `+998${newPhone2.trim().replace(/\D/g, "")}`
      : undefined;

    const result = await customersService.createCustomer({
      name: newName.trim(),
      phone1,
      phone2,
      address: newAddress.trim(),
      landmark: newLandmark.trim() || undefined,
      locationLink: newLocationLink.trim() || undefined,
    });

    if (result.success) {
      Alert.alert("Muvaffaqiyat!", "Mijoz qo'shildi");
      setShowModal(false);
      resetForm();
      loadCustomers(1);
    } else {
      Alert.alert("Xatolik", (result as any).error || "Xatolik yuz berdi");
    }
    setCreating(false);
  };

  const resetForm = () => {
    setNewName("");
    setNewPhone1("");
    setNewPhone2("");
    setNewAddress("");
    setNewLandmark("");
    setNewLocationLink("");
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/customer/${item.id}`)}
    >
      <View style={styles.customerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={styles.infoRow}>
            <Feather name="phone" size={12} color={theme.textSecondary} />
            <Text style={styles.customerPhone}>{item.phone1}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <Text style={styles.customerAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          {item.landmark && <Text style={styles.landmark}>Mo'ljal: {item.landmark}</Text>}
        </View>
        <View style={styles.callBtns}>
          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.phone1)}>
            <Feather name="phone" size={16} color={theme.primaryDark} />
          </TouchableOpacity>
          {item.locationLink && (
            <TouchableOpacity style={styles.callBtn} onPress={() => handleOpenMap(item)}>
              <Feather name="map" size={16} color={theme.primaryDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.customerMeta}>
        <MetaItem icon="droplet" label="Idish" value={`${item.bottleBalance} ta`} highlight={item.bottleBalance > 0 ? theme.warning : undefined} />
        <MetaItem
          icon="credit-card"
          label="Qarz"
          value={item.debtBalance > 0 ? `${item.debtBalance.toLocaleString()}` : "—"}
          highlight={item.debtBalance > 0 ? theme.danger : undefined}
        />
        <MetaItem icon="package" label="Buyurtma" value={`${item._count?.orders || 0} ta`} />
      </View>

      {item.phone2 && (
        <TouchableOpacity style={styles.phone2Row} onPress={() => handleCall(item.phone2!)}>
          <Feather name="phone" size={13} color={theme.primaryDark} />
          <Text style={styles.phone2Text}>{item.phone2}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

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

      <FlatList
        data={customers}
        renderItem={renderCustomer}
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
                  <Feather name="users" size={34} color={theme.primary} />
                </View>
                <Text style={styles.emptyText}>Mijozlar topilmadi</Text>
              </>
            )}
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 92 }, shadow.brand]}
        onPress={() => {
          setShowModal(true);
          resetForm();
        }}
        activeOpacity={0.9}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Yangi mijoz qo'shish</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              <Input label="Ism *" placeholder="Mijoz ismi" value={newName} onChangeText={setNewName} icon="user" />
              <Input label="Telefon 1 *" placeholder="+998 90 123 45 67" value={newPhone1} onChangeText={setNewPhone1} keyboardType="phone-pad" icon="phone" />
              <Input label="Telefon 2 (ixtiyoriy)" placeholder="+998 90 123 45 67" value={newPhone2} onChangeText={setNewPhone2} keyboardType="phone-pad" icon="phone" />
              <Input label="Manzil *" placeholder="To'liq manzil" value={newAddress} onChangeText={setNewAddress} icon="map-pin" />
              <Input label="Mo'ljal (ixtiyoriy)" placeholder="Sariq darvoza yonida" value={newLandmark} onChangeText={setNewLandmark} icon="flag" />
              <Input label="Lokatsiya linki (ixtiyoriy)" placeholder="Maps URL" value={newLocationLink} onChangeText={setNewLocationLink} icon="link" />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Bekor" onPress={() => { setShowModal(false); resetForm(); }} variant="outline" style={{ flex: 1 }} />
              <Button title="Saqlash" onPress={handleCreateCustomer} loading={creating} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function MetaItem({ icon, label, value, highlight }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; highlight?: string }) {
  return (
    <View style={styles.metaItem}>
      <Feather name={icon} size={15} color={highlight || theme.textSecondary} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, highlight ? { color: highlight } : null]}>{value}</Text>
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

  list: { paddingHorizontal: spacing.lg, paddingBottom: 110, paddingTop: 4 },
  customerCard: {
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  customerHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: theme.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.primaryDark },
  customerInfo: { flex: 1, marginLeft: spacing.md, gap: 3 },
  customerName: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  customerPhone: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  customerAddress: { flex: 1, fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium },
  landmark: { fontSize: fontSize.xs, color: theme.textSecondary, fontStyle: "italic", fontWeight: fontWeight.medium, marginLeft: 18 },
  callBtns: { flexDirection: "row", gap: spacing.sm },
  callBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primarySoft,
    borderRadius: radius.sm,
  },

  divider: { height: 1, backgroundColor: theme.border, marginBottom: spacing.md },
  customerMeta: { flexDirection: "row", justifyContent: "space-around" },
  metaItem: { alignItems: "center", gap: 4 },
  metaLabel: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  metaValue: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: theme.text },
  phone2Row: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phone2Text: { fontSize: fontSize.sm, color: theme.primaryDark, fontWeight: fontWeight.bold },

  empty: { alignItems: "center", paddingTop: 90 },
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
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    padding: spacing.xl,
    maxHeight: "90%",
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text },
  modalActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
});
