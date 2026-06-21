import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Colors } from "@/constants";

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
  style?: ViewStyle;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
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
}: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.errorBorder,
          !editable && styles.disabled,
        ]}
      >
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines * 20 + 20, textAlignVertical: "top" }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeButton}>
            <Text style={styles.eyeText}>{isSecure ? "👁" : "🙈"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray[700],
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  focused: { borderColor: Colors.primary },
  errorBorder: { borderColor: Colors.danger },
  disabled: { backgroundColor: Colors.gray[100] },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.gray[900],
  },
  eyeButton: { paddingHorizontal: 12 },
  eyeText: { fontSize: 18 },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
});
