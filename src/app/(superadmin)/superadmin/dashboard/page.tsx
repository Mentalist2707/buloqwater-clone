import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import Link from "next/link";
import { MonthlyGrowthChart } from "./components/monthly-chart";

async function getDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalCompanies, activeCompanies, suspendedCompanies, totalUsers,
    thisMonthCompanies, lastMonthCompanies, topCompanies, recentLogs, monthlyData,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.company.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    prisma.company.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.company.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.company.findMany({
      take: 5,
      orderBy: { orders: { _count: "desc" } },
      include: {
        _count: { select: { orders: true, customers: true, users: true } },
        subscription: { select: { endDate: true, isPaid: true } },
      },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { company: { select: { name: true, subdomain: true } } },
    }),
    getMonthlyGrowth(),
  ]);

  const growthPercent = lastMonthCompanies > 0
    ? Math.round(((thisMonthCompanies - lastMonthCompanies) / lastMonthCompanies) * 100)
    : thisMonthCompanies > 0 ? 100 : 0;

  return { totalCompanies, activeCompanies, suspendedCompanies, totalUsers, thisMonthCompanies, growthPercent, topCompanies, recentLogs, monthlyData };
}

async function getMonthlyGrowth() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const count = await prisma.company.count({ where: { createdAt: { gte: start, lte: end } } });
    const revenue = await prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: start, lte: end } }, _sum: { totalAmount: true } });
    months.push({ month: start.toLocaleDateString("uz-UZ", { month: "short" }), companies: count, revenue: revenue._sum.totalAmount || 0 });
  }
  return months;
}

function getTimeDiff(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = { company_created: "🏢", company_suspended: "⏸️", company_activated: "▶️", user_created: "👤", user_login: "🔑", order_delivered: "📦", payment_received: "💰", subscription_extended: "📅" };
  return icons[action] || "📋";
}

export default async function SuperAdminDashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tizimdagi umumiy ko'rsatkichlar</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/superadmin/companies">
            <Button size="lg" className="shadow-lg shadow-primary-500/20">+ Yangi Kompaniya</Button>
          </Link>
          <Button variant="outline" size="lg">📢 Xabarnoma</Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami Kompaniyalar" value={data.totalCompanies} icon={<span className="text-xl">🏢</span>} trend={data.growthPercent !== 0 ? { value: Math.abs(data.growthPercent), positive: data.growthPercent > 0 } : undefined} description={`Shu oy: +${data.thisMonthCompanies}`} />
        <StatCard title="Faol Kompaniyalar" value={data.activeCompanies} icon={<span className="text-xl">✅</span>} description={`${data.totalCompanies > 0 ? Math.round((data.activeCompanies / data.totalCompanies) * 100) : 0}% faollik`} />
        <StatCard title="Muzlatilgan" value={data.suspendedCompanies} icon={<span className="text-xl">⏸️</span>} description={data.suspendedCompanies > 0 ? "Diqqat talab" : "Hammasi yaxshi"} />
        <StatCard title="Jami Foydalanuvchilar" value={data.totalUsers} icon={<span className="text-xl">👥</span>} description="Barcha kompaniyalar" />
      </div>

      {/* Grafik */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Oylik O'sish Dinamikasi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Oxirgi 6 oy</p>
          </div>
        </div>
        <MonthlyGrowthChart data={data.monthlyData} />
      </div>

      {/* 2 ustunli */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Kompaniya */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eng Faol Kompaniyalar</h3>
            <Link href="/superadmin/companies" className="text-sm text-primary-500 hover:underline">Hammasi →</Link>
          </div>
          <div className="space-y-2">
            {data.topCompanies.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Hali kompaniya yo'q</p>
            ) : (
              data.topCompanies.map((company, idx) => {
                const daysLeft = company.subscription ? Math.ceil((new Date(company.subscription.endDate).getTime() - Date.now()) / 86400000) : null;
                return (
                  <div key={company.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{company.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{company._count.orders} buyurtma · {company._count.customers} mijoz</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {daysLeft !== null && (
                        <Badge variant={daysLeft > 7 ? "success" : daysLeft > 0 ? "warning" : "destructive"}>
                          {daysLeft > 0 ? `${daysLeft} kun` : "Muddati o'tgan"}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Faoliyat Jurnali</h3>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {data.recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Hali faoliyat yo'q</p>
            ) : (
              data.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <span className="text-lg mt-0.5">{getActionIcon(log.action)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{getTimeDiff(log.createdAt)}</span>
                      {log.company && <span className="text-xs text-primary-500">{log.company.name}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
