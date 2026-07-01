/**
 * Operator — Yangi buyurtma yaratish (2026 redesign)
 * ────────────────────────────────────────────────────────────
 * Mijoz tanlash endi butun bazadan real qidiruv qiladi:
 *  - "mine"  → sizning mijozingiz (yashil) — buyurtma berish mumkin
 *  - "other" → boshqa kompaniya(lar)da mijoz (amber) + kompaniya nomi (+N)
 *  - "none"  → tizimda bor, hech qaysi kompaniyaga a'zo emas (kulrang)
 * Filtr: "Hammasi" / "Mening mijozlarim".
 * O'z kompaniyasiga tegishli bo'lmagan odam tanlansa — taklif yuboriladi.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button, Input, Screen } from "@/components/ui";
import { customersService } from "@/services/customers";
import { productsService } from "@/services/products";
import { ordersService } from "@/services/orders";
import type { Product, PersonSearchResult, Membership } from "@/types";
import { theme, palette, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

interface CartItem {
  product: Product;
  quantity: number;
}

type Scope = "all" | "mine";

const MEMBERSHIP_META: Record<Membership, { label: string; color: string; soft: string }> = {
  mine: { label: "Mijozingiz", color: palette.mint600, soft: palette.mint100 },
  other: { label: "Boshqa kompaniya", color: palette.amber600, soft: palette.amber100 },
  none: { label: "A'zo emas", color: palette.slate500, soft: palette.slate100 },
};

export default function NewOrderScreen() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [people, setPeople] = useState<PersonSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PersonSearchResult | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [searching, setSearching] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone1, setNewPhone1] = useState("+998");
  const [newPhone2, setNewPhone2] = useState("+998");
  const [newAddress, setNewAddress] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newLocationLink, setNewLocationLink] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.length >= 1 && !selectedCustomer) {
        searchPeople();
      } else if (customerSearch.length < 1) {
        setPeople([]);
        setShowCustomerList(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, selectedCustomer, scope]);

  const loadProducts = async () => {
    const result = await productsService.getProducts();
    if (result.success && result.data) setProducts(result.data);
  };

  const searchPeople = async () => {
    setSearching(true);
    try {
      const result = await customersService.searchPeople(customerSearch.trim(), scope);
      if (result.success && result.data) {
        setPeople(result.data);
      } else {
        setPeople([]);
      }
      setShowCustomerList(true);
    } catch {
      setPeople([]);
      setShowCustomerList(true);
    }
    setSearching(false);
  };

  const selectPerson = (person: PersonSearchResult) => {
    if (person.membership === "mine" && person.customerId) {
      setSelectedCustomer(person);
      setCustomerSearch(person.name);
      setShowCustomerList(false);
      return;
    }
    // O'z mijozi emas — taklif yuborish
    promptInvitation(person);
  };

  const promptInvitation = (person: PersonSearchResult) => {
    if (!person.userId) {
      Alert.alert(
        "Taklif yuborib bo'lmaydi",
        "Bu odam ilovada ro'yxatdan o'tmagan. Uni yangi mijoz sifatida qo'shishingiz mumkin.",
      );
      return;
    }
    const where =
      person.membership === "other"
        ? `Hozir "${person.companyName}"${
            person.companyCount && person.companyCount > 1 ? ` +${person.companyCount - 1}` : ""
          } kompaniyasining mijozi.`
        : "Hozir hech qaysi kompaniyaga a'zo emas.";
    Alert.alert(
      "Mijozlikka taklif",
      `${person.name} (${person.phone})\n${where}\n\nUnga kompaniyangizga qo'shilish uchun taklif yuborilsinmi?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { text: "Taklif yuborish", onPress: () => sendInvitation(person.phone, person.userId!) },
      ],
    );
  };

  const sendInvitation = async (phone: string, userId: string) => {
    setSendingInvite(true);
    const result = await customersService.sendCustomerInvitation({ phone, userId });
    setSendingInvite(false);
    if (result.success) {
      Alert.alert(
        "Taklif yuborildi!",
        "Foydalanuvchiga taklif yuborildi. U qabul qilgach, avtomatik ravishda mijozlaringizga qo'shiladi.",
      );
      setShowCustomerList(false);
      setCustomerSearch("");
      setPeople([]);
    } else {
      Alert.alert("Xatolik", (result as any).error || "Taklif yuborishda xatolik");
    }
  };

  const resetNewCustomerForm = () => {
    setNewName("");
    setNewPhone1("+998");
    setNewPhone2("+998");
    setNewAddress("");
    setNewLandmark("");
    setNewLocationLink("");
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim() || !newPhone1.trim() || newPhone1.trim() === "+998" || !newAddress.trim()) {
      Alert.alert("Diqqat", "Ism, telefon va manzil to'ldirilishi shart");
      return;
    }
    setCreatingCustomer(true);
    const phone1 = newPhone1.trim();
    const phone2 = newPhone2.trim() && newPhone2.trim() !== "+998" ? newPhone2.trim() : undefined;

    const result = await customersService.createCustomer({
      name: newName.trim(),
      phone1,
      phone2,
      address: newAddress.trim(),
      landmark: newLandmark.trim() || undefined,
      locationLink: newLocationLink.trim() || undefined,
    });

    if (result.success && result.data) {
      Alert.alert("Muvaffaqiyat!", "Mijoz qo'shildi va tanlandi");
      setShowNewCustomerModal(false);
      resetNewCustomerForm();
      // Yangi yaratilgan mijozni tanlangan qilib qo'yamiz
      const created = result.data as any;
      setSelectedCustomer({
        id: created.id,
        customerId: created.id,
        userId: created.userId ?? null,
        name: created.name,
        phone: created.phone1,
        address: created.address,
        membership: "mine",
        bottleBalance: created.bottleBalance ?? 0,
        debtBalance: created.debtBalance ?? 0,
      });
      setCustomerSearch(created.name);
      setShowCustomerList(false);
    } else {
      const errorMsg = (result as any).error || "Xatolik yuz berdi";
      const errorData = (result as any).data;
      const isDuplicate =
        errorMsg.includes("allaqachon mavjud") ||
        errorMsg.includes("allaqachon ro'yxatda") ||
        errorMsg.includes("already exists") ||
        errorMsg.includes("duplicate");

      if (errorData?.userId) {
        Alert.alert(
          "Foydalanuvchi topildi",
          `Bu telefon raqam (${phone1}) allaqachon tizimda ro'yxatdan o'tgan.\n\nUnga kompaniyangizga qo'shilish uchun taklif yuborishingiz mumkin.`,
          [
            { text: "Bekor qilish", style: "cancel" },
            { text: "Taklif yuborish", onPress: () => sendInvitation(phone1, errorData.userId) },
          ],
        );
      } else if (isDuplicate) {
        Alert.alert("Telefon band", `Bu telefon raqam (${phone1}) sizning kompaniyangizda allaqachon mavjud.`, [
          { text: "OK", style: "cancel" },
          { text: "Raqamni o'zgartirish", onPress: () => setNewPhone1("+998") },
        ]);
      } else {
        Alert.alert("Xatolik", errorMsg);
      }
    }
    setCreatingCustomer(false);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item));
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const getCartQuantity = (productId: string) => cart.find((i) => i.product.id === productId)?.quantity || 0;

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedCustomer.customerId) {
      Alert.alert("Diqqat", "Buyurtma uchun o'z mijozingizni tanlang");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Diqqat", "Kamida bitta mahsulot qo'shing");
      return;
    }
    Alert.alert("Tasdiqlash", `Mijoz: ${selectedCustomer.name}\nSumma: ${getCartTotal().toLocaleString()} so'm`, [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "Yaratish",
        onPress: async () => {
          setLoading(true);
          const result = await ordersService.createOrder({
            customerId: selectedCustomer.customerId!,
            items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          });
          if (result.success) {
            Alert.alert("Muvaffaqiyat!", "Buyurtma yaratildi");
            setSelectedCustomer(null);
            setCustomerSearch("");
            setCart([]);
          } else {
            Alert.alert("Xatolik", result.error || "Xatolik yuz berdi");
          }
          setLoading(false);
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Yangi buyurtma</Text>

        {/* 1. Customer */}
        <Text style={styles.sectionTitle}>1 · Mijozni tanlang</Text>
        <View style={styles.card}>
          {/* Filter: Hammasi / Mening mijozlarim */}
          <View style={styles.filterRow}>
            {(["all", "mine"] as Scope[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, scope === s && styles.filterChipActive]}
                onPress={() => {
                  setScope(s);
                  if (customerSearch.length >= 1 && !selectedCustomer) setShowCustomerList(true);
                }}
                activeOpacity={0.8}
              >
                <Feather
                  name={s === "all" ? "globe" : "users"}
                  size={13}
                  color={scope === s ? "#fff" : theme.textSecondary}
                />
                <Text style={[styles.filterChipText, scope === s && styles.filterChipTextActive]}>
                  {s === "all" ? "Hammasi" : "Mening mijozlarim"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchWrapper}>
            <Feather name="search" size={18} color={theme.textMuted} />
            <Input
              placeholder="Ism yoki telefon raqami..."
              value={customerSearch}
              onChangeText={(text) => {
                setCustomerSearch(text);
                if (selectedCustomer && text !== selectedCustomer.name) setSelectedCustomer(null);
              }}
              onFocus={() => {
                if (customerSearch.length >= 1 && !selectedCustomer) setShowCustomerList(true);
              }}
              style={styles.searchInput}
            />
            {searching && <ActivityIndicator size="small" color={theme.primary} />}
          </View>

          {showCustomerList && people.length > 0 && !selectedCustomer && (
            <View style={styles.dropdown}>
              {people.map((person) => {
                const meta = MEMBERSHIP_META[person.membership];
                const companyLabel =
                  person.membership === "other"
                    ? `${person.companyName || "Kompaniya"}${
                        person.companyCount && person.companyCount > 1 ? ` +${person.companyCount - 1}` : ""
                      }`
                    : meta.label;
                return (
                  <TouchableOpacity key={person.id} style={styles.customerOption} onPress={() => selectPerson(person)}>
                    <View style={[styles.optionAvatar, { backgroundColor: meta.soft }]}>
                      <Text style={[styles.optionAvatarText, { color: meta.color }]}>
                        {person.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.optionNameRow}>
                        <Text style={styles.optionName} numberOfLines={1}>
                          {person.name}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: meta.soft }]}>
                          <View style={[styles.badgeDot, { backgroundColor: meta.color }]} />
                          <Text style={[styles.badgeText, { color: meta.color }]} numberOfLines={1}>
                            {companyLabel}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.optionInfo} numberOfLines={1}>
                        {person.phone}
                        {person.address ? ` · ${person.address}` : ""}
                      </Text>
                    </View>
                    <Feather
                      name={person.membership === "mine" ? "chevron-right" : "user-plus"}
                      size={16}
                      color={person.membership === "mine" ? theme.textMuted : meta.color}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showCustomerList && people.length === 0 && customerSearch.length >= 1 && !selectedCustomer && !searching && (
            <View style={styles.dropdown}>
              <View style={styles.emptyDropdown}>
                <Feather name="search" size={28} color={theme.textMuted} />
                <Text style={styles.emptyDropText}>Hech kim topilmadi</Text>
              </View>
              <TouchableOpacity
                style={styles.addNewBtn}
                onPress={() => {
                  setShowNewCustomerModal(true);
                  setShowCustomerList(false);
                }}
              >
                <Feather name="plus-circle" size={18} color={theme.primaryDark} />
                <Text style={styles.addNewText}>Yangi mijoz qo'shish</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedCustomer && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.selectedAvatar}>
                  <Text style={styles.selectedAvatarText}>{selectedCustomer.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
                  <Text style={styles.selectedInfo} numberOfLines={1}>
                    {selectedCustomer.address || selectedCustomer.phone}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                  <Feather name="x-circle" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.customerMeta}>
                <View style={styles.metaRow}>
                  <Feather name="phone" size={13} color={theme.textSecondary} />
                  <Text style={styles.metaText}>{selectedCustomer.phone}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Feather name="droplet" size={13} color={theme.textSecondary} />
                  <Text style={styles.metaText}>Idish: {selectedCustomer.bottleBalance ?? 0}</Text>
                </View>
                {(selectedCustomer.debtBalance ?? 0) > 0 && (
                  <View style={styles.metaRow}>
                    <Feather name="credit-card" size={13} color={theme.danger} />
                    <Text style={[styles.metaText, { color: theme.danger }]}>
                      Qarz: {(selectedCustomer.debtBalance ?? 0).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* 2. Products */}
        <Text style={styles.sectionTitle}>2 · Mahsulotlarni tanlang</Text>
        <View style={{ gap: spacing.md }}>
          {products.map((product) => {
            const qty = getCartQuantity(product.id);
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.price.toLocaleString()} so'm</Text>
                  {product.isBottle && (
                    <View style={styles.bottleTag}>
                      <Feather name="droplet" size={11} color={theme.primaryDark} />
                      <Text style={styles.bottleTagText}>Idishli</Text>
                    </View>
                  )}
                </View>
                {qty > 0 ? (
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(product.id)}>
                      <Feather name="minus" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}</Text>
                    <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(product)}>
                      <Feather name="plus" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(product)}>
                    <Feather name="plus" size={15} color={theme.primaryDark} />
                    <Text style={styles.addBtnText}>Qo'shish</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* 3. Cart */}
        {cart.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>3 · Buyurtma tarkibi</Text>
            <View style={styles.card}>
              {cart.map((item) => (
                <View key={item.product.id} style={styles.cartItem}>
                  <Text style={styles.cartItemName}>
                    {item.product.name} ×{item.quantity}
                  </Text>
                  <Text style={styles.cartItemPrice}>{(item.product.price * item.quantity).toLocaleString()} so'm</Text>
                </View>
              ))}
              <View style={styles.cartDivider} />
              <View style={styles.cartTotal}>
                <Text style={styles.cartTotalLabel}>Jami:</Text>
                <Text style={styles.cartTotalValue}>{getCartTotal().toLocaleString()} so'm</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={loading ? "Yuklanmoqda..." : "Buyurtma yaratish"}
            onPress={handleSubmit}
            loading={loading}
            disabled={!selectedCustomer || !selectedCustomer.customerId || cart.length === 0}
            size="lg"
          />
        </View>
      </ScrollView>

      {/* New Customer Modal */}
      <Modal visible={showNewCustomerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Yangi mijoz qo'shish</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              <Input label="Ism *" placeholder="Mijoz ismi" value={newName} onChangeText={setNewName} icon="user" />
              <Input label="Telefon 1 *" placeholder="+998 90 123 45 67" value={newPhone1} onChangeText={setNewPhone1} keyboardType="phone-pad" maxLength={13} icon="phone" />
              <Input label="Telefon 2 (ixtiyoriy)" placeholder="+998 90 123 45 67" value={newPhone2} onChangeText={setNewPhone2} keyboardType="phone-pad" maxLength={13} icon="phone" />
              <Input label="Manzil *" placeholder="To'liq manzil" value={newAddress} onChangeText={setNewAddress} icon="map-pin" />
              <Input label="Mo'ljal (ixtiyoriy)" placeholder="Sariq darvoza yonida" value={newLandmark} onChangeText={setNewLandmark} icon="flag" />
              <Input label="Lokatsiya linki (ixtiyoriy)" placeholder="Maps URL" value={newLocationLink} onChangeText={setNewLocationLink} icon="link" />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                title="Bekor"
                onPress={() => {
                  setShowNewCustomerModal(false);
                  resetNewCustomerForm();
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button title="Saqlash" onPress={handleCreateCustomer} loading={creatingCustomer} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Taklif yuborilmoqda overlay */}
      {sendingInvite && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Taklif yuborilmoqda...</Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120, paddingHorizontal: spacing.lg },
  pageTitle: { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: theme.text, letterSpacing: -0.6, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingLeft: 2,
  },
  card: {
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },

  filterRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: theme.textSecondary },
  filterChipTextActive: { color: "#fff" },

  searchWrapper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  searchInput: { flex: 1, marginBottom: 0 },

  dropdown: { marginTop: spacing.md, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: theme.border },
  customerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.bg,
  },
  optionAvatar: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  optionAvatarText: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: theme.primaryDark },
  optionNameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  optionName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text, flexShrink: 1 },
  optionInfo: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    maxWidth: 150,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  emptyDropdown: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm, backgroundColor: theme.bg },
  emptyDropText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    backgroundColor: theme.primarySoft,
  },
  addNewText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.primaryDark },

  selectedCard: { backgroundColor: theme.primaryTint, borderRadius: radius.lg, padding: spacing.base, marginTop: spacing.md, borderWidth: 1.5, borderColor: theme.primarySoft },
  selectedHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  selectedAvatar: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
  selectedAvatarText: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.primaryDark },
  selectedName: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text },
  selectedInfo: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2, fontWeight: fontWeight.medium },
  customerMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },

  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSoft,
    ...shadow.xs,
  },
  productName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  productPrice: { fontSize: fontSize.base, color: theme.primaryDark, fontWeight: fontWeight.bold },
  bottleTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 2 },
  bottleTagText: { fontSize: fontSize.xs, color: theme.primaryDark, fontWeight: fontWeight.semibold },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: theme.primarySoft,
  },
  addBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: theme.primaryDark },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyBtn: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: theme.surfaceAlt, alignItems: "center", justifyContent: "center" },
  qtyBtnAdd: { backgroundColor: theme.primary },
  qtyValue: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: theme.text, minWidth: 20, textAlign: "center" },

  cartItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  cartItemName: { fontSize: fontSize.base, color: theme.text, fontWeight: fontWeight.semibold, flex: 1 },
  cartItemPrice: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
  cartDivider: { height: 1, backgroundColor: theme.border, marginVertical: spacing.md },
  cartTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cartTotalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: theme.textSecondary },
  cartTotalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: theme.primaryDark },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    padding: spacing.xl,
    maxHeight: "90%",
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.base },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: theme.text },
  modalActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.overlay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing["2xl"],
    alignItems: "center",
    gap: spacing.md,
    ...shadow.lg,
  },
  loadingText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: theme.text },
});
