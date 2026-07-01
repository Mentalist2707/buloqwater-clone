import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Alert } from "@/utils/alert";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { SecurityCard } from "@/components/SecurityCard";
import { useAuthStore } from "@/store/auth";
import { theme, gradients, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

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

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "O";

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Profil</Text>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={shadow.brandSoft}>
            <LinearGradient colors={gradients.brand} style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Feather name="shield" size={12} color={theme.primaryDark} />
            <Text style={styles.roleBadgeText}>{getRoleName(user?.role)}</Text>
          </View>
          <View style={styles.phoneRow}>
            <Feather name="phone" size={14} color={theme.textSecondary} />
            <Text style={styles.phoneText}>{user?.phone}</Text>
          </View>
        </View>

        {user?.company && (
          <>
            <Text style={styles.sectionTitle}>Kompaniya</Text>
            <View style={styles.infoCard}>
              <InfoRow icon="briefcase" label="Nomi" value={user.company.name} />
              <View style={styles.divider} />
              <InfoRow icon="link" label="Subdomen" value={user.company.subdomain} />
            </View>
          </>
        )}

        <SecurityCard />

        <Text style={styles.sectionTitle}>Ilova haqida</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="info" label="Versiya" value="1.0.0" />
          <View style={styles.divider} />
          <InfoRow icon="smartphone" label="Platforma" value="BuloqWater Mobile" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={theme.danger} />
          <Text style={styles.logoutText}>Tizimdan chiqish</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Feather name={icon} size={17} color={theme.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  phoneText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingLeft: 2,
  },
  infoCard: {
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  infoLabel: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  infoValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text, flexShrink: 1, textAlign: "right", marginLeft: spacing.md },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: spacing.xs },

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
    marginTop: spacing.xs,
  },
  logoutText: { color: theme.danger, fontSize: fontSize.base, fontWeight: fontWeight.bold },
});
