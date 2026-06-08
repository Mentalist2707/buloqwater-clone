"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency, formatDate } from "@/lib/utils";
import { getCustomerOrders } from "@/actions/customer-order-actions";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await getCustomerOrders();
      if (r.success && r.data) setOrders(r.data as any);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📦 Buyurtmalarim</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-5xl mb-3">📋</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Buyurtmalar yo'q</h3>
          <p className="text-sm text-gray-500 mt-1">Birinchi buyurtmangizni bering!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">#{order.orderNumber}</span>
                  <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                </div>
                <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
              </div>

              {/* Items */}
              <div className="px-5 py-4">
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{item.product?.isBottle ? "🫙" : "💧"}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-200">{item.product?.name || "Mahsulot"}</span>
                        <span className="text-xs text-gray-400">×{item.quantity}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Jami:</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
                </div>

                {/* Status info */}
                {order.status === "ASSIGNED" && order.driver && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      🚚 Haydovchi: <span className="font-medium">{order.driver.name}</span> — Yo'lda!
                    </p>
                  </div>
                )}
                {order.status === "DELIVERED" && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      ✅ Yetkazildi: {order.deliveredAt ? formatDate(order.deliveredAt) : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
