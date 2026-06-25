/**
 * GET /api/v1/admin/stats
 * Admin dashboard statistikasi — web bilan bir xil
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRoles, unauthorized, forbidden, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["DIRECTOR", "SUPER_ADMIN"])) return forbidden();
    if (!user.companyId) return forbidden("Kompaniya topilmadi");

    const companyId = user.companyId;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      dailySales, yesterdaySales, dailyDeliveries, yesterdayDeliveries,
      newCustomersMonth, pendingOrders, inTransitOrders, cancelledToday,
      totalDebtAgg, unreturnedBottlesAgg,
      activeDrivers, totalCustomers, totalOrders,
      customersWithDebt, customersWithBottles,
      cashAgg, clickAgg, creditAgg,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { companyId, status: "DELIVERED", deliveredAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { companyId, status: "DELIVERED", deliveredAt: { gte: yesterday, lt: today } }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { companyId, status: "DELIVERED", deliveredAt: { gte: today } } }),
      prisma.order.count({ where: { companyId, status: "DELIVERED", deliveredAt: { gte: yesterday, lt: today } } }),
      prisma.customer.count({ where: { companyId, createdAt: { gte: monthStart } } }),
      prisma.order.count({ where: { companyId, status: "PENDING" } }),
      prisma.order.count({ where: { companyId, status: "IN_TRANSIT" } }),
      prisma.order.count({ where: { companyId, status: "CANCELLED", updatedAt: { gte: today } } }),
      prisma.customer.aggregate({ where: { companyId, debtBalance: { gt: 0 } }, _sum: { debtBalance: true } }),
      prisma.customer.aggregate({ where: { companyId, bottleBalance: { gt: 0 } }, _sum: { bottleBalance: true } }),
      prisma.user.count({ where: { companyId, role: "DRIVER", isActive: true } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.order.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId, debtBalance: { gt: 0 } } }),
      prisma.customer.count({ where: { companyId, bottleBalance: { gt: 0 } } }),
      prisma.order.aggregate({ where: { companyId, status: "DELIVERED", paymentType: "CASH", deliveredAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { companyId, status: "DELIVERED", paymentType: "CLICK", deliveredAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { companyId, status: "DELIVERED", paymentType: "CREDIT", deliveredAt: { gte: today } }, _sum: { totalAmount: true } }),
    ]);

    // Haftalik grafik
    const weeklyData = [];
    const dayNames = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today); dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const [orders, revenue] = await Promise.all([
        prisma.order.count({ where: { companyId, createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.order.aggregate({ where: { companyId, status: "DELIVERED", deliveredAt: { gte: dayStart, lt: dayEnd } }, _sum: { totalAmount: true } }),
      ]);
      weeklyData.push({ day: dayNames[dayStart.getDay()], orders, revenue: revenue._sum.totalAmount || 0 });
    }

    // Ogohlantirishlar (web AdminDashboard bilan bir xil)
    const alerts: { type: "warning" | "danger" | "info"; message: string }[] = [];
    const longBottles = await prisma.customer.count({ where: { companyId, bottleBalance: { gte: 5 } } });
    if (longBottles > 0) alerts.push({ type: "warning", message: `${longBottles} ta mijozda 5+ idish qaytarilmagan` });
    const bigDebt = await prisma.customer.count({ where: { companyId, debtBalance: { gte: 100000 } } });
    if (bigDebt > 0) alerts.push({ type: "danger", message: `${bigDebt} ta mijozning qarzi 100,000+ so'm` });
    const pending1h = await prisma.order.count({ where: { companyId, status: "PENDING", createdAt: { lt: new Date(Date.now() - 3600000) } } });
    if (pending1h > 0) alerts.push({ type: "danger", message: `${pending1h} ta buyurtma 1+ soatdan beri biriktirilmagan` });
    const inactiveDrivers = await prisma.user.count({ where: { companyId, role: "DRIVER", isActive: false } });
    if (inactiveDrivers > 0) alerts.push({ type: "info", message: `${inactiveDrivers} ta haydovchi nofaol holatda` });

    const todaySales = dailySales._sum.totalAmount || 0;
    const yestSales = yesterdaySales._sum.totalAmount || 0;
    const salesTrend = yestSales > 0 ? Math.round(((todaySales - yestSales) / yestSales) * 100) : todaySales > 0 ? 100 : 0;
    const deliveryTrend = yesterdayDeliveries > 0 ? Math.round(((dailyDeliveries - yesterdayDeliveries) / yesterdayDeliveries) * 100) : dailyDeliveries > 0 ? 100 : 0;

    return success({
      dailySales: todaySales,
      salesTrend,
      dailyDeliveries,
      deliveryTrend,
      newCustomersMonth,
      pendingOrders,
      inTransitOrders,
      cancelledToday,
      totalDebt: totalDebtAgg._sum.debtBalance || 0,
      unreturnedBottles: unreturnedBottlesAgg._sum.bottleBalance || 0,
      activeDrivers,
      totalCustomers,
      totalOrders,
      customersWithDebt,
      customersWithBottles,
      paymentBreakdown: {
        cash: cashAgg._sum.totalAmount || 0,
        click: clickAgg._sum.totalAmount || 0,
        credit: creditAgg._sum.totalAmount || 0,
      },
      alerts,
      weeklyData,
    });
  } catch (error) {
    return serverError();
  }
}
