/**
 * NotificationCenter — barcha rollar uchun umumiy bildirishnomalar ekrani.
 * ────────────────────────────────────────────────────────────
 * - Bildirishnomalar ro'yxati (pull-to-refresh)
 * - O'qilmaganlarni belgilash
 * - INVITATION turidagi bildirishnomalar uchun "Qabul qilish / Rad etish"
 *   tugmalari (CUSTOMER foydalanuvchi ko'radi)
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { notificationsService } from "@/services/notifications";
import { invitationsService } from "@/services/invitations";
import { useNotificationsStore } from "@/store/notifications";
import type { AppNotification, NotificationType } from "@/types";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const TYPE_META: Record<
  NotificationType,
  { icon: any; color: string; soft: string }
> = {
  INVITATION: { icon: "user-plus", color: palette.aqua600, soft: palette.aqua100 },
  INVITATION_ACCEPTED: { icon: "check-circle", color: palette.mint600, soft: palette.mint100 },
  INVITATION_REJECTED: { icon: "x-circle", color: palette.rose600, soft: palette.rose100 },
  ORDER: { icon: "shopping-bag", color: palette.ocean600, soft: palette.aqua100 },
  SYSTEM: { icon: "bell", color: palette.slate600, soft: palette.slate100 },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hozir";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
}

/**
 * Bildirishnoma matni. Taklif (INVITATION) bo'lsa — kompaniya nomi qalin
 * (bold) ko'rsatiladi.
 */
function NotificationBody({ item }: { item: AppNotification }) {
  const highlight = item.type === "INVITATION" ? item.data?.companyName : null;

  if (highlight && typeof highlight === "string" && item.body.includes(highlight)) {
    const idx = item.body.indexOf(highlight);
    const before = item.body.slice(0, idx);
    const after = item.body.slice(idx + highlight.length);
    return (
      <Text style={styles.cardBody}>
        {before}
        <Text style={styles.bodyBold}>{highlight}</Text>
        {after}
      </Text>
    );
  }
  return <Text style={styles.cardBody}>{item.body}</Text>;
}

export default function NotificationCenter() {
  const insets = useSafeAreaInsets();
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await notificationsService.getNotifications();
    let list: AppNotification[] = [];
    if (res.success && res.data) {
      list = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
      setItems(list);
    }
    setLoading(false);
    setRefreshing(false);

    // Sahifaga kirilganda — badge darhol tozalanadi. Yangi kelganlar qisqa
    // vaqt ajralib turadi, so'ng default (o'qilgan) ko'rinishga o'tadi.
    if (list.some((n) => !n.isRead)) {
      notificationsService.markAllRead();
      setUnreadCount(0);
      setTimeout(() => {
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }, 1500);
    } else {
      setUnreadCount(0);
    }
  }, [setUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const markAllRead = async () => {
    await notificationsService.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleTap = async (n: AppNotification) => {
    if (!n.isRead) {
      await notificationsService.markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
  };

  const respondInvitation = async (n: AppNotification, accept: boolean) => {
    const invitationId = n.data?.invitationId;
    if (!invitationId) return;
    setBusyId(n.id);
    const res = accept
      ? await invitationsService.acceptInvitation(invitationId)
      : await invitationsService.rejectInvitation(invitationId);
    setBusyId(null);
    if (res.success) {
      Alert.alert(
        accept ? "Qabul qilindi" : "Rad etildi",
        accept
          ? `Siz endi ${n.data?.companyName || "kompaniya"} mijozisiz`
          : "Taklif rad etildi",
      );
      load();
    } else {
      Alert.alert("Xatolik", (res as any).error || "Amalni bajarib bo'lmadi");
    }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bildirishnomalar</Text>
          <Text style={styles.subtitle}>
            {unread > 0 ? `${unread} ta o'qilmagan` : "Hammasi o'qilgan"}
          </Text>
        </View>
        {unread > 0 && (
          <TouchableOpacity style={styles.readAllBtn} onPress={markAllRead} activeOpacity={0.7}>
            <Feather name="check-circle" size={15} color={theme.primaryDark} />
            <Text style={styles.readAllText}>Belgilash</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="bell" size={30} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Bildirishnoma yo'q</Text>
              <Text style={styles.emptyText}>Yangi xabarlar shu yerda ko'rinadi</Text>
            </View>
          ) : (
            items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
              const isInvite = n.type === "INVITATION" && !!n.data?.invitationId;
              return (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.8}
                  onPress={() => handleTap(n)}
                  style={[styles.card, !n.isRead && styles.cardUnread]}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.iconWrap, { backgroundColor: meta.soft }]}>
                      <Feather name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {n.title}
                        </Text>
                        {!n.isRead && <View style={styles.dot} />}
                      </View>
                      <NotificationBody item={n} />
                      <Text style={styles.cardTime}>{relativeTime(n.createdAt)}</Text>

                      {isInvite && (
                        <View style={styles.inviteActions}>
                          {busyId === n.id ? (
                            <View style={styles.inviteBusy}>
                              <ActivityIndicator size="small" color={theme.primary} />
                              <Text style={styles.inviteBusyText}>Yuborilmoqda...</Text>
                            </View>
                          ) : (
                            <>
                              <TouchableOpacity
                                style={[styles.inviteBtn, styles.acceptBtn]}
                                onPress={() => respondInvitation(n, true)}
                              >
                                <Feather name="check" size={14} color="#fff" />
                                <Text style={styles.acceptText}>Qabul qilish</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.inviteBtn, styles.rejectBtn]}
                                onPress={() => respondInvitation(n, false)}
                              >
                                <Feather name="x" size={14} color={theme.danger} />
                                <Text style={styles.rejectText}>Rad etish</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </Screen>
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
  title: { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.6 },
  subtitle: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.medium, marginTop: 2 },
  readAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: theme.primarySoft,
  },
  readAllText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.primaryDark },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },

  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  cardUnread: { borderColor: theme.primarySoft, backgroundColor: theme.primaryTint },
  cardRow: { flexDirection: "row", gap: spacing.md },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary },
  cardBody: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 3, fontWeight: fontWeight.medium, lineHeight: 19 },
  bodyBold: { fontWeight: fontWeight.extrabold, color: theme.text },
  cardTime: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 6, fontWeight: fontWeight.medium },

  inviteActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  inviteBusy: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  inviteBusyText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    flex: 1,
  },
  acceptBtn: { backgroundColor: theme.primary },
  acceptText: { color: "#fff", fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  rejectBtn: { backgroundColor: theme.dangerSoft },
  rejectText: { color: theme.danger, fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["4xl"], gap: spacing.sm },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: theme.text },
  emptyText: { fontSize: fontSize.sm, color: theme.textSecondary },
});
