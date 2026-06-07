import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/page-header";

async function getStats() {
  const [totalCompanies, activeCompanies, suspendedCompanies, totalUsers] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.company.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
  ]);
  return { totalCompanies, activeCompanies, suspendedCompanies, totalUsers };
}

export default async function SuperAdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <PageHeader title="Dashboard" description="Tizimdagi umumiy ko'rsatkichlar" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Jami Kompaniyalar" value={stats.totalCompanies} icon={<span className="text-xl">🏢</span>} />
        <StatCard title="Faol Kompaniyalar" value={stats.activeCompanies} icon={<span className="text-xl">✅</span>} />
        <StatCard title="Muzlatilgan" value={stats.suspendedCompanies} icon={<span className="text-xl">⏸️</span>} />
        <StatCard title="Jami Foydalanuvchilar" value={stats.totalUsers} icon={<span className="text-xl">👥</span>} />
      </div>
    </div>
  );
}
