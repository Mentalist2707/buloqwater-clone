import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Colors } from "@/constants";

export default function SuperAdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#6366F1" },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 64 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: "Kompaniyalar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>🏢</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: "Zayavkalar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Xabarlar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📩</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Tahlil",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Sozlamalar",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>⚙️</Text>
          ),
        }}
      />
      {/* Hidden screens — navigated to via router.push from profile */}
      <Tabs.Screen name="users"     options={{ href: null, title: "Foydalanuvchilar" }} />
      <Tabs.Screen name="products"  options={{ href: null, title: "Mahsulotlar" }} />
      <Tabs.Screen name="health"    options={{ href: null, title: "Tizim holati" }} />
      <Tabs.Screen name="settings"  options={{ href: null, title: "Global sozlamalar" }} />
      <Tabs.Screen name="discounts" options={{ href: null, title: "Chegirmalar" }} />
    </Tabs>
  );
}
