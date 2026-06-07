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

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
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
    if (r.success) { setIsNewOrderOpen(false); setSelectedCustomer(null); setCustomerSearch(""); setOrderItems([]); loadData(); } else setFormError(r.error);
    setFormLoading(false);
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => { await assignDriver(orderId, driverId); loadData(); };

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const activeOrders = orders.filter((o) => o.status === "ASSIGNED" || o.status === "IN_TRANSIT");

  return (
    <div>
      <PageHeader title="Buyurtmalar Markazi" action={<Button variant="success" size="lg" onClick={openNewOrder}>+ Yangi Buyurtma</Button>} />
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Kutilmoqda ({pendingOrders.length})</h3>
            {pendingOrders.map((order) => <OrderCard key={order.id} order={order} drivers={drivers} onAssign={handleAssignDriver} />)}
            {activeOrders.length > 0 && <><h3 className="text-sm font-semibold text-gray-500 uppercase mt-6">Jarayonda ({activeOrders.length})</h3>{activeOrders.map((order) => <OrderCard key={order.id} order={order} drivers={drivers} onAssign={handleAssignDriver} />)}</>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Haydovchilar</h3>
            {drivers.map((d) => (<div key={d.id} className="bg-white rounded-xl border p-4 mb-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-gray-500">{formatPhone(d.phone)}</p></div><div className="text-right"><p className="text-lg font-bold">{d.ordersCount}</p><p className="text-xs text-gray-500">buyurtma</p></div></div></div>))}
          </div>
        </div>
      )}

      <Modal open={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} title="Yangi Buyurtma">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Mijoz</label>
            {selectedCustomer ? <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg"><div><p className="text-sm font-medium text-green-800">{selectedCustomer.name}</p><p className="text-xs text-green-600">{selectedCustomer.phone1}</p></div><button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}>✕</button></div> : <div className="relative"><Input value={customerSearch} onChange={(e) => handleCustomerSearch(e.target.value)} placeholder="Telefon yoki ism..." autoFocus />{searchResults.length > 0 && <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border shadow-lg max-h-48 overflow-y-auto">{searchResults.map((c) => <button key={c.id} type="button" className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm" onClick={() => { setSelectedCustomer(c); setSearchResults([]); }}>{c.name} - {c.phone1}</button>)}</div>}</div>}
          </div>
          <div><label className="block text-sm font-medium mb-2">Mahsulotlar</label>{products.map((p) => { const item = orderItems.find((i) => i.productId === p.id); const qty = item?.quantity || 0; return <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"><div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-gray-500">{formatCurrency(p.price)}</p></div><div className="flex items-center gap-2"><button type="button" className="w-8 h-8 rounded-full bg-white border flex items-center justify-center" onClick={() => { const n = orderItems.filter(i => i.productId !== p.id); if (qty > 1) n.push({ productId: p.id, quantity: qty - 1 }); setOrderItems(n); }}>−</button><span className="w-8 text-center font-bold">{qty}</span><button type="button" className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center" onClick={() => { const n = orderItems.filter(i => i.productId !== p.id); n.push({ productId: p.id, quantity: qty + 1 }); setOrderItems(n); }}>+</button></div></div>; })}</div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)}>Bekor</Button><Button type="submit" variant="success" disabled={formLoading}>{formLoading ? "..." : "Buyurtma yaratish"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function OrderCard({ order, drivers, onAssign }: { order: any; drivers: any[]; onAssign: (o: string, d: string) => void }) {
  const [showDrivers, setShowDrivers] = useState(false);
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div><div className="flex items-center gap-2 mb-1"><span className="text-xs text-gray-400">#{order.orderNumber}</span><Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge></div><p className="text-sm font-semibold">{order.customer.name}</p><p className="text-xs text-gray-500">{order.customer.address}</p><div className="flex gap-3 mt-2 text-xs text-gray-500"><span>{order.customer.phone1}</span><span>{formatCurrency(order.totalAmount)}</span></div></div>
        <div>{order.driver ? <p className="text-xs text-right"><span className="text-gray-500">Haydovchi:</span><br/><span className="font-medium">{order.driver.name}</span></p> : order.status === "PENDING" && <div className="relative"><Button size="sm" variant="outline" onClick={() => setShowDrivers(!showDrivers)}>Biriktirish</Button>{showDrivers && <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border shadow-lg z-10">{drivers.map(d => <button key={d.id} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { onAssign(order.id, d.id); setShowDrivers(false); }}>{d.name} ({d.ordersCount})</button>)}</div>}</div>}</div>
      </div>
    </div>
  );
}
