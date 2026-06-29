/**
 * Customer Layout — Pastki navigatsiya paneli (Tabs)
 * Barcha tablar Buyurtma tugmasi kabi vizual qobiqqa o'tkazilgan variant
 */
import { Tabs } from "expo-router";
import { StyleSheet, Platform, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ─── Rang Palitrasi ──────────────────────────────────────────
const C = {
  primary: "#06B6D4", // Premium Cyan (Faol rang)
  inactive: "#94A3B8", // Slate 400 (Nofaol belgi)
  tabBg: "rgba(255, 255, 255, 0.96)", // Shaffof oq fon
};

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.inactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      {/* 1. Bosh sahifa */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Bosh sahifa",
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <LinearGradient
                colors={
                  focused ? ["#06B6D4", "#0284C7"] : ["#F1F5F9", "#E2E8F0"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.iconGradient,
                  focused && styles.iconFocusedShadow,
                ]}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={20}
                  color={focused ? "#FFFFFF" : "#64748B"}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* 2. Buyurtma (Markaziy) */}
      <Tabs.Screen
        name="order"
        options={{
          title: "Buyurtma",
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <LinearGradient
                colors={
                  focused ? ["#06B6D4", "#0284C7"] : ["#E0F2FE", "#BAE6FD"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.iconGradient,
                  focused && styles.iconFocusedShadow,
                ]}>
                <Ionicons
                  name="water"
                  size={20}
                  color={focused ? "#FFFFFF" : "#0284C7"}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* 3. Buyurtmalar Tarixi */}
      <Tabs.Screen
        name="history"
        options={{
          title: "Tarix",
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <LinearGradient
                colors={
                  focused ? ["#06B6D4", "#0284C7"] : ["#F1F5F9", "#E2E8F0"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.iconGradient,
                  focused && styles.iconFocusedShadow,
                ]}>
                <Feather
                  name="clipboard"
                  size={20}
                  color={focused ? "#FFFFFF" : "#64748B"}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* 4. Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <LinearGradient
                colors={
                  focused ? ["#06B6D4", "#0284C7"] : ["#F1F5F9", "#E2E8F0"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.iconGradient,
                  focused && styles.iconFocusedShadow,
                ]}>
                <Feather
                  name="user"
                  size={20}
                  color={focused ? "#FFFFFF" : "#64748B"}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.tabBg,
    position: "absolute",
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.8)",
    height: Platform.OS === "ios" ? 92 : 76,
    paddingBottom: Platform.OS === "ios" ? 32 : 12,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  // Barcha ikonkalarni bir xil tekislikda ushlab turuvchi qobiq
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    top: Platform.OS === "ios" ? -2 : -4, // Hamma tugmani bir xil chiziqda vizual tekislash
  },

  // Buyurtma kabi yumshoq gradientli 3D kvadrat shakli
  iconGradient: {
    width: 46,
    height: 46,
    borderRadius: 16, // Silliq burchaklar
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  // Faol bo'lgan tugmaga yumshoq ko'k rangli nur berish (Glow effect)
  iconFocusedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
