/**
 * GET /api/v1/superadmin/analytics — moliyaviy tahlil
 * Requires: SUPER_ADMIN
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser, requireRoles, unauthorized, forbidden,
  success, serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!requireRoles(auth.role, ["SUPER_ADMIN"])) return forbidden();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for performance
    const [
      totalRevenueAgg,
      monthlyRevenueAgg,
      totalOrders,
      deliveredOrders,
      topCompaniesRaw,
      paymentCash,
      paymentClick,
      paymentCredit,
    ] = await Promise.all([
      // Total revenue (all delivered orders)
      prisma.order.aggregate({
        where: { status: "DELIVERED" },
        _sum: { totalAmount: true },
      }),
      // Monthly revenue
      prisma.order.aggregate({
        where: { status: "DELIVERED", deliveredAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      // Total orders
      prisma.order.count(),
      // Delivered orders
      prisma.order.count({ where: { status: "DELIVERED" } }),
      // Top 5 companies by order count
      prisma.order.groupBy({
        by: ["companyId"],
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      // Payment breakdown: cash
      prisma.order.aggregate({
        where: { status: "DELIVERED", paymentType: "CASH" },
        _sum: { totalAmount: true },
      }),
      // Payment breakdown: click
      prisma.order.aggregate({
        where: { status: "DELIVERED", paymentType: "CLICK" },
        _sum: { totalAmount: true },
      }),
      // Payment breakdown: credit
      prisma.order.aggregate({
        where: { status: "DELIVERED", paymentType: "CREDIT" },
        _sum: { totalAmount: true },
      }),
    ]);

    // Enrich top companies with names
    const companyIds = topCompaniesRaw.map((r) => r.companyId);
    const companyNames = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const nameMap = Object.fromEntries(companyNames.map((c) => [c.id, c.name]));

    const topCompanyByOrders = topCompaniesRaw.map((r) => ({
      name: nameMap[r.companyId] ?? r.companyId,
      orders: r._count.id,
      revenue: r._sum.totalAmount ?? 0,
    }));

    // Last 6 months data
    const monthlyData = await getMonthlyData(6);

    return success({
      totalRevenue: totalRevenueAgg._sum.totalAmount ?? 0,
      monthlyRevenue: monthlyRevenueAgg._sum.totalAmount ?? 0,
      totalOrders,
      deliveredOrders,
      topCompanyByOrders,
      monthlyData,
      paymentBreakdown: {
        cash: paymentCash._sum.totalAmount ?? 0,
        click: paymentClick._sum.totalAmount ?? 0,
        credit: paymentCredit._sum.totalAmount ?? 0,
      },
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return serverError();
  }
}

async function getMonthlyData(months: number) {
  const now = new Date();
  const result: Array<{ month: string; orders: number; revenue: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const [orders, revenueAgg] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.order.aggregate({
        where: { status: "DELIVERED", deliveredAt: { gte: start, lt: end } },
        _sum: { totalAmount: true },
      }),
    ]);

    const monthLabel = start.toLocaleDateString("uz-UZ", { month: "short" });
    result.push({
      month: monthLabel,
      orders,
      revenue: revenueAgg._sum.totalAmount ?? 0,
    });
  }

  return result;
}
