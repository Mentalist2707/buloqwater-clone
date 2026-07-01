import { useEffect, useRef, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, TouchableOpacity, AppState } from "react-native";
import { Alert } from "@/utils/alert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { usePinStore } from "@/store/pin";
import { useNotificationsStore } from "@/store/notifications";
import { api } from "@/services/api";
import SplashAnimation from "@/components/SplashAnimation";
import LockScreen from "@/components/LockScreen";
import AppDialog from "@/components/AppDialog";

export default function RootLayout() {
  const { isAuthenticated, isLoading, user, loadStoredAuth, logout } = useAuthStore();
  const { isReady: pinReady, pinEnabled, isLocked, load: loadPin, lock } = usePinStore();
  const segments = useSegments();
  const suspendCheckDone = useRef(false);
  const [minSplashDone, setMinSplashDone] = useState(false);

  // Ilova ochilganda saqlangan auth va PIN holatini yuklash
  useEffect(() => {
    loadStoredAuth();
    loadPin();
    // Animatsiya ko'rinishi uchun splashni kamida 1.8s ushlab turamiz
    const t = setTimeout(() => setMinSplashDone(true), 1800);
    return () => clearTimeout(t);
  }, [loadStoredAuth, loadPin]);

  // Ilova fon'ga o'tib qaytganda qayta qulflash
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") lock();
      if (state === "active" && useAuthStore.getState().isAuthenticated) {
        useNotificationsStore.getState().fetchUnreadCount();
      }
    });
    return () => sub.remove();
  }, [lock]);

  // O'qilmagan bildirishnomalar sonini davriy yangilash (badge uchun)
  useEffect(() => {
    if (!isAuthenticated) {
      useNotificationsStore.getState().setUnreadCount(0);
      return;
    }
    useNotificationsStore.getState().fetchUnreadCount();
    const id = setInterval(() => {
      useNotificationsStore.getState().fetchUnreadCount();
    }, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

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

  // Yuklanish animatsiyasi — auth/PIN yuklanmaguncha yoki min vaqt tugamaguncha
  if (isLoading || !pinReady || !minSplashDone) {
    return <SplashAnimation />;
  }

  // PIN qulfi — kirilgan bo'lsa va PIN yoqilgan/qulflangan bo'lsa
  const showLock = isAuthenticated && pinEnabled && isLocked;

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
        <Stack.Screen name="pin-setup" />
        <Stack.Screen name="customer/[id]" />
      </Stack>
      {showLock && <LockScreen />}
      <AppDialog />
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
