import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { Button, Input, Card } from "@/components/ui";
import { Colors } from "@/constants";
import { customersService } from "@/services/customers";
import { productsService } from "@/services/products";
import { ordersService } from "@/services/orders";
import type { Customer, Product } from "@/types";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function NewOrderScreen() {
  // Customer selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Submit
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers();
    }
  }, [customerSearch]);

  const loadProducts = async () => {
    const result = await productsService.getProducts();
    if (result.success && result.data) {
      setProducts(result.data);
    }
  };

  const searchCustomers = async () => {
    const result = await customersService.getCustomers({ search: customerSearch, limit: "10" });
    if (result.success && result.data) {
      setCustomers(result.data.items);
      setShowCustomerList(true);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerList(false);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getCartQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item?.quantity || 0;
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert("Diqqat", "Mijozni tanlang");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Diqqat", "Kamida bitta mahsulot qo'shing");
      return;
    }

    Alert.alert(
      "Tasdiqlash",
      `Mijoz: ${selectedCustomer.name}\nSumma: ${getCartTotal().toLocaleString()} so'm`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Yaratish",
          onPress: async () => {
            setLoading(true);
            const result = await ordersService.createOrder({
              customerId: selectedCustomer.id,
              items: cart.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
              })),
            });

            if (result.success) {
              Alert.alert("Muvaffaqiyat!", "Buyurtma yaratildi");
              // Reset form
              setSelectedCustomer(null);
              setCustomerSearch("");
              setCart([]);
            } else {
              Alert.alert("Xatolik", result.error || "Xatolik yuz berdi");
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Customer Selection */}
      <Text style={styles.sectionTitle}>1. Mijozni tanlang</Text>
      <View style={styles.customerSection}>
        <Input
          placeholder="Ism, telefon yoki manzil bo'yicha qidiring..."
          value={customerSearch}
          onChangeText={(text) => {
            setCustomerSearch(text);
            if (selectedCustomer && text !== selectedCustomer.name) {
              setSelectedCustomer(null);
            }
          }}
        />

        {showCustomerList && customers.length > 0 && !selectedCustomer && (
          <View style={styles.customerDropdown}>
            {customers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={styles.customerOption}
                onPress={() => selectCustomer(customer)}
              >
                <Text style={styles.customerOptionName}>{customer.name}</Text>
                <Text style={styles.customerOptionInfo}>
                  {customer.phone1} | {customer.address}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedCustomer && (
          <Card style={styles.selectedCustomerCard}>
            <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
            <Text style={styles.selectedInfo}>{selectedCustomer.address}</Text>
            <View style={styles.customerMeta}>
              <Text style={styles.metaText}>📞 {selectedCustomer.phone1}</Text>
              <Text style={styles.metaText}>🫙 Idish: {selectedCustomer.bottleBalance}</Text>
              {selectedCustomer.debtBalance > 0 && (
                <Text style={[styles.metaText, { color: Colors.danger }]}>
                  💰 Qarz: {selectedCustomer.debtBalance.toLocaleString()}
                </Text>
              )}
            </View>
          </Card>
        )}
      </View>

      {/* Product Selection */}
      <Text style={styles.sectionTitle}>2. Mahsulotlarni tanlang</Text>
      <View style={styles.productsGrid}>
        {products.map((product) => {
          const qty = getCartQuantity(product.id);
          return (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  {product.price.toLocaleString()} so'm
                </Text>
                {product.isBottle && <Text style={styles.bottleTag}>🫙 Idishli</Text>}
              </View>
              <View style={styles.productActions}>
                {qty > 0 ? (
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => removeFromCart(product.id)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, styles.qtyBtnAdd]}
                      onPress={() => addToCart(product)}
                    >
                      <Text style={[styles.qtyBtnText, { color: Colors.white }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => addToCart(product)}
                  >
                    <Text style={styles.addBtnText}>+ Qo'shish</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card style={styles.cartSummary}>
          <Text style={styles.cartTitle}>Buyurtma tarkibi</Text>
          {cart.map((item) => (
            <View key={item.product.id} style={styles.cartItem}>
              <Text style={styles.cartItemName}>
                {item.product.name} x{item.quantity}
              </Text>
              <Text style={styles.cartItemPrice}>
                {(item.product.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.cartDivider} />
          <View style={styles.cartTotal}>
            <Text style={styles.cartTotalLabel}>Jami:</Text>
            <Text style={styles.cartTotalValue}>
              {getCartTotal().toLocaleString()} so'm
            </Text>
          </View>
        </Card>
      )}

      {/* Submit */}
      <Button
        title="Buyurtma yaratish"
        onPress={handleSubmit}
        loading={loading}
        disabled={!selectedCustomer || cart.length === 0}
        size="lg"
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.gray[800],
    marginBottom: 12,
    marginTop: 8,
  },
  customerSection: { marginBottom: 24 },
  customerDropdown: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    marginTop: -8,
    overflow: "hidden",
  },
  customerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  customerOptionName: { fontSize: 14, fontWeight: "600", color: Colors.gray[800] },
  customerOptionInfo: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  selectedCustomerCard: { padding: 14, marginTop: 8, backgroundColor: Colors.primaryLight },
  selectedName: { fontSize: 15, fontWeight: "700", color: Colors.gray[900] },
  selectedInfo: { fontSize: 13, color: Colors.gray[600], marginTop: 2 },
  customerMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  metaText: { fontSize: 12, color: Colors.gray[600] },
  productsGrid: { gap: 8, marginBottom: 20 },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600", color: Colors.gray[800] },
  productPrice: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  bottleTag: { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
  productActions: {},
  quantityControl: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnAdd: { backgroundColor: Colors.primary },
  qtyBtnText: { fontSize: 18, fontWeight: "700", color: Colors.gray[700] },
  qtyValue: { fontSize: 16, fontWeight: "700", color: Colors.gray[900], minWidth: 20, textAlign: "center" },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  addBtnText: { fontSize: 13, color: Colors.primaryDark, fontWeight: "600" },
  cartSummary: { padding: 16, marginBottom: 20 },
  cartTitle: { fontSize: 15, fontWeight: "700", color: Colors.gray[800], marginBottom: 10 },
  cartItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cartItemName: { fontSize: 13, color: Colors.gray[700] },
  cartItemPrice: { fontSize: 13, fontWeight: "600", color: Colors.gray[700] },
  cartDivider: { height: 1, backgroundColor: Colors.gray[200], marginVertical: 8 },
  cartTotal: { flexDirection: "row", justifyContent: "space-between" },
  cartTotalLabel: { fontSize: 15, fontWeight: "700", color: Colors.gray[800] },
  cartTotalValue: { fontSize: 15, fontWeight: "800", color: Colors.primary },
  submitBtn: { marginTop: 4 },
});
