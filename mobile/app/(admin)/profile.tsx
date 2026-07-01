/**
 * Admin/Director profil ekrani (2026 redesign)
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button, Input, Screen } from "@/components/ui";
import { SecurityCard } from "@/components/SecurityCard";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import { theme, palette, gradients, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

interface ProfileData {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

async function getProfile() {
  return api.get<ProfileData>("/profile");
}

async function updateProfile(data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) {
  return api.put("/profile", data);
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRECTOR: "Direktor",
  OPERATOR: "Operator",
  DRIVER: "Haydovchi",
  CUSTOMER: "Mijoz",
};

function getPasswordStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: theme.textMuted };
  let s = 0;
  if (p.length >= 6) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { score: 1, label: "Kuchsiz parol", color: theme.danger };
  if (s === 2) return { score: 2, label: "O'rtacha parol", color: palette.amber600 };
  return { score: 3, label: "Kuchli xavfsiz parol", color: theme.success };
}

export default function AdminProfileScreen() {
  const logoutUser = useAuthStore((s) => s.logout);
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loadData = async () => {
    setLoading(true);
    const r = await getProfile();
    if (r.success && r.data) {
      setProfile(r.data);
      setName(r.data.name);
      setPhone(r.data.phone);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Xato", "Ism va telefon maydonlarini to'ldiring");
      return;
    }
    const payload: any = { name, phone };
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        Alert.alert("Xato", "Parolni o'zgartirish uchun joriy va yangi parollarni kiriting");
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert("Xato", "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    setSaving(true);
    const r = await updateProfile(payload);
    setSaving(false);
    if (r.success) {
      Alert.alert("Muvaffaqiyatli", "Profil ma'lumotlari yangilandi");
      setCurrentPassword("");
      setNewPassword("");
      loadData();
    } else {
      Alert.alert("Xatolik", (r as any).error || "Ma'lumotlarni saqlashda xato yuz berdi");
    }
  };

  const handleLogout = () => {
    Alert.alert("Tizimdan chiqish", "Haqiqatan ham profilingizdan chiqmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "Chiqish",
        style: "destructive",
        onPress: async () => {
          await logoutUser();
          router.replace("/(auth)/login");
        },
      },
    ]);
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

  const strength = getPasswordStrength(newPassword);
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "A";

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profil</Text>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={shadow.brandSoft}>
            <LinearGradient colors={gradients.brand} style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>{profile?.name}</Text>
          <View style={styles.roleBadge}>
            <Feather name="shield" size={12} color={theme.primaryDark} />
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[profile?.role || ""] || profile?.role}</Text>
          </View>
          <Text style={styles.joinedText}>
            Tizimda: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("uz-UZ") : "-"}
          </Text>
        </View>

        {/* Shaxsiy ma'lumotlar */}
        <Text style={styles.sectionTitle}>Shaxsiy ma'lumotlar</Text>
        <View style={styles.card}>
          <Input label="To'liq ismingiz (F.I.Sh)" placeholder="Ismingizni kiriting" value={name} onChangeText={setName} icon="user" />
          <Input label="Telefon raqamingiz" placeholder="998901234567" keyboardType="numeric" value={phone} onChangeText={setPhone} icon="phone" editable={false} />
        </View>

        {/* Boshqaruv */}
        <Text style={styles.sectionTitle}>Boshqaruv</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(admin)/products")} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Feather name="box" size={20} color={theme.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>Mahsulotlar</Text>
                <Text style={styles.menuItemDesc}>Narxlar va mahsulotlarni boshqarish</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Xavfsizlik */}
        <SecurityCard />

        {/* Xavfsizlik */}
        <Text style={styles.sectionTitle}>Xavfsizlik va parol</Text>
        <View style={styles.card}>
          <Input label="Joriy parolingiz" placeholder="Eski parolni kiriting" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} icon="lock" />
          <Input label="Yangi parol" placeholder="Yangi kuchli parol yarating" secureTextEntry value={newPassword} onChangeText={setNewPassword} icon="key" />
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                <View style={[styles.bar, strength.score >= 1 && { backgroundColor: strength.color }]} />
                <View style={[styles.bar, strength.score >= 2 && { backgroundColor: strength.color }]} />
                <View style={[styles.bar, strength.score >= 3 && { backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <Button title={saving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"} onPress={handleSave} loading={saving} />
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={18} color={theme.danger} />
            <Text style={styles.logoutText}>Tizimdan chiqish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 120, paddingHorizontal: spacing.xl },
  pageTitle: { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.6, marginBottom: spacing.lg },

  headerCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    backgroundColor: theme.surface,
    borderRadius: radius["2xl"],
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.base },
  avatarText: { fontSize: fontSize["3xl"], fontWeight: fontWeight.black, color: "#fff", letterSpacing: -1 },
  profileName: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.5 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  roleBadgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.primaryDark },
  joinedText: { fontSize: fontSize.xs, color: theme.textSecondary, marginTop: spacing.sm, fontWeight: fontWeight.medium },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingLeft: 2,
  },
  card: {
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },

  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  menuIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  menuItemTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },
  menuItemDesc: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium, marginTop: 2 },

  strengthContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginTop: -spacing.sm },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2 },
  strengthLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textAlign: "right", minWidth: 110 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.dangerSoft,
    borderRadius: radius.lg,
    height: 52,
  },
  logoutText: { color: theme.danger, fontSize: fontSize.base, fontWeight: fontWeight.bold },
});
