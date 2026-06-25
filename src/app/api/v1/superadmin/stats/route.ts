/**
 * GET /api/v1/superadmin/stats — Super Admin dashboard statistikasi
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRoles, unauthorized, forbidden, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["SUPER_ADMIN"])) return forbidden();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalCompanies, activeCompanies, suspendedCompanies, totalUsers,
      thisMonthCompanies, lastMonthCompanies,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.company.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
      prisma.company.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.company.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ]);

    const growthPercent = lastMonthCompanies > 0
      ? Math.round(((thisMonthCompanies - lastMonthCompanies) / lastMonthCompanies) * 100)
      : thisMonthCompanies > 0 ? 100 : 0;

    // Top 5 kompaniyalar (buyurtma soniga ko'ra)
    const topCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { orders: { _count: "desc" } },
      select: {
        id: true, name: true, subdomain: true, status: true,
        _count: { select: { orders: true, customers: true, users: true } },
        subscription: { select: { endDate: true, isPaid: true } },
      },
    });

    // So'nggi 10 ta faoliyat logi
    const recentLogs = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, action: true, description: true, createdAt: true,
        company: { select: { name: true } },
      },
    });

    return success({
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      totalUsers,
      thisMonthCompanies,
      growthPercent,
      topCompanies: topCompanies.map((c) => ({
        ...c,
        subscription: c.subscription
          ? { endDate: c.subscription.endDate.toISOString(), isPaid: c.subscription.isPaid }
          : null,
      })),
      recentLogs: recentLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch {
    return serverError();
  }
}
