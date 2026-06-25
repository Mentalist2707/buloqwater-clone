/**
 * Customer — Profil va manzil tahrirlash
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar, Linking,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { customerService } from "@/services/customer";

const C = {
  primary: "#00C6A2", dark: "#00A88A", light: "#E6FAF7",
  accent: "#6C63FF", accentLight: "#EFEDFF",
  bg: "#F0FAF8", white: "#FFFFFF", text: "#1A2E2B", sub: "#6B8F89",
  border: "#C8E8E3", danger: "#EF4444", dangerLight: "#FEE2E2",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}{required && <Text style={{ color: C.danger }}> *</Text>}</Text>
      {children}
    </View>
  );
}

export default function CustomerProfile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const [address, setAddress]     = useState("");
  const [landmark, setLandmark]   = useState("");
  const [locLink, setLocLink]     = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);
  const [focused, setFocused]     = useState<string | null>(null);

  const load = async () => {
    const r = await customerService.getBalance();
    if (r.success && r.data) {
      setAddress(r.data.address || "");
      setLandmark(r.data.landmark || "");
      setLocLink(r.data.locationLink || "");
    }
    setLoading(false);
    setDirty(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert("Diqqat", "Manzil kiritilishi shart");
      return;
    }
    setSaving(true);
    const r = await customerService.updateAddress({
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      locationLink: locLink.trim() || undefined,
    });
    setSaving(false);
    if (r.success) {
      Alert.alert("✅ Muvaffaqiyat", "Manzilingiz yangilandi!");
      setDirty(false);
    } else {
      Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
    }
  };

  const handleOpenMap = () => {
    if (locLink.trim()) {
      Linking.openURL(locLink.trim()).catch(() =>
        Alert.alert("Xato", "Harita linkini ochib bo'lmadi")
      );
    } else {
      Alert.alert(
        "📍 Manzil linki",
        "Google Maps da o'z manzilingizni topib, 'Ulashish' → linkni nusxalab shu yerga joylashtiring"
      );
    }
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

  const inputStyle = (name: string) => [
    styles.input,
    focused === name && styles.inputFocused,
  ];

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
        {/* Manzil bloki */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📍 Manzilim</Text>
            {dirty && (
              <View style={styles.dirtyBadge}>
                <Text style={styles.dirtyText}>• O'zgartirildi</Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ paddingVertical: 20 }} />
          ) : (
            <>
              <Field label="To'liq manzil" required>
                <TextInput
                  style={inputStyle("address")}
                  value={address}
                  onChangeText={(v) => { setAddress(v); setDirty(true); }}
                  placeholder="Ko'cha, uy raqami, kvartira..."
                  placeholderTextColor={C.sub}
                  onFocus={() => setFocused("address")}
                  onBlur={() => setFocused(null)}
                  multiline
                  numberOfLines={2}
                />
              </Field>

              <Field label="Mo'ljal (oriyantr)">
                <TextInput
                  style={inputStyle("landmark")}
                  value={landmark}
                  onChangeText={(v) => { setLandmark(v); setDirty(true); }}
                  placeholder="Masalan: maktab yonida, darvoza yashil..."
                  placeholderTextColor={C.sub}
                  onFocus={() => setFocused("landmark")}
                  onBlur={() => setFocused(null)}
                />
              </Field>

              <Field label="Google Maps harita linki">
                <View style={styles.mapRow}>
                  <TextInput
                    style={[inputStyle("loc"), { flex: 1 }]}
                    value={locLink}
                    onChangeText={(v) => { setLocLink(v); setDirty(true); }}
                    placeholder="https://maps.google.com/..."
                    placeholderTextColor={C.sub}
                    onFocus={() => setFocused("loc")}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <TouchableOpacity style={styles.mapBtn} onPress={handleOpenMap}>
                    <Text style={styles.mapBtnText}>🗺️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.mapHint}>
                  💡 Google Maps → Joylashuv → "Ulashish" → linkni nusxalang
                </Text>
              </Field>

              <TouchableOpacity
                style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!dirty || saving}
              >
                {saving
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={styles.saveBtnText}>💾 Manzilni saqlash</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Ilova haqida */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ Ilova haqida</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versiya</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
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
  dirtyBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dirtyText:  { fontSize: 11, color: "#92400E", fontWeight: "600" },

  fieldLabel: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6 },
  input:      {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, backgroundColor: "#F8FFFE",
    textAlignVertical: "top",
  },
  inputFocused: { borderColor: C.primary, backgroundColor: C.light },

  mapRow:     { flexDirection: "row", gap: 8 },
  mapBtn:     {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.light,
    alignItems: "center", justifyContent: "center",
  },
  mapBtnText: { fontSize: 22 },
  mapHint:    { fontSize: 11, color: C.sub, marginTop: 6, lineHeight: 16 },

  saveBtn:    {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 4,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  saveBtnText:{ fontSize: 15, fontWeight: "700", color: C.white },

  infoRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.light },
  infoLabel:  { fontSize: 13, color: C.sub },
  infoValue:  { fontSize: 13, fontWeight: "600", color: C.text },

  logoutBtn:  {
    borderWidth: 1.5, borderColor: C.danger + "60", borderRadius: 14,
    paddingVertical: 15, alignItems: "center", backgroundColor: C.white,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: C.danger },
});
