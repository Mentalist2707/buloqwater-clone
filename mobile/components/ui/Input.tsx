import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme, radius, spacing, fontSize, fontWeight } from "@/constants/theme";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "phone-pad" | "numeric" | "email-address";
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle | TextStyle>;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  placeholderTextColor?: string;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  icon?: React.ComponentProps<typeof Feather>["name"];
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  error,
  multiline = false,
  numberOfLines = 1,
  style,
  editable = true,
  autoCapitalize = "none",
  placeholderTextColor,
  maxLength,
  onFocus,
  onBlur,
  icon,
}: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style as StyleProp<ViewStyle>]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.errorBorder,
          !editable && styles.disabled,
          multiline && styles.multilineBox,
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={isFocused ? theme.primary : theme.textMuted}
            style={styles.leadingIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            multiline && { height: numberOfLines * 20 + 20, textAlignVertical: "top" },
          ]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? theme.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={isSecure ? "eye" : "eye-off"} size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: theme.textSecondary,
    marginBottom: 6,
    paddingLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    height: 52,
  },
  multilineBox: { height: undefined, alignItems: "flex-start", paddingVertical: 6 },
  focused: { borderColor: theme.primary, backgroundColor: theme.primaryTint },
  errorBorder: { borderColor: theme.danger },
  disabled: { backgroundColor: theme.surfaceAlt },
  leadingIcon: { marginLeft: spacing.base },
  input: {
    flex: 1,
    paddingHorizontal: spacing.base,
    fontSize: fontSize.md,
    color: theme.text,
  },
  eyeButton: { paddingHorizontal: spacing.md },
  errorText: {
    fontSize: fontSize.xs,
    color: theme.danger,
    marginTop: 4,
    paddingLeft: 2,
    fontWeight: fontWeight.medium,
  },
});
