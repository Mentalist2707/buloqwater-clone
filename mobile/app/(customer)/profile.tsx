/**
 * Customer — Profil va bir nechta manzillarni boshqarish (GPS location bilan)
 * Strict TypeScript, Organic Liquid Glassmorphic & Claymorphic Style
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  Platform,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuthStore } from "@/store/auth";
import { customerService, type Address } from "@/services/customer";

// ─── Qat'iy Tiplashtirilgan Rang Palitrasi ──────────────────────
const C = {
  bgGradient:   ["#E6FFFA", "#EBF5FF", "#F4FAFF"] as const,
  cardWhite:    "#FFFFFF" as const,
  textDark:     "#0F172A" as const,
  textSub:      "#64748B" as const,
  
  cyan:         "#06B6D4" as const,
  cyanLight:    "#E0F7FA" as const,
  blue:         "#0284C7" as const,
  blueLight:    "#E0F2FE" as const,
  emerald:      "#10B981" as const,
  emeraldLight: "#D1FAE5" as const,
  rose:         "#F43F5E" as const,
};

export default function CustomerProfile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Form state
  const [label, setLabel] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationLink, setLocationLink] = useState<string>("");
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [gettingLocation, setGettingLocation] = useState<boolean>(false);

  const loadAddresses = async () => {
    setLoading(true);
    const r = await customerService.getAddresses();
    if (r.success && r.data) {
      setAddresses(r.data as Address[]);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadAddresses(); }, []));

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ruxsat berilmadi", "Lokatsiyani aniqlash uchun ruxsat kerak");
        setGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: lat, longitude: lon } = location.coords;
      setLatitude(lat);
      setLongitude(lon);

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
          
          if (addr) setAddress(addr);
        }
      } catch (geoError) {
        console.log("Reverse geocoding failed:", geoError);
      }

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
    setIsDefault(addresses.length === 0);
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
      Alert.alert("Xato", "Xatolik yuz berdi");
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
    <LinearGradient colors={C.bgGradient} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.fluidBubble1} />
      <View style={styles.fluidBubble2} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatarBox}>
          <LinearGradient colors={[C.cyan, C.blue]} style={styles.avatarGradient}>
            <Text style={styles.avatarText}>{(user?.name || "M").charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.userName}>{user?.name || "Mijoz"}</Text>
          <View style={styles.phoneRow}>
            <Feather name="phone" size={12} color={C.textSub} />
            <Text style={styles.userPhone}>{user?.phone}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Manzillar Bloki */}
        <View style={[styles.card, styles.clayCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Feather name="map-pin" size={18} color={C.cyan} />
              <Text style={styles.cardTitle}>Manzillarim</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Qo'shish</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={C.cyan} style={{ paddingVertical: 20 }} />
          ) : addresses.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="map" size={32} color={C.cyan} />
              </View>
              <Text style={styles.emptyText}>Hali birorta ham manzil qo'shilmagan</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal} activeOpacity={0.8}>
                <Text style={styles.emptyBtnText}>Manzil qo'shish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((addr) => (
              <View key={addr.id} style={styles.addressItem}>
                <View style={styles.addressHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadgeBox}>
                        <Text style={styles.defaultBadgeText}>Asosiy</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity onPress={() => openEditModal(addr)} style={styles.actionBtn} activeOpacity={0.6}>
                      <Feather name="edit-2" size={15} color={C.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(addr)} style={styles.actionBtn} activeOpacity={0.6}>
                      <Feather name="trash-2" size={15} color={C.rose} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
                {addr.landmark && (
                  <Text style={styles.addressLandmark}>Mo'ljal: {addr.landmark}</Text>
                )}
                {addr.latitude && addr.longitude && (
                  <View style={styles.miniCoordsBox}>
                    <MaterialCommunityIcons name="google-maps" size={12} color={C.textSub} />
                    <Text style={styles.addressCoords}>
                      {addr.latitude.toFixed(6)}, {addr.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Ilova Haqida Bloki */}
        <View style={[styles.card, styles.clayCard]}>
          <View style={styles.titleRow}>
            <Feather name="info" size={18} color={C.blue} />
            <Text style={styles.cardTitle}>Ilova haqida</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Text style={styles.infoLabel}>Versiya</Text>
            <Text style={styles.infoValue}>1.3.0</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Platforma</Text>
            <Text style={styles.infoValue}>BuloqWater SaaS</Text>
          </View>
        </View>

        {/* Chiqish Tugmasi */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color={C.rose} style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Tizimdan chiqish</Text>
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
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBox}>
                <Feather name="x" size={20} color={C.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Manzil nomi *</Text>
                <TextInput
                  style={styles.formInput}
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Masalan: Uy, Ish, Ota-onamning uyi"
                  placeholderTextColor="#A1A1AA"
                />
              </View>

              <TouchableOpacity
                style={styles.gpsBtn}
                onPress={handleGetLocation}
                disabled={gettingLocation}
                activeOpacity={0.8}
              >
                {gettingLocation ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <LinearGradient
                    colors={["#6366F1", "#4F46E5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gpsGradient}
                  >
                    <Ionicons name="location" size={18} color="#FFF" />
                    <Text style={styles.gpsBtnText}>GPS orqali joylashuvni olish</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Manzil *</Text>
                <TextInput
                  style={[styles.formInput, { height: 68, paddingTop: 12, textAlignVertical: "top" }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ko'cha nomi, uy raqami, xonadon..."
                  placeholderTextColor="#A1A1AA"
                  multiline
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Mo'ljal (ixtiyoriy)</Text>
                <TextInput
                  style={styles.formInput}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="Masalan: Maktab yonida, yashil darvoza"
                  placeholderTextColor="#A1A1AA"
                />
              </View>

              {latitude && longitude && (
                <View style={styles.coordsBox}>
                  <Feather name="check-circle" size={14} color="#4F46E5" />
                  <Text style={styles.coordsText}>
                    Koordinatalar saqlandi: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.defaultCheckbox}
                onPress={() => setIsDefault(!isDefault)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                  {isDefault && <Feather name="check" size={14} color="#FFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Ushbu manzilni asosiy qilish</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveModalBtnWrapper}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={saving ? ["#94A3B8", "#64748B"] : [C.cyan, C.blue]}
                    style={styles.saveModalGradient}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.saveModalBtnText}>Saqlash</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fluidBubble1: { position: "absolute", top: -40, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(6, 182, 212, 0.05)" },
  fluidBubble2: { position: "absolute", bottom: 100, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(2, 132, 199, 0.04)" },

  header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 24, paddingBottom: 20 },
  avatarBox: {
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#0284C7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  avatarGradient: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  userName: { fontSize: 22, fontWeight: "800", color: C.textDark, letterSpacing: -0.5 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  userPhone: { fontSize: 13, color: C.textSub, fontWeight: "600" },

  scroll: { paddingHorizontal: 24 },
  card: { backgroundColor: C.cardWhite, borderRadius: 24, padding: 20, marginBottom: 16 },
  clayCard: {
    ...Platform.select({
      ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: C.textDark },

  addBtn: { backgroundColor: C.cyanLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { fontSize: 13, fontWeight: "700", color: C.cyan },

  emptyBox: { alignItems: "center", paddingVertical: 24 },
  emptyIconWrapper: { width: 64, height: 64, borderRadius: 22, backgroundColor: C.cyanLight, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.textSub, marginBottom: 16, fontWeight: "500", textAlign: "center" },
  emptyBtn: { backgroundColor: C.cyan, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },

  addressItem: { backgroundColor: "#F8FAFC", borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: "rgba(226, 232, 240, 0.8)" },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addressLabel: { fontSize: 15, fontWeight: "700", color: C.textDark },
  defaultBadgeBox: { backgroundColor: C.emeraldLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  defaultBadgeText: { fontSize: 11, fontWeight: "700", color: C.emerald },
  addressActions: { flexDirection: "row", gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(226, 232, 240, 0.6)" },
  addressText: { fontSize: 14, color: C.textDark, lineHeight: 20, marginBottom: 6, fontWeight: "500" },
  addressLandmark: { fontSize: 12, color: C.textSub, fontWeight: "500", marginBottom: 4 },
  miniCoordsBox: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  addressCoords: { fontSize: 11, color: C.textSub, fontWeight: "500" },

  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: "#F1F5F9" },
  infoLabel: { fontSize: 14, color: C.textSub, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "700", color: C.textDark },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(244, 63, 94, 0.2)", borderRadius: 20, paddingVertical: 14, backgroundColor: C.cardWhite, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: "700", color: C.rose },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.cardWhite, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: C.textDark, letterSpacing: -0.3 },
  closeModalBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },

  formField: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: "700", color: C.textDark, marginBottom: 6, paddingLeft: 2 },
  formInput: { borderWidth: 1.5, borderColor: "rgba(226, 232, 240, 0.8)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.textDark, backgroundColor: "#F8FAFC" },

  gpsBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 14 },
  gpsGradient: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  gpsBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },

  coordsBox: { backgroundColor: "#EEF2FF", borderRadius: 12, padding: 10, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  coordsText: { fontSize: 12, color: "#4F46E5", fontWeight: "600" },

  defaultCheckbox: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingLeft: 2 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: "rgba(226, 232, 240, 1)", borderRadius: 6, marginRight: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  checkboxChecked: { backgroundColor: C.cyan, borderColor: C.cyan },
  checkboxLabel: { fontSize: 14, color: C.textDark, fontWeight: "600" },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: "rgba(226, 232, 240, 1)", borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: "#FFF" },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: C.textSub },
  saveModalBtnWrapper: { flex: 1, borderRadius: 16, overflow: "hidden" },
  saveModalGradient: { height: 48, alignItems: "center", justifyContent: "center" },
  saveModalBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});