/**
 * Admin Layout — Pastki navigatsiya paneli (Tabs)
 * Strict TypeScript, Ultra-Minimalist Flat Style
 */
import { Tabs } from "expo-router";
import { StyleSheet, Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ─── Qat'iy Tiplashtirilgan Toza Ranglar ────────────────────────
const C = {
  primary:   "#0284C7" as const, // Elegant Toza Ko'k (Faol)
  inactive:  "#94A3B8" as const, // Slate 400 (Nofaol)
  border:    "#E2E8F0" as const, // Yupqa ajratuvchi chiziq
  bgWhite:   "#FFFFFF" as const, // Toza oq fon
};

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        // Tepasi butunlay yopiladi, yopishib turaveradi
        headerShown: false,
        
        // Pastki panel sozlamalari
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.inactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* 1. Dashboard (Analitika) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Analitika",
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={focused ? "stats-chart" : "stats-chart-outline"} 
                size={22} 
                color={focused ? C.primary : C.inactive} 
              />
            </View>
          ),
        }}
      />

      {/* 2. Orders (Buyurtmalar) */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Buyurtmalar",
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={focused ? "clipboard" : "clipboard-outline"} 
                size={22} 
                color={focused ? C.primary : C.inactive} 
              />
            </View>
          ),
        }}
      />

      {/* 3. Products (Mahsulotlar) */}
      <Tabs.Screen
        name="products"
        options={{
          title: "Mahsulotlar",
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={focused ? "cube" : "cube-outline"} 
                size={22} 
                color={focused ? C.primary : C.inactive} 
              />
            </View>
          ),
        }}
      />

      {/* 4. Staff (Xodimlar) */}
      <Tabs.Screen
        name="staff"
        options={{
          title: "Xodimlar",
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={focused ? "people" : "people-outline"} 
                size={22} 
                color={focused ? C.primary : C.inactive} 
              />
            </View>
          ),
        }}
      />

      {/* 5. Profile (Profil) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={focused ? "settings" : "settings-outline"} 
                size={22} 
                color={focused ? C.primary : C.inactive} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bgWhite,
    position: "absolute",
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: Platform.OS === "ios" ? 84 : 64,
    paddingBottom: Platform.OS === "ios" ? 26 : 10,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    width: 28,
  },
});