import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { theme, radius, shadow } from "@/constants/theme";

type Elevation = "none" | "xs" | "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  elevation?: Elevation;
  bordered?: boolean;
}

export function Card({
  children,
  style,
  padding = 18,
  elevation = "sm",
  bordered = true,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding },
        bordered && styles.bordered,
        shadow[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
  },
  bordered: {
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
});
