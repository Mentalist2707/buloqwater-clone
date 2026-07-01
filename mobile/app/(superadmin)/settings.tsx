/**
 * Super Admin — Global sozlamalar
 * Tizim bo'yicha umumiy konfiguratsiya: limitlar, to'lov, bildirishnomalar
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Switch, ActivityIndicator,
  TextInput, Platform,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { Card } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";

const SA_COLOR = "#6366F1";

interface GlobalSettings {
  // Kompaniya limitlari (default)
  defaultMaxCustomers: number;
  defaultMaxUsers: number;
  defaultSubscriptionMonths: number;
  defaultSubscriptionPrice: number;

  // Tizim
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;

  // Bildirishnomalar
  notifyOnNewCompany: boolean;
  notifyOnPayment: boolean;
  notifyOnSubscriptionExpiry: boolean;
  subscriptionExpiryDays: number;   // necha kun oldin ogohlantirish

  // API
  apiRateLimit: number;             // req/min per company
  sessionTimeoutHours: number;
}

// ─── Inline editable number field ──────────────────────────
interface EditableNumberProps {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
}
function EditableNumber({ value, onChange, suffix, min = 0, max = 99999 }: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value));

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= min && n <= max) onChange(n);
    else setDraft(String(value));
    setEditing(false);
  };

  if (editing) {
    return (
      <TextInput
        style={enStyles.input}
        value={draft}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="numeric"
        autoFocus
        selectTextOnFocus
      />
    );
  }
  return (
    <TouchableOpacity onPress={() => { setDraft(String(value)); setEditing(true); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={enStyles.value}>{value}{suffix ? " " + suffix : ""}</Text>
    </TouchableOpacity>
  );
}
const enStyles = StyleSheet.create({
  value: { fontSize: 15, fontWeight: "600", color: SA_COLOR },
  input: {
    fontSize: 15, fontWeight: "600", color: SA_COLOR,
    borderBottomWidth: 1.5, borderBottomColor: SA_COLOR,
    minWidth: 60, textAlign: "right",
    paddingVertical: Platform.OS === "ios" ? 2 : 0,
  },
});

// ─── Row helpers ────────────────────────────────────────────
function SettingRow({
  icon, label, sub, children, last = false,
}: {
  icon?: string; label: string; sub?: string;
  children: React.ReactNode; last?: boolean;
}) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.border]}>
      {icon ? <Text style={rowStyles.icon}>{icon}</Text> : null}
      <View style={rowStyles.text}>
        <Text style={rowStyles.label}>{label}</Text>
        {sub ? <Text style={rowStyles.sub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  icon:   { fontSize: 17, width: 28, textAlign: "center", marginRight: 10 },
  text:   { flex: 1, marginRight: 12 },
  label:  { fontSize: 15, color: Colors.gray[800] },
  sub:    { fontSize: 11, color: Colors.gray[400], marginTop: 2 },
});

export default function SettingsScreen() {
  const [settings, setSettings]   = useState<GlobalSettings | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dirty, setDirty]         = useState(false);

  const load = async () => {
    const r = await api.get<GlobalSettings>("/superadmin/settings");
    if (r.success && r.data) setSettings(r.data);
    setLoading(false);
    setDirty(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const update = <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    if (settings.maintenanceMode) {
      Alert.alert(
        "⚠️ Xizmat ko'rsatish rejimi",
        "Maintenance mode yoqilsa, barcha kompaniyalar tizimga kira olmaydi. Davom etasizmi?",
        [
          { text: "Bekor qilish", style: "cancel" },
          { text: "Saqlash", style: "destructive", onPress: () => doSave() },
        ]
      );
      return;
    }
    doSave();
  };

  const doSave = async () => {
    if (!settings) return;
    setSaving(true);
    const r = await api.put("/superadmin/settings", settings);
    setSaving(false);
    if (r.success) {
      Alert.alert("✅ Muvaffaqiyat", "Sozlamalar saqlandi!");
      setDirty(false);
    } else {
      Alert.alert("Xato", (r as any).error || "Xatolik yuz berdi");
    }
  };

  if (loading || !settings) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={SA_COLOR} />
        <Text style={styles.loadingText}>Sozlamalar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Global sozlamalar</Text>
          {dirty && <Text style={styles.dirtyHint}>• Saqlanmagan o'zgarishlar bor</Text>}
        </View>
        {dirty && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.saveBtnText}>Saqlash</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tizim holati ───────────────────────────────── */}
        <Text style={styles.sectionTitle}>Tizim holati</Text>
        <Card style={styles.card} padding={0}>
          <SettingRow
            icon="🛠️"
            label="Texnik ishlar rejimi"
            sub="Yoqilsa — barcha kompaniyalar bloklangan ko'rinadi"
          >
            <Switch
              value={settings.maintenanceMode}
              onValueChange={(v) => update("maintenanceMode", v)}
              trackColor={{ false: Colors.gray[200], true: Colors.danger }}
              thumbColor={Colors.white}
            />
          </SettingRow>
          <SettingRow
            icon="📝"
            label="Yangi ro'yxatdan o'tish"
            sub="Yangi kompaniya ro'yxatdan o'ta oladimi"
          >
            <Switch
              value={settings.allowNewRegistrations}
              onValueChange={(v) => update("allowNewRegistrations", v)}
              trackColor={{ false: Colors.gray[200], true: SA_COLOR }}
              thumbColor={Colors.white}
            />
          </SettingRow>
          <SettingRow
            icon="📧"
            label="Email tasdiqlash"
            sub="Ro'yxatdan o'tishda email tasdiq talab qilinsin"
            last
          >
            <Switch
              value={settings.requireEmailVerification}
              onValueChange={(v) => update("requireEmailVerification", v)}
              trackColor={{ false: Colors.gray[200], true: SA_COLOR }}
              thumbColor={Colors.white}
            />
          </SettingRow>
        </Card>

        {/* ── Yangi kompaniya limitlari ───────────────────── */}
        <Text style={styles.sectionTitle}>Yangi kompaniya — standart limitlar</Text>
        <Card style={styles.card} padding={0}>
          <SettingRow icon="🧑‍💼" label="Maksimal mijozlar" sub="Har bir yangi kompaniya uchun">
            <EditableNumber
              value={settings.defaultMaxCustomers}
              onChange={(v) => update("defaultMaxCustomers", v)}
              suffix="ta"
              min={10}
              max={100000}
            />
          </SettingRow>
          <SettingRow icon="👥" label="Maksimal xodimlar" sub="Operator, haydovchi va boshqalar">
            <EditableNumber
              value={settings.defaultMaxUsers}
              onChange={(v) => update("defaultMaxUsers", v)}
              suffix="ta"
              min={1}
              max={1000}
            />
          </SettingRow>
          <SettingRow icon="📅" label="Obuna muddati" sub="Yaratilganda standart obuna davomiyligi">
            <EditableNumber
              value={settings.defaultSubscriptionMonths}
              onChange={(v) => update("defaultSubscriptionMonths", v)}
              suffix="oy"
              min={1}
              max={36}
            />
          </SettingRow>
          <SettingRow icon="💰" label="Standart obuna narxi" sub="So'mda" last>
            <EditableNumber
              value={settings.defaultSubscriptionPrice}
              onChange={(v) => update("defaultSubscriptionPrice", v)}
              suffix="so'm"
              min={0}
              max={10_000_000}
            />
          </SettingRow>
        </Card>

        {/* ── Bildirishnomalar ────────────────────────────── */}
        <Text style={styles.sectionTitle}>Bildirishnomalar</Text>
        <Card style={styles.card} padding={0}>
          <SettingRow icon="🏢" label="Yangi kompaniya qo'shilganda">
            <Switch
              value={settings.notifyOnNewCompany}
              onValueChange={(v) => update("notifyOnNewCompany", v)}
              trackColor={{ false: Colors.gray[200], true: SA_COLOR }}
              thumbColor={Colors.white}
            />
          </SettingRow>
          <SettingRow icon="💳" label="To'lov qabul qilinganda">
            <Switch
              value={settings.notifyOnPayment}
              onValueChange={(v) => update("notifyOnPayment", v)}
              trackColor={{ false: Colors.gray[200], true: SA_COLOR }}
              thumbColor={Colors.white}
            />
          </SettingRow>
          <SettingRow icon="⚠️" label="Obuna tugashidan oldin xabardor qilish">
            <Switch
              value={settings.notifyOnSubscriptionExpiry}
              onValueChange={(v) => update("notifyOnSubscriptionExpiry", v)}
              trackColor={{ false: Colors.gray[200], true: SA_COLOR }}
              thumbColor={Colors.white}
            />
          </SettingRow>
          <SettingRow
            icon="🔔"
            label="Ogohlantirish — necha kun oldin"
            sub="Obuna tugashidan oldin"
            last
          >
            <EditableNumber
              value={settings.subscriptionExpiryDays}
              onChange={(v) => update("subscriptionExpiryDays", v)}
              suffix="kun"
              min={1}
              max={30}
            />
          </SettingRow>
        </Card>

        {/* ── API & Xavfsizlik ────────────────────────────── */}
        <Text style={styles.sectionTitle}>API va xavfsizlik</Text>
        <Card style={styles.card} padding={0}>
          <SettingRow icon="⚡" label="API so'rovlar chastotasi" sub="Har kompaniyaga daqiqada">
            <EditableNumber
              value={settings.apiRateLimit}
              onChange={(v) => update("apiRateLimit", v)}
              suffix="req/min"
              min={10}
              max={10000}
            />
          </SettingRow>
          <SettingRow icon="⏱️" label="Sessiya vaqti" sub="Avtomatik chiqarish" last>
            <EditableNumber
              value={settings.sessionTimeoutHours}
              onChange={(v) => update("sessionTimeoutHours", v)}
              suffix="soat"
              min={1}
              max={720}
            />
          </SettingRow>
        </Card>

        {/* Maintenance mode qizil banner */}
        {settings.maintenanceMode && (
          <View style={styles.maintenanceBanner}>
            <Text style={styles.maintenanceIcon}>🛠️</Text>
            <View>
              <Text style={styles.maintenanceTitle}>Texnik ishlar rejimi yoqilgan!</Text>
              <Text style={styles.maintenanceSub}>
                Barcha kompaniyalar hozir tizimga kira olmaydi
              </Text>
            </View>
          </View>
        )}

        {/* Bottom save button */}
        {dirty && (
          <TouchableOpacity
            style={[styles.bottomSaveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.bottomSaveBtnText}>💾 Barcha o'zgarishlarni saqlash</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },

  loadingBox:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:  { fontSize: 14, color: Colors.gray[500] },

  headerBar:    { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn:      { padding: 4 },
  backIcon:     { fontSize: 30, color: Colors.gray[700], lineHeight: 34 },
  headerTitle:  { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  dirtyHint:    { fontSize: 11, color: Colors.warning, marginTop: 1 },
  saveBtn:      { backgroundColor: SA_COLOR, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:  { fontSize: 14, fontWeight: "600", color: Colors.white },

  content:      { padding: 16, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: Colors.gray[400],
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 8, marginTop: 4, paddingHorizontal: 4,
  },
  card:         { marginBottom: 16, overflow: "hidden" },

  maintenanceBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.dangerLight,
    borderRadius: 14, padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: Colors.danger + "40",
  },
  maintenanceIcon:  { fontSize: 28 },
  maintenanceTitle: { fontSize: 15, fontWeight: "700", color: Colors.danger },
  maintenanceSub:   { fontSize: 12, color: Colors.danger + "cc", marginTop: 2 },

  bottomSaveBtn: {
    backgroundColor: SA_COLOR, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 12,
    shadowColor: SA_COLOR, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  bottomSaveBtnText: { fontSize: 16, fontWeight: "600", color: Colors.white },
});
