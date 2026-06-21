/**
 * POST /api/v1/orders/deliver
 * 
 * Buyurtmani yetkazildi deb belgilash
 * Body: { orderId: string, paymentType: "CASH"|"CLICK"|"CREDIT", bottlesReturned: number }
 * 
 * Roles: DRIVER, DIRECTOR
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
    if (!requireRoles(auth.role, ["DRIVER", "DIRECTOR"])) return forbidden();

    const body = await request.json();
    const { orderId, paymentType, bottlesReturned = 0 } = body;

    if (!orderId || !paymentType) {
      return badRequest("orderId va paymentType talab qilinadi");
    }

    if (!["CASH", "CLICK", "CREDIT"].includes(paymentType)) {
      return badRequest("paymentType: CASH, CLICK yoki CREDIT bo'lishi kerak");
    }

    // Buyurtmani tekshirish
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: auth.companyId },
      include: { customer: true },
    });

    if (!order) return badRequest("Buyurtma topilmadi");
    if (order.status === "DELIVERED") return badRequest("Buyurtma allaqachon yetkazilgan");
    if (order.status === "CANCELLED") return badRequest("Buyurtma bekor qilingan");

    // Transaction: buyurtma + mijoz balansi yangilash
    await prisma.$transaction(async (tx) => {
      // Buyurtmani yangilash
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          paymentType,
          bottlesReturned,
          paidAmount: paymentType === "CREDIT" ? 0 : order.totalAmount,
          deliveredAt: new Date(),
        },
      });

      // Mijoz balansi: idish va qarz
      const bottleChange = order.bottlesDelivered - bottlesReturned;
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          bottleBalance: { increment: bottleChange },
          ...(paymentType === "CREDIT"
            ? { debtBalance: { increment: order.totalAmount } }
            : {}),
        },
      });
    });

    return success(null, "Buyurtma yetkazildi");
  } catch (error) {
    console.error("Deliver order error:", error);
    return serverError("Yetkazishda xatolik");
  }
}
