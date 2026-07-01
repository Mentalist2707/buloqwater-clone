/**
 * POST /api/v1/profile/invitations/:id/accept — taklifni qabul qilish
 * ────────────────────────────────────────────────────────────
 * Foydalanuvchi taklifni qabul qiladi:
 *  1. Taklif ACCEPTED holatiga o'tadi
 *  2. Taklif qilgan kompaniyada Customer record yaratiladi (userId bilan)
 *  3. Kompaniya egasi (DIRECTOR) va taklif yuborgan operatorga xabar boradi
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  badRequest,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";
import { notifyCompanyDirectors } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const invitation = await prisma.customerInvitation.findFirst({
      where: { id, toUserId: auth.userId },
      include: { fromCompany: { select: { id: true, name: true, maxCustomers: true } } },
    });
    if (!invitation) return notFound("Taklif topilmadi");
    if (invitation.status !== "PENDING") return badRequest("Taklif allaqachon ko'rib chiqilgan");
    if (invitation.expiresAt < new Date()) {
      await prisma.customerInvitation.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      return badRequest("Taklif muddati o'tgan");
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, phone: true, address: true },
    });
    if (!user) return badRequest("Foydalanuvchi topilmadi");

    // Kompaniya limitini tekshirish
    const currentCount = await prisma.customer.count({
      where: { companyId: invitation.fromCompanyId },
    });
    if (currentCount >= invitation.fromCompany.maxCustomers) {
      return badRequest("Kompaniya mijozlar limiti to'lgan");
    }

    // Mijoz allaqachon bo'lsa qayta yaratmaymiz
    let customer = await prisma.customer.findFirst({
      where: {
        companyId: invitation.fromCompanyId,
        OR: [{ userId: user.id }, { phone1: user.phone }],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: user.name,
          phone1: user.phone,
          address: user.address || "Manzil kiritilmagan",
          companyId: invitation.fromCompanyId,
          userId: user.id,
        },
      });
    } else if (!customer.userId) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { userId: user.id },
      });
    }

    await prisma.customerInvitation.update({
      where: { id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });

    // Kompaniya egasi + operatorga bildirishnoma
    await notifyCompanyDirectors(
      invitation.fromCompanyId,
      {
        type: "INVITATION_ACCEPTED",
        title: "Taklif qabul qilindi",
        body: `${user.name} sizning mijozlaringizga qo'shildi`,
        data: { customerId: customer.id, phone: user.phone },
      },
      [invitation.invitedById],
    );

    return success(
      {
        message: "Siz muvaffaqiyatli qo'shildingiz",
        customer: {
          id: customer.id,
          companyId: customer.companyId,
          name: customer.name,
          phone1: customer.phone1,
        },
      },
      "Taklif qabul qilindi",
    );
  } catch (error) {
    console.error("Accept invitation error:", error);
    return serverError("Taklifni qabul qilishda xatolik");
  }
}
