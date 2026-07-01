/**
 * Customer — Kompaniya qidirish va a'zo bo'lish ekrani.
 * ────────────────────────────────────────────────────────────
 * Mijoz o'ziga yoqqan suv kompaniyasini qidiradi va bir tugma bilan
 * a'zo bo'ladi. A'zo bo'lgach o'sha kompaniya mahsulotlari vitrinada
 * ko'rinadi.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { companiesService } from "@/services/companies";
import type { CompanySearchResult } from "@/types";
import { theme, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

export default function CompaniesScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CompanySearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    const res = await companiesService.search(q);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load(query.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [query, load]);

  const join = (c: CompanySearchResult) => {
    Alert.alert(
      "A'zo bo'lish",
      `"${c.name}" kompaniyasiga mijoz sifatida qo'shilasizmi? So'ngra uning mahsulotlarini buyurtma qilishingiz mumkin.`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "A'zo bo'lish",
          onPress: async () => {
            setJoiningId(c.id);
            const res = await companiesService.join(c.id);
            setJoiningId(null);
            if (res.success) {
              setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, isMember: true } : x)));
              Alert.alert("Tabriklaymiz!", `Siz "${c.name}" mijozi bo'ldingiz`, [
                { text: "Mahsulotlar", onPress: () => router.replace("/(customer)/order") },
                { text: "Yaxshi" },
              ]);
            } else {
              Alert.alert("Xatolik", (res as any).error || "A'zo bo'lishda xatolik");
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Kompaniyalar</Text>
          <Text style={styles.subtitle}>Yoqqan kompaniyangizga a'zo bo'ling</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kompaniya nomi..."
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Feather name="x" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="search" size={30} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Kompaniya topilmadi</Text>
              <Text style={styles.emptyText}>Boshqa nom bilan qidirib ko'ring</Text>
            </View>
          ) : (
            items.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.logo}>
                  <Ionicons name="business" size={22} color={theme.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {c.productCount} ta mahsulot
                    {c.address ? ` · ${c.address}` : ""}
                  </Text>
                </View>
                {c.isMember ? (
                  <View style={styles.memberBadge}>
                    <Feather name="check" size={13} color={theme.success} />
                    <Text style={styles.memberText}>A'zo</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => join(c)}
                    disabled={joiningId === c.id}
                    activeOpacity={0.85}
                  >
                    {joiningId === c.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Feather name="plus" size={14} color="#fff" />
                        <Text style={styles.joinText}>A'zo bo'lish</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.4 },
  subtitle: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium, marginTop: 2 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.base,
    paddingHorizontal: spacing.base,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: { flex: 1, fontSize: fontSize.base, color: theme.text },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  logo: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  meta: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },

  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 96,
    justifyContent: "center",
  },
  joinText: { color: "#fff", fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.successSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  memberText: { color: theme.success, fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["4xl"], gap: spacing.sm },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: theme.text },
  emptyText: { fontSize: fontSize.sm, color: theme.textSecondary },
});
