/**
 * Super Admin — Sozlamalar (Profile & Settings)
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "@/components/ui";
import { Colors } from "@/constants";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";

const SA_COLOR = "#6366F1";

type Role = "SUPER_ADMIN" | "DIRECTOR" | "OPERATOR" | "DRIVER" | "CUSTOMER";

function getRoleBadge(role: Role | undefined) {
  switch (role) {
    case "SUPER_ADMIN": return "👑 Super Admin";
    case "DIRECTOR":    return "🎯 Direktor";
    case "OPERATOR":    return "🖥️ Operator";
    case "DRIVER":      return "🚚 Haydovchi";
    default:            return "👤 Foydalanuvchi";
  }
}

// ─── Divider ────────────────────────────────────────────────
function Divider() {
  return <View style={styles.divider} />;
}

// ─── Row component ───────────────────────────────────────────
interface RowProps {
  icon?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function Row({ icon, label, value, onPress, showArrow = false, rightElement, danger }: RowProps) {
  const inner = (
    <View style={styles.row}>
      {icon ? <Text style={styles.rowIcon}>{icon}</Text> : null}
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {rightElement ?? null}
      {showArrow ? <Text style={styles.rowArrow}>›</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

export default function SuperAdminProfileScreen() {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  // Password modal
  const [pwdVisible, setPwdVisible]   = useState(false);
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [pwdLoading, setPwdLoading]   = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Language
  const [language] = useState("O'zbek");

  // Biometric
  const [biometric, setBiometric] = useState(false);

  const handleLogout = () => {
    Alert.alert("Tizimdan chiqish", "Tizimdan chiqmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "Chiqish",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert("Xato", "Barcha maydonlarni to'ldiring");
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert("Xato", "Yangi parollar mos kelmadi");
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert("Xato", "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setPwdLoading(true);
    const res = await api.put("/profile", { currentPassword: currentPwd, newPassword: newPwd });
    setPwdLoading(false);
    if (res.success) {
      Alert.alert("✅ Muvaffaqiyat", "Parol muvaffaqiyatli o'zgartirildi");
      closePwdModal();
    } else {
      Alert.alert("Xato", res.error || "Parol o'zgartirilmadi");
    }
  };

  const closePwdModal = () => {
    setPwdVisible(false);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
  };

  const handleLanguage = () => {
    Alert.alert("🌐 Til tanlash", "Tez orada!\nСкоро!\nComing soon!", [{ text: "OK" }]);
  };

  const handleClearCache = () => {
    Alert.alert(
      "Keshni tozalash",
      "Barcha lokal saqlangan ma'lumotlar o'chadi. Davom etasizmi?",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Tozalash",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("✅", "Kesh muvaffaqiyatli tozalandi!");
          },
        },
      ]
    );
  };

  const handleBiometricToggle = (value: boolean) => {
    if (value) {
      Alert.alert("🔐 Biometrik kirish", "Bu funksiya tez orada qo'shiladi!");
    }
    setBiometric(value);
  };

  // First letter avatar
  const avatarLetter = user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Custom header — foydalanuvchi ismi bilan */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {user?.name || "Sozlamalar"}
        </Text>
        <Text style={styles.headerSub}>Super Admin paneli</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ─────────────────────────────────── */}
        <Card style={styles.profileCard} padding={24}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleBadge(user?.role as Role)}</Text>
          </View>
          <Text style={styles.phone}>{user?.phone}</Text>
        </Card>

        {/* ── Xavfsizlik ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Xavfsizlik</Text>
        <Card style={styles.listCard} padding={0}>
          <Row
            icon="🔑"
            label="Parolni o'zgartirish"
            onPress={() => setPwdVisible(true)}
            showArrow
          />
          <Divider />
          <Row
            icon="🔐"
            label="Biometrik kirish"
            value={biometric ? "Yoqilgan" : "O'chirilgan"}
            rightElement={
              <Switch
                value={biometric}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: Colors.gray[200], true: SA_COLOR }}
                thumbColor={Colors.white}
                style={styles.switch}
              />
            }
          />
        </Card>

        {/* ── Til ──────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Til va mintaqa</Text>
        <Card style={styles.listCard} padding={0}>
          <Row
            icon="🌐"
            label="Interfeys tili"
            value={language}
            onPress={handleLanguage}
            showArrow
          />
        </Card>

        {/* ── Texnik ───────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Ilova haqida</Text>
        <Card style={styles.listCard} padding={0}>
          <Row
            icon="🗑️"
            label="Keshni tozalash"
            onPress={handleClearCache}
            showArrow
          />
          <Divider />
          <Row label="Versiya" value="1.0.0" />
          <Divider />
          <Row label="Platforma" value="BuloqWater Mobile" />
          <Divider />
          <Row
            label="Rol"
            rightElement={
              <Text style={[styles.rowValue, { color: SA_COLOR, marginRight: 8 }]}>
                Super Admin
              </Text>
            }
          />
        </Card>

        {/* ── Chiqish — vizual ierarxiya pastida, ingichka ─── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>→</Text>
          <Text style={styles.logoutText}>Tizimdan chiqish</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Parolni o'zgartirish — Modal ─────────────────── */}
      <Modal visible={pwdVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Parolni o'zgartirish</Text>
            <Text style={styles.modalSubtitle}>Yangi parol kamida 6 ta belgidan iborat bo'lsin</Text>

            {/* Joriy parol */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputField}
                placeholder="Joriy parol"
                secureTextEntry={!showCurrentPwd}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholderTextColor={Colors.gray[400]}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPwd(!showCurrentPwd)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showCurrentPwd ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Yangi parol */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputField}
                placeholder="Yangi parol"
                secureTextEntry={!showNewPwd}
                value={newPwd}
                onChangeText={setNewPwd}
                placeholderTextColor={Colors.gray[400]}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPwd(!showNewPwd)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showNewPwd ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Tasdiqlash */}
            <View style={[styles.inputWrapper, { marginBottom: 20 }]}>
              <TextInput
                style={styles.inputField}
                placeholder="Yangi parolni tasdiqlang"
                secureTextEntry={!showConfirmPwd}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                placeholderTextColor={Colors.gray[400]}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPwd(!showConfirmPwd)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showConfirmPwd ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closePwdModal}
              >
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, pwdLoading && styles.saveBtnDisabled]}
                onPress={handleChangePassword}
                disabled={pwdLoading}
              >
                {pwdLoading
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.saveBtnText}>Saqlash</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { flex: 1, backgroundColor: Colors.background },
  container:  { flex: 1 },
  content:    { padding: 16 },

  // ── Header ──────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.gray[900],
  },
  headerSub: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 2,
  },

  // ── Profile Card ─────────────────────────────────────────
  profileCard:  { alignItems: "center", marginBottom: 20 },
  avatarLarge:  {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: SA_COLOR + "18",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText:   { fontSize: 28, fontWeight: "700", color: SA_COLOR },
  name:         { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
  roleBadge:    {
    backgroundColor: SA_COLOR + "12",
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, marginTop: 6,
  },
  roleText:     { fontSize: 13, fontWeight: "600", color: SA_COLOR },
  phone:        { fontSize: 14, color: Colors.gray[400], marginTop: 6 },

  // ── Section ──────────────────────────────────────────────
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },

  // ── List Card ─────────────────────────────────────────────
  listCard:     { marginBottom: 16, overflow: "hidden" },

  // ── Row ───────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon:       { fontSize: 17, marginRight: 12, width: 24, textAlign: "center" },
  rowLabel:      { flex: 1, fontSize: 15, color: Colors.gray[800] },
  rowLabelDanger:{ color: Colors.danger },
  rowValue:      { fontSize: 14, color: Colors.gray[400], marginRight: 4 },
  rowArrow:      { fontSize: 20, color: Colors.gray[300], marginLeft: 4 },

  // ── Divider ───────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginLeft: 16,
  },

  // ── Switch ────────────────────────────────────────────────
  switch: { marginLeft: 8 },

  // ── Logout — minimal, pastda ─────────────────────────────
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.danger + "60",
    backgroundColor: Colors.white,
    gap: 6,
  },
  logoutIcon: {
    fontSize: 15,
    color: Colors.danger,
    transform: [{ scaleX: 1 }],
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.danger,
  },

  // ── Modal ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.gray[900],
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.gray[400],
    marginBottom: 20,
  },

  // ── Password input with eye toggle ───────────────────────
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    marginBottom: 12,
    paddingRight: 12,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15,
    color: Colors.gray[900],
  },
  eyeBtn:  { padding: 4 },
  eyeIcon: { fontSize: 16 },

  // ── Modal buttons ─────────────────────────────────────────
  modalBtns:       { flexDirection: "row", gap: 12 },
  modalBtn:        { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  cancelBtn:       { backgroundColor: Colors.gray[100] },
  cancelBtnText:   { fontSize: 15, fontWeight: "600", color: Colors.gray[600] },
  saveBtn:         { backgroundColor: SA_COLOR },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText:     { fontSize: 15, fontWeight: "600", color: Colors.white },
});
