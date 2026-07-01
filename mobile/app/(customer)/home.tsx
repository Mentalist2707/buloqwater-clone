/**
 * Customer — Bosh sahifa (2026 redesign)
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { customerService } from "@/services/customer";
import { Screen } from "@/components/ui";
import {
  theme,
  palette,
  gradients,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";

export default function CustomerHome() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState({
    bottleBalance: 0,
    debtBalance: 0,
    name: "",
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const r = await customerService.getBalance();
    if (r.success && r.data) setBalance(r.data);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Xayrli tong" : hour < 17 ? "Xayrli kun" : "Xayrli kech";
  const hasDebt = balance.debtBalance > 0;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 200 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || "Mijoz"}
            </Text>
          </View>
          <View style={shadow.brandSoft}>
            <LinearGradient colors={gradients.brand} style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {(user?.name || "M").charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Hero balans karta */}
        <LinearGradient
          colors={gradients.ocean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, shadow.brand]}
        >
          <View style={styles.heroWave} pointerEvents="none" />
          <View style={styles.heroTopRow}>
            <View style={styles.heroChip}>
              <Ionicons name="water" size={13} color="#FFF" />
              <Text style={styles.heroChipText}>BuloqWater</Text>
            </View>
            {user?.phone ? (
              <View style={styles.heroChip}>
                <Feather name="phone" size={11} color="#FFF" />
                <Text style={styles.heroChipText}>{user.phone}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View style={styles.heroStatIcon}>
                <MaterialCommunityIcons name="bottle-soda-classic-outline" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.heroStatValue}>{balance.bottleBalance}</Text>
                <Text style={styles.heroStatLabel}>Idish qarzi</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <View style={styles.heroStatIcon}>
                <Feather name={hasDebt ? "credit-card" : "check-circle"} size={18} color="#FFF" />
              </View>
              <View>
                <Text style={styles.heroStatValue}>
                  {hasDebt ? `${(balance.debtBalance / 1000).toFixed(0)}K` : "0"}
                </Text>
                <Text style={styles.heroStatLabel}>{hasDebt ? "Qarz (so'm)" : "Qarz yo'q"}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Tezkor amallar */}
        <Text style={styles.sectionTitle}>Tezkor amallar</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon={<Ionicons name="water-outline" size={24} color={palette.aqua600} />}
            label="Suv buyurtma"
            bg={palette.aqua50}
            onPress={() => router.push("/(customer)/order")}
          />
          <QuickAction
            icon={<Feather name="clock" size={22} color={palette.ocean600} />}
            label="Buyurtmalar"
            bg={palette.aqua100}
            onPress={() => router.push("/(customer)/history")}
          />
          <QuickAction
            icon={<Feather name="map-pin" size={22} color={palette.amber600} />}
            label="Manzilim"
            bg={palette.amber100}
            onPress={() => router.push("/(customer)/profile")}
          />
          <QuickAction
            icon={<Ionicons name="business-outline" size={22} color={palette.violet600} />}
            label="Kompaniyalar"
            bg={palette.violet100}
            onPress={() => router.push("/(customer)/companies")}
          />
        </View>

        {/* Yo'riqnoma */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Feather name="info" size={18} color={theme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Buyurtma qanday ishlaydi?</Text>
            <Text style={styles.infoText}>
              Suv buyurtma bering → Haydovchi bog'lanadi → Yetkazilgach bo'sh idishni qaytaring.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating order button */}
      <View style={[styles.fab, { bottom: insets.bottom + 96 }, shadow.brand]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/(customer)/order")}>
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="water" size={20} color="#FFF" />
            <Text style={styles.fabText}>Buyurtma berish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

function QuickAction({
  icon,
  label,
  bg,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary },
  userName: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.extrabold,
    color: theme.text,
    letterSpacing: -0.6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: "#FFF" },

  // Hero
  hero: {
    marginHorizontal: spacing.xl,
    borderRadius: radius["2xl"],
    padding: spacing.xl,
    overflow: "hidden",
    marginBottom: spacing["2xl"],
  },
  heroWave: {
    position: "absolute",
    right: -60,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  heroChipText: { color: "#FFF", fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroStatIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatValue: { fontSize: fontSize["2xl"], fontWeight: fontWeight.black, color: "#FFF" },
  heroStatLabel: { fontSize: fontSize.xs, color: "rgba(255,255,255,0.85)", fontWeight: fontWeight.medium },
  heroDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: spacing.base },

  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: theme.text,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  quickItem: {
    width: "47.5%",
    backgroundColor: theme.surface,
    padding: spacing.base,
    borderRadius: radius.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: theme.primaryTint,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: palette.aqua200,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text, marginBottom: 2 },
  infoText: { fontSize: fontSize.sm, color: theme.textSecondary, lineHeight: 19, fontWeight: fontWeight.medium },

  fab: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  fabInner: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  fabText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: "#FFF" },
});
