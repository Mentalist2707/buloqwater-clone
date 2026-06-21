/**
 * POST /api/v1/driver/start-delivery
 * 
 * Haydovchi buyurtmani "yo'lda" deb belgilaydi
 * Body: { orderId: string }
 * 
 * Roles: DRIVER
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
    if (!requireRoles(auth.role, ["DRIVER"])) return forbidden();

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) return badRequest("orderId talab qilinadi");

    // Buyurtmani tekshirish — faqat o'ziga tayinlangan
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        companyId: auth.companyId,
        driverId: auth.userId,
        status: "ASSIGNED",
      },
    });

    if (!order) return badRequest("Buyurtma topilmadi yoki sizga tayinlanmagan");

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "IN_TRANSIT" },
    });

    return success(null, "Yetkazish boshlandi");
  } catch (error) {
    console.error("Start delivery error:", error);
    return serverError();
  }
}
