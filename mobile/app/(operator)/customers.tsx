/**
 * Operator mijozlar ekrani
 * Web: /operator/customers — mijozlar bazasi, qidirish, yangi mijoz qo'shish
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
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { customersService } from "@/services/customers";
import type { Customer } from "@/types";

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New customer modal — web bilan bir xil maydonlar
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone1, setNewPhone1] = useState("");
  const [newPhone2, setNewPhone2] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newLocationLink, setNewLocationLink] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCustomers = async (pageNum = 1) => {
    const params: Record<string, string> = { page: pageNum.toString(), limit: "20" };
    if (search.trim()) params.search = search.trim();

    const result = await customersService.getCustomers(params);
    if (result.success && result.data) {
      if (pageNum === 1) {
        setCustomers(result.data.items);
      } else {
        setCustomers((prev) => [...prev, ...result.data!.items]);
      }
      setTotalPages(result.data.totalPages);
      setPage(pageNum);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers(1);
    }, [])
  );

  React.useEffect(() => {
    if (!loading) {
      loadCustomers(1);
    }
  }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages) loadCustomers(page + 1);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMap = (locationLink: string) => {
    Linking.openURL(locationLink);
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim() || !newPhone1.trim() || !newAddress.trim()) {
      Alert.alert("Diqqat", "Ism, telefon va manzil to'ldirilishi shart");
      return;
    }

    setCreating(true);
    const phone1 = newPhone1.trim().startsWith("+")
      ? newPhone1.trim()
      : `+998${newPhone1.trim().replace(/\D/g, "")}`;
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
    <Card style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerAddress}>{item.address}</Text>
          {item.landmark ? (
            <Text style={styles.landmark}>Mo'ljal: {item.landmark}</Text>
          ) : null}
        </View>
        <View style={styles.callBtns}>
          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.phone1)}>
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
          {item.locationLink ? (
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: "#EDE9FE" }]}
              onPress={() => handleOpenMap(item.locationLink!)}
            >
              <Text style={styles.callIcon}>🗺</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.customerMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Idish</Text>
          <Text
            style={[
              styles.metaValue,
              item.bottleBalance > 0 && { color: Colors.warning },
            ]}
          >
            {item.bottleBalance} ta
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Qarz</Text>
          <Text
            style={[
              styles.metaValue,
              item.debtBalance > 0 && { color: Colors.danger },
            ]}
          >
            {item.debtBalance > 0 ? `${item.debtBalance.toLocaleString()} so'm` : "—"}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Buyurtmalar</Text>
          <Text style={styles.metaValue}>{item._count?.orders || 0} ta</Text>
        </View>
      </View>

      {item.phone2 ? (
        <TouchableOpacity
          style={styles.phone2Row}
          onPress={() => handleCall(item.phone2!)}
        >
          <Text style={styles.phone2Text}>📞 {item.phone2}</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Ism, telefon yoki manzil qidirish..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Customer List */}
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>
              {loading ? "Yuklanmoqda..." : "Mijozlar topilmadi"}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { setShowModal(true); resetForm(); }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* New Customer Modal — web bilan bir xil maydonlar */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yangi mijoz</Text>

            <Input
              label="Ism *"
              placeholder="Mijoz ismi"
              value={newName}
              onChangeText={setNewName}
            />
            <Input
              label="Telefon 1 *"
              placeholder="+998 90 123 45 67"
              value={newPhone1}
              onChangeText={setNewPhone1}
              keyboardType="phone-pad"
            />
            <Input
              label="Telefon 2"
              placeholder="+998 90 123 45 67 (ixtiyoriy)"
              value={newPhone2}
              onChangeText={setNewPhone2}
              keyboardType="phone-pad"
            />
            <Input
              label="Manzil *"
              placeholder="To'liq manzil"
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <Input
              label="Mo'ljal"
              placeholder="Masalan: 'Sariq darvoza yonida'"
              value={newLandmark}
              onChangeText={setNewLandmark}
            />
            <Input
              label="Lokatsiya linki"
              placeholder="Yandex Maps yoki Google Maps URL"
              value={newLocationLink}
              onChangeText={setNewLocationLink}
            />

            <View style={styles.modalActions}>
              <Button
                title="Saqlash"
                onPress={handleCreateCustomer}
                loading={creating}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Bekor"
                onPress={() => { setShowModal(false); resetForm(); }}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: { marginBottom: 0 },
  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  customerCard: { padding: 14 },
  customerHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: Colors.primaryDark },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 15, fontWeight: "600", color: Colors.gray[800] },
  customerAddress: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  landmark: { fontSize: 11, color: Colors.gray[400], marginTop: 1, fontStyle: "italic" },
  callBtns: { flexDirection: "row", gap: 6 },
  callBtn: { padding: 8, backgroundColor: Colors.gray[50], borderRadius: 8 },
  callIcon: { fontSize: 18 },
  customerMeta: { flexDirection: "row", gap: 16 },
  metaItem: { alignItems: "center" },
  metaLabel: { fontSize: 11, color: Colors.gray[500] },
  metaValue: { fontSize: 14, fontWeight: "700", color: Colors.gray[800], marginTop: 2 },
  phone2Row: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  phone2Text: { fontSize: 13, color: Colors.primary },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray[500] },
  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: Colors.white, fontWeight: "300", marginTop: -2 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
});
