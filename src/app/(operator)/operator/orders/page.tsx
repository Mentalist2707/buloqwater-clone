"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { getStatusColor, getStatusLabel, formatCurrency, formatPhone } from "@/lib/utils";
import { getOrders, createOrder, assignDriver, getDriversForAssign } from "@/actions/order-actions";
import { searchCustomers } from "@/actions/customer-actions";
import { getProducts } from "@/actions/product-actions";

type TabFilter = "ALL" | "PENDING" | "ASSIGNED" | "DELIVERED" | "CANCELLED";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Yangi buyurtma formi
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [o, d] = await Promise.all([getOrders(), getDriversForAssign()]);
    if (o.success) setOrders(o.data as any);
    if (d.success) setDrivers(d.data as any);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Mijoz qidirish
  const handleCustomerSearch = useCallback(async (query: string) => {
    setCustomerSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const r = await searchCustomers(query);
    if (r.success) setSearchResults(r.data as any);
  }, []);

  const openNewOrder = async () => {
    setIsNewOrderOpen(true);
    const res = await getProducts();
    if (res.success) { setProducts(res.data as any); if ((res.data as any).length > 0) setOrderItems([{ productId: (res.data as any)[0].id, quantity: 1 }]); }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) { setFormError("Mijozni tanlang"); return; }
    setFormLoading(true); setFormError("");
    const r = await createOrder({ customerId: selectedCustomer.id, items: orderItems.filter((i) => i.quantity > 0) });
    if (r.success) { setIsNewOrderOpen(false); setSelectedCustomer(null); setCustomerSearch(""); setOrderItems([]); loadData(); showToast("Buyurtma yaratildi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const handleAssignDriver = async (orderId: string, driverId: string, driverName: string) => {
    await assignDriver(orderId, driverId);
    loadData();
    showToast(`Buyurtma ${driverName}ga biriktirildi`);
  };

  // Filtr
  const filteredOrders = activeTab === "ALL" ? orders : orders.filter((o) => o.status === activeTab);
  const tabCounts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    ASSIGNED: orders.filter((o) => o.status === "ASSIGNED" || o.status === "IN_TRANSIT").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border animate-in fade-in slide-in-from-top-2 ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <p className="text-sm font-medium">{toast.type === "success" ? "✅" : "❌"} {toast.message}</p>
        </div>
      )}

      <PageHeader
        title="Buyurtmalar Markazi"
        action={<Button variant="success" size="lg" onClick={openNewOrder} className="shadow-lg shadow-green-500/20 text-base px-6">+ Yangi Buyurtma</Button>}
      />

      {/* Tab Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {([
          { key: "ALL", label: "Barchasi" },
          { key: "PENDING", label: "Kutilmoqda" },
          { key: "ASSIGNED", label: "Jarayonda" },
          { key: "DELIVERED", label: "Yetkazildi" },
        ] as { key: TabFilter; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-primary-500 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Buyurtmalar */}
          <div className="lg:col-span-2 space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">Bu filtrada buyurtma yo'q</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} drivers={drivers} onAssign={handleAssignDriver} />
              ))
            )}
          </div>

          {/* Haydovchilar paneli */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Haydovchilar yuklamasi
            </h3>
            <div className="space-y-3">
              {drivers.length === 0 ? (
                <div className="bg-white rounded-xl border p-4 text-center text-gray-500 text-sm">Haydovchi yo'q</div>
              ) : (
                drivers.map((d) => {
                  const loadPercent = Math.min((d.ordersCount / 10) * 100, 100);
                  const loadColor = loadPercent >= 80 ? "bg-red-500" : loadPercent >= 50 ? "bg-yellow-500" : "bg-green-500";
                  return (
                    <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${loadPercent >= 80 ? "bg-red-500" : "bg-green-500"}`}>
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{d.name}</p>
                            <p className="text-xs text-gray-500">{formatPhone(d.phone)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{d.ordersCount}</p>
                          <p className="text-[10px] text-gray-500">buyurtma</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${loadColor}`} style={{ width: `${loadPercent}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{d.ordersCount}/10 kapasite</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Yangi Buyurtma */}
      <Modal open={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} title="Yangi Buyurtma">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Mijoz</label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div><p className="text-sm font-medium text-green-800">{selectedCustomer.name}</p><p className="text-xs text-green-600">{selectedCustomer.phone1} · {selectedCustomer.address}</p></div>
                <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} className="text-green-600 hover:text-green-800 text-lg">✕</button>
              </div>
            ) : (
              <div className="relative">
                <Input value={customerSearch} onChange={(e) => handleCustomerSearch(e.target.value)} placeholder="Telefon yoki ism bo'yicha qidiring..." autoFocus />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((c) => (
                      <button key={c.id} type="button" className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0" onClick={() => { setSelectedCustomer(c); setSearchResults([]); }}>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone1} · {c.address}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div><label className="block text-sm font-medium mb-2">Mahsulotlar</label>
            <div className="space-y-2">
              {products.map((p) => {
                const item = orderItems.find((i) => i.productId === p.id);
                const qty = item?.quantity || 0;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-gray-500">{formatCurrency(p.price)}</p></div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-600 hover:bg-gray-100" onClick={() => { const n = orderItems.filter(i => i.productId !== p.id); if (qty > 1) n.push({ productId: p.id, quantity: qty - 1 }); setOrderItems(n); }}>−</button>
                      <span className="w-8 text-center font-bold text-sm">{qty}</span>
                      <button type="button" className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600" onClick={() => { const n = orderItems.filter(i => i.productId !== p.id); n.push({ productId: p.id, quantity: qty + 1 }); setOrderItems(n); }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-2 border-t"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Jami:</span><span className="text-lg font-bold">{formatCurrency(orderItems.reduce((sum, item) => { const p = products.find((pr) => pr.id === item.productId); return sum + (p?.price || 0) * item.quantity; }, 0))}</span></div></div>
          <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)}>Bekor</Button><Button type="submit" variant="success" disabled={formLoading}>{formLoading ? "Saqlanmoqda..." : "Buyurtma yaratish"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}

// ── Order Card with visual status indicator ───────────────────
function OrderCard({ order, drivers, onAssign }: { order: any; drivers: any[]; onAssign: (o: string, d: string, name: string) => void }) {
  const [showDrivers, setShowDrivers] = useState(false);

  // Kechikish hisoblash
  const minutesSinceCreated = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isLate = order.status === "PENDING" && minutesSinceCreated > 60;
  const isNew = minutesSinceCreated < 5;

  const borderColor = isLate ? "border-l-red-500" : isNew ? "border-l-green-500" : order.status === "ASSIGNED" ? "border-l-blue-500" : order.status === "DELIVERED" ? "border-l-green-400" : "border-l-yellow-500";

  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${borderColor} p-4 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">#{order.orderNumber}</span>
            <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
            {isLate && <Badge variant="destructive">Kechikkan!</Badge>}
            {isNew && <Badge variant="success">Yangi</Badge>}
          </div>
          <p className="text-sm font-semibold text-gray-900">{order.customer.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{order.customer.address}</p>
          <div className="flex items-center gap-3 mt-2">
            <a href={`tel:${order.customer.phone1}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              📞 {order.customer.phone1}
            </a>
            <span className="text-xs font-medium text-gray-700">💰 {formatCurrency(order.totalAmount)}</span>
          </div>
          {/* Items */}
          <div className="flex flex-wrap gap-1 mt-2">
            {order.items?.map((item: any, idx: number) => (
              <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.product.name} ×{item.quantity}</span>
            ))}
          </div>
        </div>

        {/* Assign driver */}
        <div className="ml-4 flex-shrink-0">
          {order.driver ? (
            <div className="text-right"><p className="text-[10px] text-gray-400">Haydovchi</p><p className="text-sm font-medium text-blue-700">{order.driver.name}</p></div>
          ) : order.status === "PENDING" && (
            <div className="relative">
              <Button size="sm" variant="outline" onClick={() => setShowDrivers(!showDrivers)}>
                🚚 Biriktirish
              </Button>
              {showDrivers && (
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border shadow-xl z-20 overflow-hidden">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">Haydovchi tanlang</p>
                  {drivers.map((d) => (
                    <button key={d.id} className="w-full px-3 py-2.5 text-left hover:bg-primary-50 flex items-center justify-between" onClick={() => { onAssign(order.id, d.id, d.name); setShowDrivers(false); }}>
                      <span className="text-sm font-medium">{d.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${d.ordersCount >= 8 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{d.ordersCount}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
