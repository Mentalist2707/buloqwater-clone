import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "@/store/auth";
import { Colors } from "@/constants";

export default function RootLayout() {
  const { isAuthenticated, isLoading, user, loadStoredAuth } = useAuthStore();
  const segments = useSegments();

  // Ilova ochilganda saqlangan auth'ni yuklash
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Auth holatiga qarab routing
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Login'ga yo'naltirish
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Role-based redirect
      navigateByRole(user?.role);
    }
  }, [isAuthenticated, isLoading, segments]);

  // Loading holati
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(operator)" />
      </Stack>
    </>
  );
}

function navigateByRole(role?: string) {
  switch (role) {
    case "DRIVER":
      router.replace("/(driver)/tasks");
      break;
    case "OPERATOR":
    case "DIRECTOR":
    case "SUPER_ADMIN":
      router.replace("/(operator)/orders");
      break;
    default:
      router.replace("/(operator)/orders");
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
