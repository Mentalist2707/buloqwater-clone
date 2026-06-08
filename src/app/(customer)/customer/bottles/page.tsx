"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { getCustomerBalance } from "@/actions/customer-order-actions";

export default function CustomerBottlesPage() {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await getCustomerBalance();
      if (r.success && r.data) setBalance(r.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-lg mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">♻️ Idishlar Balansi</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 text-center shadow-sm">
          <p className="text-4xl font-bold text-orange-600">{balance?.bottleBalance || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sizda bor idishlar</p>
          <p className="text-[10px] text-gray-400 mt-2">Qaytarilishi kerak</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 text-center shadow-sm">
          <p className={`text-4xl font-bold ${(balance?.debtBalance || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
            {(balance?.debtBalance || 0) > 0 ? formatCurrency(balance.debtBalance) : "0"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Qarz</p>
          <p className="text-[10px] text-gray-400 mt-2">{(balance?.debtBalance || 0) > 0 ? "To'lanishi kerak" : "Qarz yo'q ✅"}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">ℹ️ Idish qanday hisoblanadi?</h3>
        <ul className="space-y-2 text-xs text-blue-700 dark:text-blue-400">
          <li>• Sizga 19L suv yetkazilganda, baxla (idish) soni +1 bo'ladi</li>
          <li>• Haydovchi bo'sh baxlani qaytarib olganda, soni -1 bo'ladi</li>
          <li>• Agar 5+ idish qaytarilmasa, sizga eslatma yuboriladi</li>
        </ul>
      </div>
    </div>
  );
}
