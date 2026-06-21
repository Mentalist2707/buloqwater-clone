import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { Colors } from "@/constants";
import { useAuthStore } from "@/store/auth";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

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

  const getRoleName = (role?: string) => {
    const names: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      DIRECTOR: "Direktor",
      OPERATOR: "Operator",
      DRIVER: "Haydovchi",
      CUSTOMER: "Mijoz",
    };
    return names[role || ""] || role;
  };

  return (
    <View style={styles.container}>
      {/* User Info */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>{getRoleName(user?.role)}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </Card>

      {/* Company Info */}
      {user?.company && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Kompaniya</Text>
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

      {/* App Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Ilova haqida</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  profileCard: {
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: Colors.primaryDark },
  name: { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  role: { fontSize: 14, color: Colors.primary, fontWeight: "500", marginTop: 4 },
  phone: { fontSize: 14, color: Colors.gray[500], marginTop: 4 },
  infoCard: { padding: 16, marginBottom: 12 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: Colors.gray[700], marginBottom: 10 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: Colors.gray[500] },
  infoValue: { fontSize: 14, fontWeight: "500", color: Colors.gray[800] },
  logoutBtn: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.dangerLight,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: Colors.danger },
});
