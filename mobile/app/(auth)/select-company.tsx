import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Alert } from "@/utils/alert";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button, Header, Screen } from "@/components/ui";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import type { CompanyOption } from "@/types";
import { theme, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

export default function SelectCompanyScreen() {
  const { pendingCompanies, pendingPhone, pendingPassword, setAuth, clearPendingSelection } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (option: CompanyOption) => {
    if (!pendingPhone || !pendingPassword) return;
    setLoading(option.company.id);
    try {
      const result = await authService.selectCompany(pendingPhone, pendingPassword, option.company.id);
      if (!result.success) {
        Alert.alert("Xatolik", result.error || "Tizimda xatolik");
        return;
      }
      const data = result.data!;
      clearPendingSelection();
      await setAuth(data.token!, data.user!);
      switch (data.user!.role) {
        case "DRIVER":
          router.replace("/(driver)/tasks");
          break;
        case "DIRECTOR":
          router.replace("/(admin)/dashboard");
          break;
        case "CUSTOMER":
          router.replace("/(customer)/home");
          break;
        case "OPERATOR":
          router.replace("/(operator)/orders");
          break;
        default:
          router.replace("/(operator)/orders");
      }
    } catch (e) {
      Alert.alert("Xatolik", "Tarmoq xatosi");
    } finally {
      setLoading(null);
    }
  };

  const handleBack = () => {
    clearPendingSelection();
    router.back();
  };

  const renderCompany = ({ item }: { item: CompanyOption }) => {
    const isLoading = loading === item.company.id;
    return (
      <TouchableOpacity onPress={() => handleSelect(item)} disabled={loading !== null} activeOpacity={0.75}>
        <View style={[styles.companyCard, isLoading && styles.selectedCard]}>
          <View style={styles.companyIcon}>
            <Feather name="home" size={20} color={theme.primaryDark} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{item.company.name}</Text>
            <Text style={styles.companyRole}>{getRoleName(item.role)}</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!pendingCompanies || pendingCompanies.length === 0) {
    return (
      <Screen>
        <Header title="Kompaniya tanlash" onBack={handleBack} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Kompaniyalar topilmadi</Text>
          <Button title="Orqaga" onPress={handleBack} variant="outline" fullWidth={false} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Kompaniyani tanlang" subtitle="Akkauntingiz bir nechta kompaniyada mavjud" onBack={handleBack} />
      <FlatList
        data={pendingCompanies}
        renderItem={renderCompany}
        keyExtractor={(item) => item.company.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </Screen>
  );
}

function getRoleName(role: string): string {
  const names: Record<string, string> = {
    DIRECTOR: "Direktor",
    OPERATOR: "Operator",
    DRIVER: "Haydovchi",
    CUSTOMER: "Mijoz",
  };
  return names[role] || role;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  companyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.sm,
  },
  selectedCard: { borderColor: theme.primary, borderWidth: 2 },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: theme.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  companyInfo: { flex: 1 },
  companyName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.text },
  companyRole: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.base, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: fontSize.md, color: theme.textSecondary, fontWeight: fontWeight.medium },
});
