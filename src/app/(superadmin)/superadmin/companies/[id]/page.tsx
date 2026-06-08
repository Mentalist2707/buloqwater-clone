"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatPhone, formatDateOnly, getStatusLabel, getStatusColor } from "@/lib/utils";
import { getCompanyStats } from "@/actions/company-actions";
import Link from "next/link";

export default function CompanyStatsPage() {
  const params = useParams();
  const companyId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await getCompanyStats(companyId);
      if (r.success && r.data) setData(r.data);
      setLoading(false);
    })();
  }, [companyId]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <div className="text-center py-20"><p className="text-gray-500 dark:text-gray-400">Kompaniya topilmadi</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/superadmin/companies" className="text-sm text-primary-500 hover:underline mb-1 inline-block">← Kompaniyalar</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          {data.company.name}
          <Badge variant={data.company.status === "ACTIVE" ? "success" : "destructive"}>{data.company.status === "ACTIVE" ? "Faol" : "Muzlatilgan"}</Badge>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1"><code>{data.company.subdomain}.buloqwater.uz</code> · {formatDateOnly(data.company.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami Buyurtmalar" value={data.stats.totalOrders} icon={<span className="text-xl">📦</span>} />
        <StatCard title="Yetkazilgan" value={data.stats.deliveredOrders} icon={<span className="text-xl">✅</span>} />
        <StatCard title="Umumiy Tushum" value={formatCurrency(data.stats.totalRevenue)} icon={<span className="text-xl">💰</span>} />
        <StatCard title="Mijozlar" value={data.stats.totalCustomers} icon={<span className="text-xl">👥</span>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Xodimlar ({data.users.length})</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {data.users.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Xodim yo'q</p> : data.users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === "DIRECTOR" ? "bg-purple-500" : u.role === "OPERATOR" ? "bg-blue-500" : "bg-green-500"}`}>{u.name.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatPhone(u.phone)}</p></div>
                </div>
                <Badge variant={u.role === "DIRECTOR" ? "default" : u.role === "OPERATOR" ? "secondary" : "success"}>{u.role === "DIRECTOR" ? "Direktor" : u.role === "OPERATOR" ? "Operator" : "Haydovchi"}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Oxirgi Buyurtmalar</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {data.recentOrders.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Buyurtma yo'q</p> : data.recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div><p className="text-sm font-medium text-gray-900 dark:text-white">#{o.orderNumber} · {o.customer.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatDateOnly(o.createdAt)}</p></div>
                <div className="text-right"><Badge className={getStatusColor(o.status)}>{getStatusLabel(o.status)}</Badge><p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">{formatCurrency(o.totalAmount)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mahsulotlar ({data.products.length})</h3>
        {data.products.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Mahsulot yo'q</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.products.map((p: any) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${p.isActive ? "border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30" : "border-red-100 dark:border-red-900 opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.category === "WATER" ? "💧" : p.category === "PROMO" ? "🔥" : "🔧"}</span>
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{p.category === "WATER" ? "Suv" : p.category === "PROMO" ? "Aksiya" : "Aksessuar"}</p></div>
                </div>
                <div className="text-right"><p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(p.price)}</p><Badge variant={p.isActive ? "success" : "destructive"} className="text-[10px]">{p.isActive ? "Faol" : "Nofaol"}</Badge></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
