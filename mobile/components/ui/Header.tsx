import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function Header({ title, onBack }: { title: string, onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Platform.OS === 'ios' ? 40 : 0, // Tepadan joy ochish (Notch/Dynamic Island uchun)
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginLeft: 12 },
  backBtn: { padding: 4 }
});