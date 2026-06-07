"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency } from "@/lib/utils";
import { getDriverOrders, deliverOrder } from "@/actions/order-actions";

export default function DriverTasksPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverModal, setDeliverModal] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<"CASH" | "CLICK" | "CREDIT">("CASH");
  const [bottlesReturned, setBottlesReturned] = useState(0);
  const [deliverLoading, setDeliverLoading] = useState(false);

  const loadOrders = async () => { setLoading(true); const r = await getDriverOrders(); if (r.success) setOrders(r.data as any); setLoading(false); };
  useEffect(() => { loadOrders(); }, []);

  const openDeliverModal = (order: any) => { setDeliverModal(order); setPaymentType("CASH"); setBottlesReturned(order.bottlesDelivered); };

  const handleDeliver = async () => {
    if (!deliverModal) return;
    setDeliverLoading(true);
    const r = await deliverOrder({ orderId: deliverModal.id, paymentType, bottlesReturned });
    if (r.success) { setDeliverModal(null); loadOrders(); }
    setDeliverLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-4"><h2 className="text-xl font-bold">Mening Vazifalarim</h2><p className="text-sm text-gray-500">{orders.length} ta buyurtma</p></div>

      {orders.length === 0 && <div className="text-center py-16"><div className="text-5xl mb-4">✅</div><h3 className="text-lg font-semibold">Barcha vazifalar bajarildi!</h3><Button variant="outline" className="mt-4" onClick={loadOrders}>Yangilash</Button></div>}

      <div className="space-y-4">
        {orders.map((order, idx) => (
          <div key={order.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">{idx + 1}</div><div><p className="font-semibold">{order.customer.name}</p><p className="text-xs text-gray-500">#{order.orderNumber}</p></div></div>
              <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
            </div>
            <div className="px-5 pb-3 space-y-2">
              <div className="flex items-start gap-2"><span>📍</span><div><p className="text-sm text-gray-700">{order.customer.address}</p>{order.customer.landmark && <p className="text-xs text-gray-500">{order.customer.landmark}</p>}</div></div>
              <div className="flex items-center gap-2"><span>💰</span><span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span></div>
            </div>
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
              <a href={`tel:${order.customer.phone1}`} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-blue-50 text-blue-600"><span>📞</span><span className="text-xs font-medium">Qo'ng'iroq</span></a>
              <a href={order.customer.locationLink || `https://yandex.uz/maps/?text=${encodeURIComponent(order.customer.address)}`} target="_blank" className="flex flex-col items-center gap-1 py-3 rounded-xl bg-purple-50 text-purple-600"><span>📍</span><span className="text-xs font-medium">Xarita</span></a>
              <button onClick={() => openDeliverModal(order)} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-green-50 text-green-600"><span>✅</span><span className="text-xs font-medium">Yopish</span></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!deliverModal} onClose={() => setDeliverModal(null)} title="Buyurtmani yakunlash">
        {deliverModal && (
          <div className="space-y-5">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="font-medium">{deliverModal.customer.name}</p><p className="text-xs text-gray-500">{deliverModal.customer.address}</p><p className="font-bold mt-1">{formatCurrency(deliverModal.totalAmount)}</p></div>
            <div><label className="block text-sm font-medium mb-2">To'lov turi</label><div className="grid grid-cols-3 gap-2">{([["CASH","Naqd","💵"],["CLICK","Click","📱"],["CREDIT","Qarz","📝"]] as const).map(([v,l,i]) => <button key={v} type="button" className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 ${paymentType === v ? "border-primary-500 bg-primary-50" : "border-gray-200"}`} onClick={() => setPaymentType(v as any)}><span className="text-xl">{i}</span><span className="text-xs font-medium">{l}</span></button>)}</div></div>
            <div><label className="block text-sm font-medium mb-2">Qaytarilgan baxlalar</label><div className="flex items-center gap-4"><button type="button" className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold" onClick={() => setBottlesReturned(Math.max(0, bottlesReturned - 1))}>−</button><span className="text-3xl font-bold min-w-[60px] text-center">{bottlesReturned}</span><button type="button" className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold" onClick={() => setBottlesReturned(bottlesReturned + 1)}>+</button></div><p className="text-xs text-gray-500 mt-1">Berilgan: {deliverModal.bottlesDelivered} ta</p></div>
            <Button variant="success" size="lg" className="w-full" onClick={handleDeliver} disabled={deliverLoading}>{deliverLoading ? "Yakunlanmoqda..." : "✅ Yakunlash"}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
