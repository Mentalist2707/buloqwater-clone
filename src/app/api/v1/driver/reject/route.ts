/**
 * POST /api/v1/driver/reject — haydovchi buyurtmani rad etadi (sabab bilan)
 * ────────────────────────────────────────────────────────────
 * Buyurtma qayta PENDING holatiga qaytadi (driverId bo'shatiladi), sabab
 * saqlanadi va kompaniya direktori hamda buyurtmani yaratgan operatorga
 * bildirishnoma boradi.
 *
 * Body: { orderId: string, reason: string }
 * Roles: DRIVER
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";
import { notifyCompanyDirectors } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DRIVER"])) return forbidden();

    const body = await request.json();
    const { orderId, reason } = body;
    if (!orderId) return badRequest("orderId talab qilinadi");
    if (!reason || !reason.trim()) return badRequest("Rad etish sababini yozing");

    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: auth.companyId, driverId: auth.userId },
      include: { customer: { select: { name: true } } },
    });
    if (!order) return notFound("Buyurtma topilmadi");
    if (!["ASSIGNED", "IN_TRANSIT"].includes(order.status)) {
      return badRequest("Bu buyurtmani rad etib bo'lmaydi");
    }

    // Buyurtma qayta taqsimlash uchun PENDING'ga qaytadi
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PENDING",
        driverId: null,
        rejectReason: reason.trim(),
      },
    });

    const driver = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });

    // Direktor + buyurtmani yaratgan operatorga bildirishnoma
    await notifyCompanyDirectors(
      auth.companyId,
      {
        type: "ORDER",
        title: "Buyurtma rad etildi",
        body: `Haydovchi ${driver?.name || ""} #${order.orderNumber} buyurtmani rad etdi: ${reason.trim()}`,
        data: { orderId: order.id, orderNumber: order.orderNumber, reason: reason.trim() },
      },
      order.operatorId ? [order.operatorId] : [],
    );

    return success({ message: "Buyurtma rad etildi" }, "Buyurtma rad etildi");
  } catch (error) {
    console.error("Driver reject error:", error);
    return serverError("Rad etishda xatolik");
  }
}
