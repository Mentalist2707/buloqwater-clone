import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Card, Button } from "@/components/ui";
import { Colors } from "@/constants";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import type { CompanyOption } from "@/types";

export default function SelectCompanyScreen() {
  const { pendingCompanies, pendingPhone, pendingPassword, setAuth, clearPendingSelection } =
    useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (option: CompanyOption) => {
    if (!pendingPhone || !pendingPassword) return;

    setLoading(option.company.id);
    try {
      const result = await authService.selectCompany(
        pendingPhone,
        pendingPassword,
        option.company.id
      );

      if (!result.success) {
        Alert.alert("Xatolik", result.error || "Tizimda xatolik");
        return;
      }

      const data = result.data!;
      clearPendingSelection();
      await setAuth(data.token!, data.user!);

      // Role-based navigate
      switch (data.user!.role) {
        case "DRIVER":
          router.replace("/(driver)/tasks");
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

  const renderCompany = ({ item }: { item: CompanyOption }) => (
    <TouchableOpacity
      onPress={() => handleSelect(item)}
      disabled={loading !== null}
      activeOpacity={0.7}
    >
      <Card style={[styles.companyCard, loading === item.company.id && styles.selectedCard]}>
        <View style={styles.companyHeader}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyIconText}>🏢</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{item.company.name}</Text>
            <Text style={styles.companyRole}>
              {getRoleName(item.role)}
            </Text>
          </View>
          {loading === item.company.id ? (
            <Text style={styles.loadingText}>...</Text>
          ) : (
            <Text style={styles.arrow}>→</Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (!pendingCompanies || pendingCompanies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Kompaniyalar topilmadi</Text>
        <Button title="Orqaga" onPress={handleBack} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kompaniyani tanlang</Text>
        <Text style={styles.subtitle}>
          Sizning akkauntingiz bir nechta kompaniyada ro'yxatdan o'tgan
        </Text>
      </View>

      <FlatList
        data={pendingCompanies}
        renderItem={renderCompany}
        keyExtractor={(item) => item.company.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <Button
        title="Orqaga"
        onPress={handleBack}
        variant="outline"
        style={styles.backButton}
      />
    </View>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.gray[500], lineHeight: 20 },
  list: { paddingBottom: 20 },
  companyCard: { padding: 16 },
  selectedCard: { borderColor: Colors.primary, borderWidth: 2 },
  companyHeader: { flexDirection: "row", alignItems: "center" },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  companyIconText: { fontSize: 22 },
  companyInfo: { flex: 1, marginLeft: 12 },
  companyName: { fontSize: 16, fontWeight: "600", color: Colors.gray[900] },
  companyRole: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  arrow: { fontSize: 20, color: Colors.gray[400] },
  loadingText: { fontSize: 16, color: Colors.primary },
  backButton: { marginTop: 16, marginBottom: 32 },
  emptyText: { fontSize: 16, color: Colors.gray[500], textAlign: "center", marginBottom: 20 },
});
