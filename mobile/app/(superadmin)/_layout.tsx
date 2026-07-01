/**
 * Super Admin Layout — zamonaviy suzuvchi tab paneli (2026)
 */
import { Tabs } from "expo-router";
import { StyleSheet, Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

function TabIcon({ focused, name }: { focused: boolean; name: any }) {
  return (
    <View style={styles.iconWrap}>
      <View style={focused ? styles.iconActive : styles.iconInactive}>
        <Ionicons name={name} size={19} color={focused ? "#FFFFFF" : theme.textMuted} />
      </View>
    </View>
  );
}

export default function SuperAdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: fontWeight.extrabold, fontSize: fontSize.lg },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.primaryDark,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Bosh sahifa",
          headerShown: false,
          tabBarLabel: "Asosiy",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "grid" : "grid-outline"} />,
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: "Kompaniyalar",
          headerShown: false,
          tabBarLabel: "Firmalar",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "business" : "business-outline"} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: "Zayavkalar",
          headerShown: false,
          tabBarLabel: "Zayavka",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "document-text" : "document-text-outline"} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Xabarlar",
          headerShown: false,
          tabBarLabel: "Xabar",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "chatbubbles" : "chatbubbles-outline"} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Tahlil",
          headerShown: false,
          tabBarLabel: "Tahlil",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "trending-up" : "trending-up-outline"} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Sozlamalar",
          headerShown: false,
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "person-circle" : "person-circle-outline"} />,
        }}
      />

      {/* Hidden screens — profildan router.push orqali ochiladi */}
      <Tabs.Screen name="notifications" options={{ href: null, title: "Bildirishnomalar", headerShown: false }} />
      <Tabs.Screen name="users" options={{ href: null, title: "Foydalanuvchilar", headerShown: false }} />
      <Tabs.Screen name="products" options={{ href: null, title: "Mahsulotlar", headerShown: false }} />
      <Tabs.Screen name="health" options={{ href: null, title: "Tizim holati", headerShown: false }} />
      <Tabs.Screen name="settings" options={{ href: null, title: "Global sozlamalar", headerShown: false }} />
      <Tabs.Screen name="discounts" options={{ href: null, title: "Chegirmalar", headerShown: false }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: Platform.OS === "ios" ? 26 : 14,
    height: 66,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    paddingHorizontal: 2,
    ...shadow.lg,
  },
  tabBarLabel: { fontSize: 9.5, fontWeight: "700", marginTop: -3 },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  iconActive: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primary,
  },
  iconInactive: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceAlt,
  },
});
