import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from "react-native";
import { theme, radius, spacing, fontSize, fontWeight, shadow } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const SIZES: Record<Size, { font: number; height: number; ph: number }> = {
  sm: { font: fontSize.sm, height: 40, ph: 16 },
  md: { font: fontSize.md, height: 52, ph: 22 },
  lg: { font: fontSize.lg, height: 56, ph: 28 },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  icon,
  iconRight,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const s = SIZES[size];

  const textColor =
    variant === "outline"
      ? theme.primaryDark
      : variant === "ghost"
      ? theme.text
      : theme.textInverse;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        { height: s.height, borderRadius: radius.lg, paddingHorizontal: s.ph },
        fullWidth && styles.fullWidth,
        variantStyles[variant],
        variant === "primary" && !isDisabled && shadow.brandSoft,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon}
          <Text
            style={[styles.text, { fontSize: s.font, lineHeight: s.font + 4, color: textColor }, textStyle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {iconRight}
        </View>
      )}
    </TouchableOpacity>
  );
}

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: theme.primary },
  secondary: { backgroundColor: theme.primaryDark },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: theme.primary },
  ghost: { backgroundColor: theme.surfaceAlt },
  danger: { backgroundColor: theme.danger },
  success: { backgroundColor: theme.success },
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { alignSelf: "stretch" },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  disabled: { opacity: 0.55 },
  text: { fontWeight: fontWeight.bold, letterSpacing: -0.1 },
});
