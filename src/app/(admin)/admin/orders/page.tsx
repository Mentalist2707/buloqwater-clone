"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { getStatusColor, getStatusLabel, formatCurrency, formatPhone, formatDate } from "@/lib/utils";
import { getOrders, createOrder, assignDriver, getDriversForAssign } from "@/actions/order-actions";
import { searchCustomers, createCustomer } from "@/actions/customer-actions";
import { getProducts } from "@/actions/product-actions";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New order
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone1: "", address: "", landmark: "" });
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
  const loadData = async () => { setLoading(true); const [o, d] = await Promise.all([getOrders(), getDriversForAssign()]); if (o.success) setOrders(o.data as any); if (d.success) setDrivers(d.data as any); setLoading(false); };
  useEffect(() => { loadData(); }, []);

  const handleCustomerSearch = useCallback(async (query: string) => {
    setCustomerSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const r = await searchCustomers(query);
    if (r.success) setSearchResults(r.data as any);
  }, []);

  const openNewOrder = async () => {
    setIsNewOrderOpen(true); setSelectedCustomer(null); setCustomerSearch(""); setSearchResults([]); setIsNewCustomer(false); setFormError("");
    const res = await getProducts();
    if (res.success) { const active = (res.data as any[]).filter((p: any) => p.isActive); setProducts(active); if (active.length > 0) setOrderItems([{ productId: active[0].id, quantity: 1 }]); else setOrderItems([]); }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    let customerId = selectedCustomer?.id;

    if (isNewCustomer) {
      if (!newCustomerForm.name || !newCustomerForm.phone1 || !newCustomerForm.address) { setFormError("Mijoz ismi, telefoni va manzili kerak"); setFormLoading(false); return; }
      const phone1 = newCustomerForm.phone1.startsWith("+") ? newCustomerForm.phone1 : `+998${newCustomerForm.phone1.replace(/\D/g, "")}`;
      const cr = await createCustomer({ name: newCustomerForm.name, phone1, address: newCustomerForm.address, landmark: newCustomerForm.landmark || undefined });
      if (!cr.success) { setFormError(cr.error); setFormLoading(false); return; }
      const sr = await searchCustomers(phone1);
      if (sr.success && (sr.data as any[]).length > 0) customerId = (sr.data as any[])[0].id;
      else { setFormError("Mijoz yaratildi lekin topilmadi"); setFormLoading(false); return; }
    }

    if (!customerId) { setFormError("Mijozni tanlang"); setFormLoading(false); return; }
    const validItems = orderItems.filter((i) => i.quantity > 0);
    if (validItems.length === 0) { setFormError("Kamida 1 mahsulot tanlang"); setFormLoading(false); return; }

    const r = await createOrder({ customerId, items: validItems });
    if (r.success) { setIsNewOrderOpen(false); loadData(); showToast("Buyurtma yaratildi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const handleAssign = async (orderId: string, driverId: string, name: string) => {
    await assignDriver(orderId, driverId);
    loadData(); showToast(`${name}ga biriktirildi`);
  };

  return (
    <div className="relative">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border animate-in ${toast.type === "success" ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"}`}><p className="text-sm font-medium">{toast.type === "success" ? "✅" : "❌"} {toast.message}</p></div>}

      <PageHeader title="Buyurtmalar" description={`${orders.length} ta buyurtma`} action={<Button variant="success" onClick={openNewOrder}>+ Yangi Buyurtma</Button>} />

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center"><p className="text-4xl mb-3">📋</p><p className="text-gray-500 dark:text-gray-400">Buyurtma yo'q</p></div>
          ) : orders.map((order) => (
            <OrderRow key={order.id} order={order} drivers={drivers} onAssign={handleAssign} />
          ))}
        </div>
      )}

      {/* Yangi Buyurtma Modal */}
      <Modal open={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} title="Yangi Buyurtma" className="max-w-xl">
        <form onSubmit={handleCreateOrder} className="space-y-5">
          {formError && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{formError}</div>}

          {/* Mijoz */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mijoz</label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div><p className="text-sm font-medium text-green-800 dark:text-green-200">{selectedCustomer.name}</p><p className="text-xs text-green-600 dark:text-green-400">{selectedCustomer.phone1} · {selectedCustomer.address}</p></div>
                <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} className="text-green-600 text-lg">×</button>
              </div>
            ) : !isNewCustomer ? (
              <div className="relative">
                <Input value={customerSearch} onChange={(e) => handleCustomerSearch(e.target.value)} placeholder="Telefon yoki ism..." autoFocus />
                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-48 overflow-y-auto">
                    {searchResults.map((c) => <button key={c.id} type="button" className="w-full px-4 py-2.5 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm" onClick={() => { setSelectedCustomer(c); setSearchResults([]); }}><p className="font-medium text-gray-900 dark:text-white">{c.name}</p><p className="text-xs text-gray-500">{c.phone1}</p></button>)}
                    <button type="button" className="w-full px-4 py-2.5 text-left bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium" onClick={() => setIsNewCustomer(true)}>+ Yangi mijoz</button>
                  </div>
                )}
                {customerSearch.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl border shadow-xl p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">Topilmadi</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCustomer(true)}>+ Yangi mijoz</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex justify-between"><p className="text-sm font-medium text-blue-800 dark:text-blue-200">Yangi mijoz</p><button type="button" onClick={() => setIsNewCustomer(false)} className="text-xs text-blue-600 hover:underline">Bekor</button></div>
                <Input value={newCustomerForm.name} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} placeholder="Ism *" className="bg-white dark:bg-gray-700" />
                <Input value={newCustomerForm.phone1} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone1: e.target.value })} placeholder="Telefon *" className="bg-white dark:bg-gray-700" />
                <Input value={newCustomerForm.address} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })} placeholder="Manzil *" className="bg-white dark:bg-gray-700" />
                <Input value={newCustomerForm.landmark} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, landmark: e.target.value })} placeholder="Mo'ljal" className="bg-white dark:bg-gray-700" />
              </div>
            )}
          </div>

          {/* Mahsulotlar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mahsulotlar</label>
            <div className="space-y-2">
              {products.map((p) => {
                const item = orderItems.find((i) => i.productId === p.id);
                const qty = item?.quantity || 0;
                return (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${qty > 0 ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800" : "bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700"}`}>
                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(p.price)}</p></div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 border flex items-center justify-center font-bold" onClick={() => { const n = orderItems.filter(i => i.productId !== p.id); if (qty > 1) n.push({ productId: p.id, quantity: qty - 1 }); setOrderItems(n); }}>−</button>
                      <span className="w-6 text-center font-bold text-sm text-gray-900 dark:text-white">{qty}</span>
                      <button type="button" className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold" onClick={() => { const n = orderItems.filter(i => i.productId !== p.id); n.push({ productId: p.id, quantity: qty + 1 }); setOrderItems(n); }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jami */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Jami:</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(orderItems.reduce((s, i) => { const p = products.find(pr => pr.id === i.productId); return s + (p?.price || 0) * i.quantity; }, 0))}</span>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)}>Bekor</Button>
            <Button type="submit" variant="success" disabled={formLoading}>{formLoading ? "Yaratilmoqda..." : "✅ Buyurtma yaratish"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function OrderRow({ order, drivers, onAssign }: { order: any; drivers: any[]; onAssign: (o: string, d: string, n: string) => void }) {
  const [showDrivers, setShowDrivers] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-gray-400">#{order.orderNumber}</span>
            <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
            <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(order.createdAt)}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer.address} · {order.customer.phone1}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {order.items?.map((item: any, idx: number) => <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{item.product.name} ×{item.quantity}</span>)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</p>
          {order.driver ? (
            <Badge variant="default">🚚 {order.driver.name}</Badge>
          ) : order.status === "PENDING" && (
            <div className="relative">
              <Button size="sm" variant="outline" onClick={() => setShowDrivers(!showDrivers)}>Biriktirish</Button>
              {showDrivers && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-xl z-20 overflow-hidden">
                  {drivers.map((d) => <button key={d.id} className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-white" onClick={() => { onAssign(order.id, d.id, d.name); setShowDrivers(false); }}>{d.name} <span className="text-xs text-gray-400">({d.ordersCount})</span></button>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
