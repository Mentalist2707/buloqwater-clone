/**
 * GET /api/v1/drivers — Haydovchilar ro'yxati (tayinlash uchun)
 * 
 * Har bir haydovchining bugungi faol buyurtmalari soni bilan
 * Roles: DIRECTOR, OPERATOR
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
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const drivers = await prisma.user.findMany({
      where: {
        companyId: auth.companyId,
        role: "DRIVER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        _count: {
          select: {
            assignedOrders: {
              where: {
                status: { in: ["ASSIGNED", "IN_TRANSIT"] },
                createdAt: { gte: today },
              },
            },
          },
        },
      },
    });

    const formatted = drivers.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      activeOrdersCount: d._count.assignedOrders,
    }));

    return success(formatted);
  } catch (error) {
    console.error("Get drivers error:", error);
    return serverError();
  }
}
