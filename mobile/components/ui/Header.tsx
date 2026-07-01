import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, spacing, fontSize, fontWeight, radius } from "@/constants/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Fon shaffofmi (gradient ustida) yoki oq panelmi */
  transparent?: boolean;
}

export function Header({ title, subtitle, onBack, right, transparent = true }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 8 },
        !transparent && styles.solid,
      ]}
    >
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
      )}
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  solid: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: theme.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: theme.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  right: { marginLeft: "auto" },
});
