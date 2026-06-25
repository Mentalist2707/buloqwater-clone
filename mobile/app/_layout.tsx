import { useEffect, useRef } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { Colors } from "@/constants";
import { api } from "@/services/api";

export default function RootLayout() {
  const { isAuthenticated, isLoading, user, loadStoredAuth, logout } = useAuthStore();
  const segments = useSegments();
  const suspendCheckDone = useRef(false);

  // Ilova ochilganda saqlangan auth'ni yuklash
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  // Auth holatiga qarab routing
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      suspendCheckDone.current = false;
      navigateByRole(user?.role);
    } else if (isAuthenticated && !inAuthGroup && user?.role !== "SUPER_ADMIN") {
      // Check if company is suspended once per session
      if (!suspendCheckDone.current) {
        suspendCheckDone.current = true;
        checkCompanySuspended(logout);
      }
    }
  }, [isAuthenticated, isLoading, segments, user, logout]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {/* Impersonate banner — ilovaning eng yuqorisida */}
      <ImpersonateBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(superadmin)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(operator)" />
        <Stack.Screen name="(customer)" />
      </Stack>
    </>
  );
}

// ─── Impersonate Banner ──────────────────────────────────────
function ImpersonateBanner() {
  const { isImpersonating, user, originalUser, stopImpersonate } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isImpersonating) return null;

  const handleExit = () => {
    Alert.alert(
      "🔑 Firmadan chiqish",
      `"${user?.company?.name ?? user?.name}" firmasi panelidan chiqib, Super Admin panelga qaytasizmi?`,
      [
        { text: "Qolish", style: "cancel" },
        {
          text: "Super Admin panelga qaytish",
          onPress: async () => {
            await stopImpersonate();
            router.replace("/(superadmin)/companies");
          },
        },
      ]
    );
  };

  return (
    <View style={[banner.container, { paddingTop: insets.top + 6 }]}>
      <View style={banner.left}>
        <Text style={banner.icon}>🔑</Text>
        <View>
          <Text style={banner.title} numberOfLines={1}>
            {user?.company?.name ?? user?.name}
          </Text>
          <Text style={banner.sub}>
            {originalUser?.name} sifatida monitoring
          </Text>
        </View>
      </View>
      <TouchableOpacity style={banner.exitBtn} onPress={handleExit}>
        <Text style={banner.exitText}>Chiqish ✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const banner = StyleSheet.create({
  container: {
    backgroundColor: "#92400E",           // amber-800 — diqqatni jalb qiladi
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 999,
  },
  left:     { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  icon:     { fontSize: 18 },
  title:    { fontSize: 13, fontWeight: "700", color: "#FEF3C7", maxWidth: 160 },
  sub:      { fontSize: 11, color: "#FDE68A", marginTop: 1 },
  exitBtn:  {
    backgroundColor: "#B45309",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  exitText: { fontSize: 12, fontWeight: "700", color: "#FEF3C7" },
});

// ─── Helpers ─────────────────────────────────────────────────
async function checkCompanySuspended(logout: () => Promise<void>) {
  try {
    const r = await api.get<any>("/auth/me");
    if (r.success && r.data?.company?.status === "SUSPENDED") {
      await logout();
      router.replace("/(auth)/login");
      setTimeout(() => {
        Alert.alert(
          "🚫 Kompaniya bloklangan",
          "Kompaniyangiz vaqtincha bloklangan. Administrator bilan bog'laning: +998901234567",
          [{ text: "OK" }]
        );
      }, 500);
    }
  } catch {
    // Network error — ignore
  }
}

function navigateByRole(role?: string) {
  switch (role) {
    case "DRIVER":      router.replace("/(driver)/tasks"); break;
    case "DIRECTOR":    router.replace("/(admin)/dashboard"); break;
    case "SUPER_ADMIN": router.replace("/(superadmin)/dashboard"); break;
    case "CUSTOMER":    router.replace("/(customer)/home"); break;
    case "OPERATOR":    router.replace("/(operator)/orders"); break;
    default:            router.replace("/(operator)/orders");
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});
