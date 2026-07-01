import { Stack } from "expo-router";

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Header butunlay yopildi
        contentStyle: {
          backgroundColor: "transparent", // Gradient ko'rinishi uchun
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="tasks"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="deliver"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}