/**
 * GET /api/v1/driver/tasks — Haydovchiga tayinlangan buyurtmalar
 * 
 * Roles: DRIVER
 * Faqat ASSIGNED va IN_TRANSIT statusdagi buyurtmalarni qaytaradi
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DRIVER"])) return forbidden();

    const { searchParams } = new URL(request.url);
    const includeDelivered = searchParams.get("delivered") === "true";

    // Asosiy filter
    const where: any = {
      companyId: auth.companyId,
      driverId: auth.userId,
    };

    if (includeDelivered) {
      // Bugun yetkazilganlarni ham ko'rsatish
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.OR = [
        { status: { in: ["ASSIGNED", "IN_TRANSIT"] } },
        { status: "DELIVERED", deliveredAt: { gte: today } },
      ];
    } else {
      where.status = { in: ["ASSIGNED", "IN_TRANSIT"] };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone1: true,
            phone2: true,
            address: true,
            landmark: true,
            locationLink: true,
            bottleBalance: true,
          },
        },
        items: {
          include: { product: { select: { id: true, name: true, unit: true } } },
        },
      },
    });

    // Statistika
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStats = await prisma.order.aggregate({
      where: {
        companyId: auth.companyId,
        driverId: auth.userId,
        status: "DELIVERED",
        deliveredAt: { gte: today },
      },
      _count: { id: true },
      _sum: { totalAmount: true, bottlesDelivered: true, bottlesReturned: true },
    });

    return success({
      tasks: orders,
      stats: {
        pendingCount: orders.filter((o) => o.status === "ASSIGNED" || o.status === "IN_TRANSIT").length,
        deliveredToday: todayStats._count.id || 0,
        totalAmountToday: todayStats._sum.totalAmount || 0,
        bottlesDeliveredToday: todayStats._sum.bottlesDelivered || 0,
        bottlesReturnedToday: todayStats._sum.bottlesReturned || 0,
      },
    });
  } catch (error) {
    console.error("Get driver tasks error:", error);
    return serverError();
  }
}
