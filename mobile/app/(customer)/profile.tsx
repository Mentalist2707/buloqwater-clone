/**
 * Customer — Profil va bir nechta manzillarni boshqarish (GPS location bilan)
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar, Modal,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useAuthStore } from "@/store/auth";
import { customerService, type Address } from "@/services/customer";

const C = {
  primary: "#00C6A2", dark: "#00A88A", light: "#E6FAF7",
  accent: "#6C63FF", accentLight: "#EFEDFF",
  bg: "#F0FAF8", white: "#FFFFFF", text: "#1A2E2B", sub: "#6B8F89",
  border: "#C8E8E3", danger: "#EF4444", dangerLight: "#FEE2E2",
  success: "#22C55E", warning: "#F59E0B",
};

export default function CustomerProfile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Form state
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationLink, setLocationLink] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const loadAddresses = async () => {
    setLoading(true);
    const r = await customerService.getAddresses();
    if (r.success && r.data) {
      setAddresses(r.data);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadAddresses(); }, []));

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      
      // Permission so'rash
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ruxsat berilmadi", "Lokatsiyani aniqlash uchun ruxsat kerak");
        setGettingLocation(false);
        return;
      }

      // Lokatsiyani olish
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: lat, longitude: lon } = location.coords;
      setLatitude(lat);
      setLongitude(lon);

      // Reverse geocoding - koordinatalardan manzilni olish
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (results && results.length > 0) {
          const loc = results[0];
          const addr = [
            loc.street,
            loc.streetNumber,
            loc.district,
            loc.city,
            loc.region,
          ].filter(Boolean).join(", ");
          
          if (addr) {
            setAddress(addr);
          }
        }
      } catch (geoError) {
        console.log("Reverse geocoding failed:", geoError);
      }

      // Google Maps link yaratish
      const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
      setLocationLink(mapsLink);

      Alert.alert("✅ Muvaffaqiyat", "Lokatsiya aniqlandi!");
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Xato", "Lokatsiyani aniqlab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setGettingLocation(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel("");
    setAddress("");
    setLandmark("");
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationLink("");
    setIsDefault(addresses.length === 0); // Birinchi manzil avtomatik default
    setModalVisible(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setAddress(addr.address);
    setLandmark(addr.landmark || "");
    setLatitude(addr.latitude || undefined);
    setLongitude(addr.longitude || undefined);
    setLocationLink(addr.locationLink || "");
    setIsDefault(addr.isDefault);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert("Diqqat", "Manzil nomini kiriting (masalan: Uy, Ish)");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Diqqat", "Manzilni kiriting");
      return;
    }

    setSaving(true);
    
    const data = {
      label: label.trim(),
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      latitude,
      longitude,
      locationLink: locationLink.trim() || undefined,
      isDefault,
    };

    const r = editingAddress
      ? await customerService.updateAddressById(editingAddress.id, data)
      : await customerService.createAddress(data);

    setSaving(false);

    if (r.success) {
      Alert.alert("✅ Muvaffaqiyat", editingAddress ? "Manzil yangilandi!" : "Manzil qo'shildi!");
      setModalVisible(false);
      loadAddresses();
    } else {
      Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
    }
  };

  const handleDelete = (addr: Address) => {
    Alert.alert(
      "O'chirish",
      `${addr.label} manzilini o'chirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: async () => {
            const r = await customerService.deleteAddress(addr.id);
            if (r.success) {
              Alert.alert("✅", "Manzil o'chirildi");
              loadAddresses();
            } else {
              Alert.alert("Xato", "Manzilni o'chirib bo'lmadi");
            }
          },
        },
      ]
    );
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{(user?.name || "M").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Manzillar */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📍 Manzillarim</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
              <Text style={styles.addBtnText}>+ Qo'shish</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ paddingVertical: 20 }} />
          ) : addresses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Hali manzil qo'shilmagan</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
                <Text style={styles.emptyBtnText}>Manzil qo'shish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((addr) => (
              <View key={addr.id} style={styles.addressItem}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>
                    {addr.label}
                    {addr.isDefault && <Text style={styles.defaultBadge}> • Asosiy</Text>}
                  </Text>
                  <View style={styles.addressActions}>
                    <TouchableOpacity onPress={() => openEditModal(addr)} style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(addr)} style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
                {addr.landmark && <Text style={styles.addressLandmark}>Mo'ljal: {addr.landmark}</Text>}
                {addr.latitude && addr.longitude && (
                  <Text style={styles.addressCoords}>
                    📍 {addr.latitude.toFixed(6)}, {addr.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Ilova haqida */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ Ilova haqida</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versiya</Text>
            <Text style={styles.infoValue}>1.3.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platforma</Text>
            <Text style={styles.infoValue}>BuloqWater</Text>
          </View>
        </View>

        {/* Chiqish */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>→ Tizimdan chiqish</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? "Manzilni tahrirlash" : "Yangi manzil qo'shish"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Manzil nomi *</Text>
                <TextInput
                  style={styles.formInput}
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Masalan: Uy, Ish, Ota-onam"
                  placeholderTextColor={C.sub}
                />
              </View>

              {/* GPS tugmasi */}
              <TouchableOpacity
                style={styles.gpsBtn}
                onPress={handleGetLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <>
                    <Text style={styles.gpsBtnIcon}>📍</Text>
                    <Text style={styles.gpsBtnText}>Lokatsiyani aniqlash (GPS)</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Manzil *</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ko'cha, uy raqami, kvartira..."
                  placeholderTextColor={C.sub}
                  multiline
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Mo'ljal (ixtiyoriy)</Text>
                <TextInput
                  style={styles.formInput}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="Masalan: maktab yonida, darvoza yashil"
                  placeholderTextColor={C.sub}
                />
              </View>

              {latitude && longitude && (
                <View style={styles.coordsBox}>
                  <Text style={styles.coordsText}>
                    📍 Koordinatalar: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.defaultCheckbox}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                  {isDefault && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Asosiy manzil qilish</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveModalBtn, saving && styles.saveModalBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <Text style={styles.saveModalBtnText}>Saqlash</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },

  header:     {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: C.primary,
  },
  avatarBox:  {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "800", color: C.white },
  userName:   { fontSize: 18, fontWeight: "700", color: C.white },
  userPhone:  { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  scroll:     { padding: 16 },

  card:       {
    backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle:  { fontSize: 16, fontWeight: "700", color: C.text },

  addBtn:     { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: "700", color: C.white },

  emptyBox:   { alignItems: "center", paddingVertical: 30 },
  emptyIcon:  { fontSize: 50, marginBottom: 10 },
  emptyText:  { fontSize: 14, color: C.sub, marginBottom: 16 },
  emptyBtn:   { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: "600", color: C.white },

  addressItem: {
    backgroundColor: C.light, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: C.border,
  },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  addressLabel: { fontSize: 15, fontWeight: "700", color: C.text },
  defaultBadge: { fontSize: 12, fontWeight: "600", color: C.primary },
  addressActions: { flexDirection: "row", gap: 8 },
  actionBtn:   { padding: 4 },
  actionBtnText: { fontSize: 18 },
  addressText: { fontSize: 14, color: C.text, lineHeight: 20, marginBottom: 4 },
  addressLandmark: { fontSize: 12, color: C.sub, marginBottom: 2 },
  addressCoords: { fontSize: 11, color: C.sub, fontFamily: "monospace" },

  infoRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.light },
  infoLabel:  { fontSize: 13, color: C.sub },
  infoValue:  { fontSize: 13, fontWeight: "600", color: C.text },

  logoutBtn:  {
    borderWidth: 1.5, borderColor: C.danger + "60", borderRadius: 14,
    paddingVertical: 15, alignItems: "center", backgroundColor: C.white,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: C.danger },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  modalClose: { fontSize: 28, color: C.sub },

  formField:  { marginBottom: 16 },
  formLabel:  { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6 },
  formInput:  {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, backgroundColor: C.bg,
  },

  gpsBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginBottom: 16, gap: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  gpsBtnIcon: { fontSize: 20 },
  gpsBtnText: { fontSize: 15, fontWeight: "700", color: C.white },

  coordsBox: {
    backgroundColor: C.accentLight, borderRadius: 10, padding: 10, marginBottom: 16,
  },
  coordsText: { fontSize: 12, color: C.accent, fontFamily: "monospace" },

  defaultCheckbox: {
    flexDirection: "row", alignItems: "center", marginBottom: 20,
  },
  checkbox: {
    width: 24, height: 24, borderWidth: 2, borderColor: C.border,
    borderRadius: 6, marginRight: 10, alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark: { fontSize: 16, fontWeight: "700", color: C.white },
  checkboxLabel: { fontSize: 14, color: C.text },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: C.text },
  saveModalBtn: {
    flex: 1, backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  saveModalBtnDisabled: { opacity: 0.5 },
  saveModalBtnText: { fontSize: 15, fontWeight: "700", color: C.white },
});
