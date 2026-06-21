/**
 * POST /api/v1/orders/assign
 * 
 * Buyurtmaga haydovchi biriktirish
 * Body: { orderId: string, driverId: string }
 * 
 * Roles: DIRECTOR, OPERATOR
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  badRequest,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const body = await request.json();
    const { orderId, driverId } = body;

    if (!orderId || !driverId) {
      return badRequest("orderId va driverId talab qilinadi");
    }

    // Buyurtmani tekshirish
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: auth.companyId },
    });
    if (!order) return badRequest("Buyurtma topilmadi");
    if (order.status !== "PENDING" && order.status !== "ASSIGNED") {
      return badRequest("Bu buyurtmaga haydovchi biriktirib bo'lmaydi");
    }

    // Haydovchini tekshirish
    const driver = await prisma.user.findFirst({
      where: { id: driverId, companyId: auth.companyId, role: "DRIVER", isActive: true },
    });
    if (!driver) return badRequest("Haydovchi topilmadi");

    // Biriktirish
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { driverId, status: "ASSIGNED" },
      include: {
        customer: { select: { id: true, name: true, phone1: true, address: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    });

    return success(updatedOrder, "Haydovchi biriktirildi");
  } catch (error) {
    console.error("Assign driver error:", error);
    return serverError("Biriktirish xatoligi");
  }
}
