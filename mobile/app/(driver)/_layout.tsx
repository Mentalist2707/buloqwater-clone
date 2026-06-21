import { Stack } from "expo-router";
import { Colors } from "@/constants";

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="tasks"
        options={{ title: "Buyurtmalar", headerBackVisible: false }}
      />
      <Stack.Screen
        name="deliver"
        options={{ title: "Yetkazish", presentation: "modal" }}
      />
    </Stack>
  );
}
