"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface WeeklyData {
  day: string;
  date: string;
  orders: number;
  revenue: number;
}

interface Alert {
  type: "warning" | "danger" | "info";
  message: string;
}

interface DashboardStats {
  dailySales: number;
  salesTrend: number;
  dailyDeliveries: number;
  deliveryTrend: number;
  newCustomersMonth: number;
  unreturnedBottles: number;
  totalDebt: number;
  weeklyData: WeeklyData[];
  alerts: Alert[];
  pendingOrders: number;
  activeDrivers: number;
}

export function AdminDashboardClient({ stats }: { stats: DashboardStats }) {
  const maxRevenue = Math.max(...stats.weeklyData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analitika</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kompaniya ko'rsatkichlari</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="success">+ Yangi Buyurtma</Button>
          </Link>
          <Button variant="outline">📊 Hisobot</Button>
        </div>
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alert.type === "danger"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : alert.type === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <span className="text-lg">
                {alert.type === "danger" ? "🚨" : alert.type === "warning" ? "⚠️" : "ℹ️"}
              </span>
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stat Cards - Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Kunlik sotuv"
          value={formatCurrency(stats.dailySales)}
          icon={<span className="text-xl">💰</span>}
          trend={stats.salesTrend !== 0 ? { value: Math.abs(stats.salesTrend), positive: stats.salesTrend > 0 } : undefined}
        />
        <StatCard
          title="Yetkazilgan"
          value={`${stats.dailyDeliveries} ta`}
          icon={<span className="text-xl">🚚</span>}
          trend={stats.deliveryTrend !== 0 ? { value: Math.abs(stats.deliveryTrend), positive: stats.deliveryTrend > 0 } : undefined}
        />
        <StatCard
          title="Yangi mijozlar"
          value={stats.newCustomersMonth}
          icon={<span className="text-xl">👤</span>}
          description="Shu oy"
        />
        <StatCard
          title="Qaytarilmagan idish"
          value={`${stats.unreturnedBottles} ta`}
          icon={<span className="text-xl">🫙</span>}
          description={stats.unreturnedBottles > 10 ? "Diqqat!" : "Norma"}
        />
      </div>

      {/* Mini stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Kutilayotgan buyurtmalar</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-lg">⏳</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Umumiy qarz</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-lg">💳</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Faol haydovchilar</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeDrivers}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-lg">🚚</div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Haftalik Buyurtmalar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Oxirgi 7 kun</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">
              Jami: {formatCurrency(stats.weeklyData.reduce((s, d) => s + d.revenue, 0))}
            </Badge>
          </div>
        </div>

        {/* Chart */}
        <div className="flex items-end gap-3 h-40 px-2">
          {stats.weeklyData.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Hover tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                <p className="text-xs font-bold text-gray-900 dark:text-white">{item.orders} ta</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatCurrency(item.revenue)}</p>
              </div>
              {/* Bar */}
              <div
                className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-md transition-all group-hover:from-primary-600 group-hover:to-primary-400 min-h-[4px] cursor-pointer"
                style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, 4)}px` }}
              />
              {/* Label */}
              <div className="text-center">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.day}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.weeklyData.reduce((s, d) => s + d.orders, 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Jami buyurtmalar</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.weeklyData.reduce((s, d) => s + d.revenue, 0))}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Jami tushum</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(stats.weeklyData.reduce((s, d) => s + d.orders, 0) / 7)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">O'rtacha kunlik</p>
          </div>
        </div>
      </div>
    </div>
  );
}
