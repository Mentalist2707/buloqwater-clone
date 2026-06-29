/**
 * Admin/Director profil ekrani (Premium iOS / Slate Style)
 * Ism, telefon tahrirlash + Parol o'zgartirish va xavfsizlik indikatori
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Card, Button, Input } from "@/components/ui";
import { Colors } from "@/constants";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";

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

async function updateProfile(data: {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
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
  if (!p) return { score: 0, label: "", color: "#94A3B8" };
  let s = 0;
  if (p.length >= 6) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;

  if (s <= 1) return { score: 1, label: "Kuchsiz parol", color: "#DC2626" };
  if (s === 2) return { score: 2, label: "O'rtacha parol", color: "#D97706" };
  return { score: 3, label: "Kuchli xavfsiz parol", color: "#16A34A" };
}

export default function AdminProfileScreen() {
  const logoutUser = useAuthStore((s) => s.logout);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Forma statelari
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

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
    }, [])
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
        onPress: () => {
          logoutUser();
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const strength = getPasswordStrength(newPassword);
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "A";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      
      {/* iOS Style Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{profile?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            🛡️ {ROLE_LABELS[profile?.role || ""] || profile?.role}
          </Text>
        </View>
        <Text style={styles.joinedText}>
          Tizimda yaratilgan sana: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("uz-UZ") : "-"}
        </Text>
      </View>

      {/* Asosiy Ma'lumotlar Kartasi */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Shaxsiy ma'lumotlar</Text>
        <Card style={styles.infoCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>To'liq ismingiz (F.I.Sh):</Text>
            <Input
              placeholder="Ismingizni kiriting"
              value={name}
              onChangeText={setName}
              style={styles.customInput}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Telefon raqamingiz:</Text>
            <Input
              placeholder="998901234567"
              keyboardType="numeric"
              value={phone}
              onChangeText={setPhone}
              style={styles.customInput}
            />
          </View>
        </Card>
      </View>

      {/* Xavfsizlik va Parol Kartasi */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Xavfsizlik va Parol o'zgartirish</Text>
        <Card style={styles.infoCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Joriy parolingiz:</Text>
            <Input
              placeholder="Eski parolni kiriting"
              secureTextEntry={!showPass}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={styles.customInput}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Yangi parol:</Text>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="Yangi kuchli parol yarating"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPass}
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.customTextInput, styles.passwordInput]}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Text style={styles.eyeIcon}>{showPass ? "👁️" : "🙈"}</Text>
              </TouchableOpacity>
            </View>

            {/* Parol mustahkamligi indikatori */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  <View style={[styles.bar, strength.score >= 1 && { backgroundColor: strength.color }]} />
                  <View style={[styles.bar, strength.score >= 2 && { backgroundColor: strength.color }]} />
                  <View style={[styles.bar, strength.score >= 3 && { backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </View>

      {/* Amallar tugmalari */}
      <View style={styles.actionsContainer}>
        <Button
          title={saving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
        />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪 Tizimdan chiqish</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingTop:25,  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  
  // Header Profile Card
  headerCard: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#0284C7" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  
  roleBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#1E40AF" },
  joinedText: { fontSize: 12, color: "#94A3B8", marginTop: 8, fontWeight: "500" },

  // Sections
  sectionContainer: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  
  infoCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  
  customInput: {
    borderRadius: 12,
    height: 50,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    fontSize: 15,
    paddingTop:0
  },

  // Custom styling for password field row
  passwordRow: { position: "relative", flexDirection: "row", alignItems: "center" },
  customTextInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#0F172A",
    height: 46,
  },
  passwordInput: { paddingRight: 44 },
  eyeBtn: { position: "absolute", right: 12, padding: 6, justifyContent: "center", height: "100%" },
  eyeIcon: { fontSize: 16 },

  // Password strength
  strengthContainer: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "600", textAlign: "right", minWidth: 100 },

  // Buttons actions
  actionsContainer: { paddingHorizontal: 16, gap: 12, marginTop: 10 },
  saveBtn: { borderRadius: 12, height: 48 },
  
  logoutBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.15)",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom:60
  },
  logoutText: { color: "#DC2626", fontSize: 14, fontWeight: "600", },
});