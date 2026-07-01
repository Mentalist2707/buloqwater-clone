/**
 * Customer Layout — Zamonaviy suzuvchi tab paneli (2026)
 */
import { Tabs } from "expo-router";
import { StyleSheet, Platform, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, gradients, radius, shadow } from "@/constants/theme";
import { useNotificationsStore } from "@/store/notifications";

type TabIconProps = { focused: boolean; lib: "ion" | "feather"; name: any };

function TabIcon({ focused, lib, name }: TabIconProps) {
  const Icon = lib === "ion" ? Ionicons : Feather;
  if (focused) {
    return (
      <View style={styles.iconWrap}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconActive, shadow.brandSoft]}
        >
          <Icon name={name} size={20} color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={styles.iconWrap}>
      <View style={styles.iconInactive}>
        <Icon name={name} size={20} color={theme.textMuted} />
      </View>
    </View>
  );
}

export default function CustomerLayout() {
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
        name="home"
        options={{
          title: "Bosh sahifa",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} lib="ion" name={focused ? "home" : "home-outline"} />
          ),
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: "Buyurtma",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} lib="ion" name="water" />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Tarix",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} lib="feather" name="clock" />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Xabarlar",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} lib="feather" name="bell" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} lib="feather" name="user" />,
        }}
      />
      {/* Yashirin — home'dan router.push orqali ochiladi */}
      <Tabs.Screen name="companies" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 28 : 16,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    paddingHorizontal: 6,
    ...shadow.lg,
  },
  tabBarLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: -2,
  },
  badge: { backgroundColor: theme.danger, fontSize: 10, fontWeight: "800" },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  iconActive: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInactive: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceAlt,
  },
});
