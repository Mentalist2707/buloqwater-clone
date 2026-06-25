/**
 * Admin/Director profil ekrani
 * Web: /admin/profile — Ism, telefon tahrirlash + parol o'zgartirish
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

function getPasswordStrength(password: string) {
  if (!password) return { level: 0, label: "", color: Colors.gray[200] };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Kuchsiz", color: Colors.danger };
  if (score <= 2) return { level: 2, label: "O'rtacha", color: Colors.warning };
  if (score <= 3) return { level: 3, label: "Yaxshi", color: Colors.primary };
  return { level: 4, label: "Kuchli", color: Colors.success };
}

export default function AdminProfileScreen() {
  const { user, logout, setAuth, token } = useAuthStore();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const load = async () => {
    const r = await getProfile();
    if (r.success && r.data) {
      setProfile(r.data);
      setName(r.data.name);
      setPhone(r.data.phone);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Diqqat", "Ism bo'sh bo'lishi mumkin emas");
      return;
    }
    setSaving(true);
    const rawPhone = phone.startsWith("+") ? phone.replace(/\s/g, "") : `+998${phone.replace(/\D/g, "")}`;
    const r = await updateProfile({ name: name.trim(), phone: rawPhone });
    if (r.success) {
      Alert.alert("✅", "Profil ma'lumotlari muvaffaqiyatli yangilandi!");
      load();
      // Update auth store user name
      if (user && token) {
        await setAuth(token, { ...user, name: name.trim() });
      }
    } else {
      Alert.alert("Xatolik", (r as any).error || "Xatolik yuz berdi");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Diqqat", "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Diqqat", "Yangi parollar bir-biriga mos kelmaydi");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert("Diqqat", "Yangi parol joriy paroldan farqli bo'lishi kerak");
      return;
    }
    setSavingPassword(true);
    const r = await updateProfile({ currentPassword, newPassword });
    if (r.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("✅", "Parol muvaffaqiyatli yangilandi!");
    } else {
      Alert.alert("Xatolik", (r as any).error || "Xatolik yuz berdi");
    }
    setSavingPassword(false);
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

  const passwordStrength = getPasswordStrength(newPassword);
  const isPasswordFormValid =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword === newPassword;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Header */}
      <Card style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.profileName}>{profile?.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{ROLE_LABELS[profile?.role || ""] || profile?.role}</Text>
            </View>
            <Text style={styles.phoneText}>{profile?.phone}</Text>
          </View>
        </View>
      </Card>

      {/* Company Info */}
      {user?.company && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Kompaniya</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomi:</Text>
            <Text style={styles.infoValue}>{user.company.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subdomen:</Text>
            <Text style={styles.infoValue}>{user.company.subdomain}</Text>
          </View>
        </Card>
      )}

      {/* Edit Profile */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Shaxsiy ma'lumotlar</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ism familiya</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ism familiya"
            placeholderTextColor={Colors.gray[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Telefon raqami</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+998901234567"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="phone-pad"
          />
        </View>

        <Button
          title={saving ? "Saqlanmoqda..." : "💾 Saqlash"}
          onPress={handleSaveProfile}
          loading={saving}
          disabled={saving || !name.trim()}
          style={styles.saveBtn}
        />
      </Card>

      {/* Change Password */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🔑</Text>
          <View>
            <Text style={styles.sectionTitle}>Parolni o'zgartirish</Text>
            <Text style={styles.sectionSubtitle}>Xavfsizlik uchun kuchli parol tanlang</Text>
          </View>
        </View>

        {/* Current password */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Joriy parol</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Hozirgi parolingiz"
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry={!showCurrent}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowCurrent(!showCurrent)}
            >
              <Text style={styles.eyeIcon}>{showCurrent ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* New password */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Yangi parol</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Kamida 6 ta belgi"
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowNew(!showNew)}
            >
              <Text style={styles.eyeIcon}>{showNew ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          {/* Strength bar */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          level <= passwordStrength.level
                            ? passwordStrength.color
                            : Colors.gray[200],
                      },
                    ]}
                  />
                ))}
              </View>
              {passwordStrength.label ? (
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Confirm password */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Yangi parolni tasdiqlash</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                confirmPassword.length > 0
                  ? confirmPassword === newPassword
                    ? styles.inputSuccess
                    : styles.inputError
                  : undefined,
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Yangi parolni qayta kiriting"
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Text style={styles.eyeIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && (
            <Text
              style={[
                styles.matchLabel,
                { color: confirmPassword === newPassword ? Colors.success : Colors.danger },
              ]}
            >
              {confirmPassword === newPassword ? "✅ Parollar mos" : "❌ Parollar mos kelmaydi"}
            </Text>
          )}
        </View>

        <Button
          title={savingPassword ? "O'zgartirilmoqda..." : "🔑 Parolni o'zgartirish"}
          onPress={handleChangePassword}
          loading={savingPassword}
          disabled={savingPassword || !isPasswordFormValid}
          style={styles.saveBtn}
        />
      </Card>

      {/* App Info */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ilova haqida</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versiya:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platforma:</Text>
          <Text style={styles.infoValue}>BuloqWater Mobile</Text>
        </View>
      </Card>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Tizimdan chiqish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 60 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: Colors.gray[400], fontSize: 16 },
  headerCard: { padding: 20, marginBottom: 12 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: Colors.primaryDark },
  headerInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: Colors.gray[900] },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  roleText: { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },
  phoneText: { fontSize: 13, color: Colors.gray[500], marginTop: 4 },
  sectionCard: { padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionIcon: { fontSize: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.gray[800], marginBottom: 12 },
  sectionSubtitle: { fontSize: 12, color: Colors.gray[500], marginTop: 1 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  infoLabel: { fontSize: 14, color: Colors.gray[500] },
  infoValue: { fontSize: 14, fontWeight: "500", color: Colors.gray[800] },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 },
  input: {
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.gray[900],
  },
  inputSuccess: { borderColor: Colors.success },
  inputError: { borderColor: Colors.danger },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, paddingRight: 44 },
  eyeBtn: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  eyeIcon: { fontSize: 18 },
  strengthContainer: { marginTop: 8, gap: 4 },
  strengthBars: { flexDirection: "row", gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "600" },
  matchLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  saveBtn: { marginTop: 4 },
  logoutBtn: {
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.dangerLight,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: Colors.danger },
});
