import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Colors } from "@/constants";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 64 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Analitika",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Buyurtmalar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Mahsulotlar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📦</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: "Xodimlar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>👥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
