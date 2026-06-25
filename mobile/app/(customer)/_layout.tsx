import { Tabs } from "expo-router";
import { Text, View } from "react-native";

const C = {
  primary:   "#00C6A2",   // teal-400 — asosiy rang
  dark:      "#00A88A",   // teal-600
  tab:       "#FFFFFF",
  inactive:  "#A3C4BC",
};

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.inactive,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Bosh sahifa",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: "Buyurtma",
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? C.primary : "#E8F8F5",
              width: 48, height: 48, borderRadius: 24,
              alignItems: "center", justifyContent: "center",
              marginBottom: 4,
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: focused ? 0.35 : 0,
              shadowRadius: 8,
              elevation: focused ? 6 : 0,
            }}>
              <Text style={{ fontSize: 22 }}>💧</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Tarix",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
