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
            addresses: {
              where: { isDefault: true },
              take: 1,
              select: { address: true, landmark: true, locationLink: true, latitude: true, longitude: true },
            },
            user: {
              select: {
                userAddresses: {
                  where: { isDefault: true },
                  take: 1,
                  select: { address: true, landmark: true, locationLink: true, latitude: true, longitude: true },
                },
              },
            },
          },
        },
        items: {
          include: { product: { select: { id: true, name: true, unit: true } } },
        },
      },
    });

    // Har bir buyurtma uchun manzil/koordinatani aniqlash — avval buyurtmaning
    // o'z yetkazish manzili (mijoz tanlagan), keyin mijoz standart manzili
    const tasks = orders.map((o) => {
      const c: any = o.customer;
      const alt = c.addresses?.[0] || c.user?.userAddresses?.[0] || null;
      let address = c.address;
      let landmark = c.landmark;
      let locationLink = c.locationLink;
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (o.deliveryAddress) {
        address = o.deliveryAddress;
        landmark = o.deliveryLandmark ?? landmark;
        locationLink = o.deliveryLocationLink ?? null;
        latitude = o.deliveryLatitude ?? null;
        longitude = o.deliveryLongitude ?? null;
      } else if (alt) {
        latitude = alt.latitude ?? null;
        longitude = alt.longitude ?? null;
        if (!address || address === "Manzil kiritilmagan") {
          address = alt.address;
          landmark = alt.landmark ?? landmark;
        }
        if (!locationLink) locationLink = alt.locationLink ?? null;
      }
      const { addresses, user, ...restCustomer } = c;
      return {
        ...o,
        customer: { ...restCustomer, address, landmark, locationLink, latitude, longitude },
      };
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
      tasks: tasks,
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
