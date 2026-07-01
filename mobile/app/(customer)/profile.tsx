/**
 * Customer — Profil va manzillarni boshqarish (GPS, modal) — 2026 redesign
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuthStore } from "@/store/auth";
import { customerService, type Address } from "@/services/customer";
import { Screen } from "@/components/ui";
import { SecurityCard } from "@/components/SecurityCard";
import { theme, palette, gradients, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

export default function CustomerProfile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

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
    if (r.success && r.data) setAddresses(r.data as Address[]);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, []),
  );

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ruxsat berilmadi", "Lokatsiyani aniqlash uchun ruxsat kerak");
        setGettingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lon } = location.coords;
      setLatitude(lat);
      setLongitude(lon);
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (results && results.length > 0) {
          const loc = results[0];
          const addr = [loc.street, loc.streetNumber, loc.district, loc.city, loc.region]
            .filter(Boolean)
            .join(", ");
          if (addr) setAddress(addr);
        }
      } catch (geoError) {
        console.log("Reverse geocoding failed:", geoError);
      }
      setLocationLink(`https://www.google.com/maps?q=${lat},${lon}`);
      Alert.alert("Muvaffaqiyat", "Lokatsiya aniqlandi!");
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
      Alert.alert("Muvaffaqiyat", editingAddress ? "Manzil yangilandi!" : "Manzil qo'shildi!");
      setModalVisible(false);
      loadAddresses();
    } else {
      Alert.alert("Xato", "Xatolik yuz berdi");
    }
  };

  const handleDelete = (addr: Address) => {
    Alert.alert("O'chirish", `${addr.label} manzilini o'chirmoqchimisiz?`, [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "O'chirish",
        style: "destructive",
        onPress: async () => {
          const r = await customerService.deleteAddress(addr.id);
          if (r.success) {
            Alert.alert("Bajarildi", "Manzil o'chirildi");
            loadAddresses();
          } else {
            Alert.alert("Xato", "Manzilni o'chirib bo'lmadi");
          }
        },
      },
    ]);
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
    <Screen>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={shadow.brandSoft}>
          <LinearGradient colors={gradients.brand} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "M").charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || "Mijoz"}
          </Text>
          <View style={styles.phoneRow}>
            <Feather name="phone" size={12} color={theme.textSecondary} />
            <Text style={styles.userPhone}>{user?.phone}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Manzillar */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Feather name="map-pin" size={18} color={theme.primary} />
              <Text style={styles.cardTitle}>Manzillarim</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
              <Feather name="plus" size={14} color={theme.primaryDark} />
              <Text style={styles.addBtnText}>Qo'shish</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.primary} style={{ paddingVertical: 20 }} />
          ) : addresses.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="map" size={30} color={theme.primary} />
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
                      <Feather name="edit-2" size={15} color={theme.primaryDark} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(addr)} style={styles.actionBtn} activeOpacity={0.6}>
                      <Feather name="trash-2" size={15} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
                {addr.landmark && <Text style={styles.addressLandmark}>Mo'ljal: {addr.landmark}</Text>}
                {addr.latitude && addr.longitude && (
                  <View style={styles.miniCoordsBox}>
                    <MaterialCommunityIcons name="google-maps" size={12} color={theme.textSecondary} />
                    <Text style={styles.addressCoords}>
                      {addr.latitude.toFixed(6)}, {addr.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Xavfsizlik */}
        <SecurityCard />

        {/* Ilova haqida */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Feather name="info" size={18} color={theme.primaryDark} />
            <Text style={styles.cardTitle}>Ilova haqida</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: spacing.md }]}>
            <Text style={styles.infoLabel}>Versiya</Text>
            <Text style={styles.infoValue}>1.3.0</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Platforma</Text>
            <Text style={styles.infoValue}>BuloqWater SaaS</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color={theme.danger} style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Tizimdan chiqish</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? "Manzilni tahrirlash" : "Yangi manzil qo'shish"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBox}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Manzil nomi *</Text>
                <TextInput
                  style={styles.formInput}
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Masalan: Uy, Ish, Ota-onamning uyi"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <TouchableOpacity
                style={styles.gpsBtn}
                onPress={handleGetLocation}
                disabled={gettingLocation}
                activeOpacity={0.85}
              >
                {gettingLocation ? (
                  <View style={[styles.gpsGradient, { backgroundColor: theme.primaryDark }]}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                ) : (
                  <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gpsGradient}>
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
                  placeholderTextColor={theme.textMuted}
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
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {latitude && longitude && (
                <View style={styles.coordsBox}>
                  <Feather name="check-circle" size={14} color={theme.success} />
                  <Text style={styles.coordsText}>
                    Koordinatalar saqlandi: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.defaultCheckbox} onPress={() => setIsDefault(!isDefault)} activeOpacity={0.7}>
                <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                  {isDefault && <Feather name="check" size={14} color="#FFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Ushbu manzilni asosiy qilish</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtnWrapper} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  <LinearGradient colors={saving ? [palette.slate400, palette.slate500] : gradients.brand} style={styles.saveModalGradient}>
                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveModalBtnText}>Saqlash</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.base, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  avatar: { width: 58, height: 58, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: "#FFF" },
  userName: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.5 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  userPhone: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  scroll: { paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.base },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  addBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.primaryDark },

  emptyBox: { alignItems: "center", paddingVertical: spacing.xl },
  emptyIconWrapper: {
    width: 66,
    height: 66,
    borderRadius: radius.xl,
    backgroundColor: theme.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: fontSize.base, color: theme.textSecondary, marginBottom: spacing.base, fontWeight: fontWeight.medium, textAlign: "center" },
  emptyBtn: { backgroundColor: theme.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md },
  emptyBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: "#FFF" },

  addressItem: { backgroundColor: theme.bg, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.md, borderWidth: 1, borderColor: theme.border },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  addressLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  defaultBadgeBox: { backgroundColor: theme.successSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm },
  defaultBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: theme.success },
  addressActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  addressText: { fontSize: fontSize.base, color: theme.text, lineHeight: 20, marginBottom: 6, fontWeight: fontWeight.medium },
  addressLandmark: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium, marginBottom: 4 },
  miniCoordsBox: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  addressCoords: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: fontWeight.medium },

  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  infoLabel: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium },
  infoValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.rose100,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    backgroundColor: theme.surface,
    marginTop: spacing.sm,
  },
  logoutText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.danger },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], padding: spacing.xl, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.3 },
  closeModalBox: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: theme.surfaceAlt, alignItems: "center", justifyContent: "center" },

  formField: { marginBottom: spacing.md },
  formLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.text, marginBottom: 6, paddingLeft: 2 },
  formInput: {
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: theme.text,
    backgroundColor: theme.bg,
  },

  gpsBtn: { borderRadius: radius.md, overflow: "hidden", marginBottom: spacing.md },
  gpsGradient: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  gpsBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: "#FFF" },

  coordsBox: {
    backgroundColor: theme.successSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coordsText: { fontSize: fontSize.sm, color: theme.success, fontWeight: fontWeight.semibold },

  defaultCheckbox: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg, paddingLeft: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: theme.borderStrong,
    borderRadius: 6,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bg,
  },
  checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkboxLabel: { fontSize: fontSize.base, color: theme.text, fontWeight: fontWeight.semibold },

  modalActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    alignItems: "center",
    backgroundColor: theme.surface,
  },
  cancelBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.textSecondary },
  saveModalBtnWrapper: { flex: 1, borderRadius: radius.md, overflow: "hidden" },
  saveModalGradient: { height: 50, alignItems: "center", justifyContent: "center" },
  saveModalBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: "#FFF" },
});
