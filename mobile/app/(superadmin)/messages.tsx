/**
 * Super Admin — Xabarlar (Messages)
 * GET/POST /api/v1/superadmin/messages
 * DELETE /api/v1/superadmin/messages/[id]
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Modal, TextInput, ScrollView,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Button } from "@/components/ui";
import { Colors } from "@/constants";
import { api } from "@/services/api";

const SA_COLOR = "#6366F1";

interface Message {
  id: string;
  title: string;
  content: string;
  type: "INFO" | "WARNING" | "URGENT" | "ANNOUNCEMENT";
  isGlobal: boolean;
  companyId: string | null;
  companyName: string | null;
  createdAt: string;
}

interface CompanyItem {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

const TYPE_CONFIG = {
  INFO:         { icon: "ℹ️", color: "#3B82F6", bg: "#EFF6FF", label: "Ma'lumot" },
  WARNING:      { icon: "⚠️", color: "#F59E0B", bg: "#FFFBEB", label: "Ogohlantirish" },
  URGENT:       { icon: "🚨", color: "#EF4444", bg: "#FEF2F2", label: "Shoshilinch" },
  ANNOUNCEMENT: { icon: "📢", color: "#8B5CF6", bg: "#F5F3FF", label: "E'lon" },
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Companies for selector
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<Message["type"]>("INFO");
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);

  const load = async () => {
    const r = await api.get<Message[]>("/superadmin/messages");
    if (r.success && r.data) setMessages(r.data as Message[]);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    const r = await api.get<CompanyItem[]>("/superadmin/companies");
    if (r.success && r.data) setCompanies(r.data as CompanyItem[]);
    setLoadingCompanies(false);
  };

  const handleOpenModal = () => {
    setTitle(""); setContent(""); setType("INFO");
    setIsGlobal(true); setSelectedCompanyId(null); setSelectedCompanyName(null);
    setSendError(""); setShowModal(true);
    loadCompanies();
  };

  const handleSend = async () => {
    if (!title.trim()) { setSendError("Sarlavha kiritilishi shart"); return; }
    if (!content.trim()) { setSendError("Matn kiritilishi shart"); return; }
    if (!isGlobal && !selectedCompanyId) { setSendError("Kompaniyani tanlang"); return; }
    setSending(true); setSendError("");
    const body: any = { title: title.trim(), content: content.trim(), type, isGlobal };
    if (!isGlobal) { body.companyId = selectedCompanyId; body.companyName = selectedCompanyName; }
    const r = await api.post("/superadmin/messages", body);
    if (r.success) {
      setShowModal(false);
      load();
      Alert.alert("✅", "Xabar yuborildi!");
    } else {
      setSendError((r as any).error || "Xatolik yuz berdi");
    }
    setSending(false);
  };

  const handleDelete = (msg: Message) => {
    Alert.alert("🗑️ O'chirish", `"${msg.title}" xabarini o'chirmoqchimisiz?`, [
      { text: "Bekor", style: "cancel" },
      {
        text: "O'chirish", style: "destructive",
        onPress: async () => {
          const r = await api.delete(`/superadmin/messages/${msg.id}`);
          if (r.success) { load(); } else {
            Alert.alert("Xatolik", (r as any).error || "Xatolik");
          }
        },
      },
    ]);
  };

  const renderMessage = ({ item: msg }: { item: Message }) => {
    const tc = TYPE_CONFIG[msg.type];
    return (
      <Card style={[styles.msgCard, { borderLeftColor: tc.color, borderLeftWidth: 3 }]}>
        <View style={styles.msgHeader}>
          <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
            <Text style={{ fontSize: 12 }}>{tc.icon}</Text>
            <Text style={[styles.typeLabel, { color: tc.color }]}>{tc.label}</Text>
          </View>
          <View style={styles.targetBadge}>
            <Text style={styles.targetText}>
              {msg.isGlobal ? "🌍 Barchasi" : `🏢 ${msg.companyName || "Kompaniya"}`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(msg)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.msgTitle} numberOfLines={2}>{msg.title}</Text>
        <Text style={styles.msgContent} numberOfLines={3}>{msg.content}</Text>
        <Text style={styles.msgDate}>{formatDate(msg.createdAt)}</Text>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(m) => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 16 }]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📩</Text>
            <Text style={styles.emptyText}>{loading ? "Yuklanmoqda..." : "Xabar topilmadi"}</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: SA_COLOR }]} onPress={handleOpenModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Send Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📩 Yangi xabar</Text>

              {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}

              {/* Title */}
              <Text style={styles.fieldLabel}>Sarlavha *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Xabar sarlavhasi..."
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={Colors.gray[400]}
              />

              {/* Content */}
              <Text style={styles.fieldLabel}>Matn *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Xabar matni..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={Colors.gray[400]}
              />

              {/* Type selector */}
              <Text style={styles.fieldLabel}>Tur</Text>
              <View style={styles.typeRow}>
                {(Object.keys(TYPE_CONFIG) as Message["type"][]).map((t) => {
                  const tc = TYPE_CONFIG[t];
                  const active = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeBtn, active && { backgroundColor: tc.bg, borderColor: tc.color }]}
                      onPress={() => setType(t)}
                    >
                      <Text style={{ fontSize: 16 }}>{tc.icon}</Text>
                      <Text style={[styles.typeBtnLabel, active && { color: tc.color, fontWeight: "700" }]}>
                        {tc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Target selector */}
              <Text style={styles.fieldLabel}>Kimga?</Text>
              <View style={styles.targetRow}>
                <TouchableOpacity
                  style={[styles.targetBtn, isGlobal && styles.targetBtnActive]}
                  onPress={() => setIsGlobal(true)}
                >
                  <Text style={styles.targetBtnText}>🌍 Barcha kompaniyalar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.targetBtn, !isGlobal && styles.targetBtnActive]}
                  onPress={() => setIsGlobal(false)}
                >
                  <Text style={styles.targetBtnText}>🏢 Bitta kompaniya</Text>
                </TouchableOpacity>
              </View>

              {/* Company selector */}
              {!isGlobal && (
                <View style={styles.companySelectorBox}>
                  <Text style={styles.selectorLabel}>Kompaniyani tanlang:</Text>
                  {loadingCompanies ? (
                    <Text style={styles.loadingText}>Yuklanmoqda...</Text>
                  ) : (
                    <FlatList
                      data={companies.filter((c) => c.subdomain !== "global-templates")}
                      keyExtractor={(c) => c.id}
                      scrollEnabled={false}
                      renderItem={({ item: c }) => (
                        <TouchableOpacity
                          style={[
                            styles.companyRow,
                            selectedCompanyId === c.id && styles.companyRowSelected,
                          ]}
                          onPress={() => { setSelectedCompanyId(c.id); setSelectedCompanyName(c.name); }}
                        >
                          <Text style={styles.companyRowName} numberOfLines={1}>{c.name}</Text>
                          <Text style={styles.companyRowSub}>{c.subdomain}</Text>
                          {selectedCompanyId === c.id && <Text style={{ fontSize: 16 }}>✅</Text>}
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button title="Yuborish" onPress={handleSend} loading={sending} style={{ flex: 1 }} />
                <Button title="Bekor" onPress={() => setShowModal(false)} variant="outline" style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 100 },
  msgCard: { padding: 14 },
  msgHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  typeLabel: { fontSize: 11, fontWeight: "600" },
  targetBadge: { flex: 1 },
  targetText: { fontSize: 11, color: Colors.gray[500] },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  msgTitle: { fontSize: 15, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 },
  msgContent: { fontSize: 13, color: Colors.gray[600], lineHeight: 18, marginBottom: 6 },
  msgDate: { fontSize: 11, color: Colors.gray[400] },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray[500] },
  fab: { position: "absolute", right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: SA_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: Colors.white, fontWeight: "300", marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 12 },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12, backgroundColor: Colors.dangerLight, padding: 10, borderRadius: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6, marginTop: 12 },
  textInput: { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.gray[900], backgroundColor: Colors.white },
  textArea: { minHeight: 100, paddingTop: 10 },
  typeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  typeBtn: { flex: 1, minWidth: 70, alignItems: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.gray[50], gap: 2 },
  typeBtnLabel: { fontSize: 10, color: Colors.gray[500], textAlign: "center" },
  targetRow: { flexDirection: "row", gap: 8 },
  targetBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.gray[50] },
  targetBtnActive: { borderColor: SA_COLOR, backgroundColor: SA_COLOR + "10" },
  targetBtnText: { fontSize: 12, fontWeight: "600", color: Colors.gray[700] },
  companySelectorBox: { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 10, marginTop: 8, maxHeight: 220, overflow: "hidden" },
  selectorLabel: { fontSize: 12, color: Colors.gray[500], padding: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  loadingText: { textAlign: "center", color: Colors.gray[400], padding: 16 },
  companyRow: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: 8 },
  companyRowSelected: { backgroundColor: SA_COLOR + "10" },
  companyRowName: { flex: 1, fontSize: 13, fontWeight: "600", color: Colors.gray[800] },
  companyRowSub: { fontSize: 11, color: Colors.gray[400] },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
});
