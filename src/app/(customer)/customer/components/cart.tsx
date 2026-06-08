"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { placeCustomerOrder } from "@/actions/customer-order-actions";

interface CartItem {
  productId: string;
  quantity: number;
  product: { id: string; name: string; price: number; isBottle: boolean };
}

interface CartProps {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  onClear: () => void;
}

export function CustomerCart({ items, totalAmount, totalItems, onClear }: CartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"review" | "confirm">("review");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleOrder = async () => {
    setLoading(true);
    setError("");

    const result = await placeCustomerOrder({
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      notes: notes || undefined,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setStep("review");
        setNotes("");
        onClear();
      }, 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-30 bg-primary-500 hover:bg-primary-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-primary-500/30 flex items-center gap-3 active:scale-95 transition-all animate-in slide-in-from-bottom-4"
      >
        <div className="relative">
          <span className="text-xl">🛒</span>
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        </div>
        <div className="text-left">
          <p className="text-xs opacity-80">Savat</p>
          <p className="text-sm font-bold">{formatCurrency(totalAmount)}</p>
        </div>
      </button>

      {/* Cart Modal */}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Savatingiz" className="max-w-md">
        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Buyurtma qabul qilindi!</h3>
            <p className="text-sm text-gray-500 mt-2">Tez orada operator siz bilan bog'lanadi</p>
          </div>
        ) : step === "review" ? (
          <div className="space-y-4">
            {/* Items list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.product.isBottle ? "🫙" : "💧"}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.product.price)} × {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Jami:</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClear}>
                Tozalash
              </Button>
              <Button variant="success" className="flex-1" onClick={() => setStep("confirm")}>
                Buyurtma berish →
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                📦 {totalItems} ta mahsulot · {formatCurrency(totalAmount)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Manzilga yetkazib beriladi
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Izoh (ixtiyoriy)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Masalan: 3-qavat, eshik kodi 1234..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("review")}>← Orqaga</Button>
              <Button variant="success" className="flex-1" onClick={handleOrder} disabled={loading}>
                {loading ? "Yuborilmoqda..." : "✅ Tasdiqlash"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
