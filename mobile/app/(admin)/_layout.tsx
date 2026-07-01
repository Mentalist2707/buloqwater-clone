/**
 * Admin (Director) Layout — zamonaviy suzuvchi tab paneli (2026)
 */
import { Tabs } from "expo-router";
import { StyleSheet, Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, radius, shadow } from "@/constants/theme";
import { useNotificationsStore } from "@/store/notifications";

function TabIcon({ focused, name }: { focused: boolean; name: any }) {
  return (
    <View style={styles.iconWrap}>
      <View style={focused ? styles.iconActive : styles.iconInactive}>
        <Ionicons name={name} size={20} color={focused ? "#FFFFFF" : theme.textMuted} />
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const unread = useNotificationsStore((s) => s.unreadCount);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          title: "Analitika",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "stats-chart" : "stats-chart-outline"} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Buyurtmalar",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "clipboard" : "clipboard-outline"} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Mijozlar",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "person" : "person-outline"} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: "Xodimlar",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "people" : "people-outline"} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Xabarlar",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "notifications" : "notifications-outline"} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={focused ? "settings" : "settings-outline"} />,
        }}
      />
      <Tabs.Screen name="products" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: Platform.OS === "ios" ? 28 : 16,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    paddingHorizontal: 4,
    ...shadow.lg,
  },
  tabBarLabel: { fontSize: 10, fontWeight: "700", marginTop: -2 },
  badge: { backgroundColor: theme.danger, fontSize: 10, fontWeight: "800" },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  iconActive: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primary,
  },
  iconInactive: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceAlt,
  },
});
