import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/utils";

async function getAdminStats(companyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dailySales, dailyDeliveries, newCustomers, unreturnedBottles] = await Promise.all([
    prisma.order.aggregate({ where: { companyId, status: "DELIVERED", deliveredAt: { gte: today } }, _sum: { totalAmount: true } }),
    prisma.order.count({ where: { companyId, status: "DELIVERED", deliveredAt: { gte: today } } }),
    prisma.customer.count({ where: { companyId, createdAt: { gte: monthStart } } }),
    prisma.customer.aggregate({ where: { companyId, bottleBalance: { gt: 0 } }, _sum: { bottleBalance: true } }),
  ]);

  return {
    dailySales: dailySales._sum.totalAmount || 0,
    dailyDeliveries,
    newCustomers,
    unreturnedBottles: unreturnedBottles._sum.bottleBalance || 0,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user.companyId) return null;

  const stats = await getAdminStats(session.user.companyId);

  return (
    <div>
      <PageHeader title="Analitika" description="Kompaniya ko'rsatkichlari" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Kunlik sotuv" value={formatCurrency(stats.dailySales)} icon={<span className="text-xl">💰</span>} />
        <StatCard title="Yetkazilgan" value={`${stats.dailyDeliveries} ta`} icon={<span className="text-xl">✅</span>} />
        <StatCard title="Yangi mijozlar (oy)" value={stats.newCustomers} icon={<span className="text-xl">👤</span>} />
        <StatCard title="Qaytarilmagan idish" value={`${stats.unreturnedBottles} ta`} icon={<span className="text-xl">🫙</span>} />
      </div>
    </div>
  );
}
