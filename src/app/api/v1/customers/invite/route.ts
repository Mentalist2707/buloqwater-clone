/**
 * POST /api/v1/customers/invite
 * ────────────────────────────────────────────────────────────
 * Operator/Director boshqa kompaniyadagi yoki bo'sh foydalanuvchini
 * o'z kompaniyasiga mijozlikka taklif qiladi.
 *
 * Body: { phone: string, userId: string }
 *
 * Natija: taklif (CustomerInvitation) yaratiladi va foydalanuvchiga
 * INVITATION turidagi bildirishnoma yuboriladi. Foydalanuvchi qabul
 * qilsa, kompaniya egasi (DIRECTOR) va operatorga xabar boradi.
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
import { createNotification } from "@/lib/notifications";

const INVITE_TTL_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const body = await request.json();
    const { phone, userId } = body;
    if (!userId || !phone) return badRequest("phone va userId talab qilinadi");

    // Foydalanuvchini tekshirish
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true, role: true },
    });
    if (!targetUser) return badRequest("Foydalanuvchi topilmadi");

    // Allaqachon mijoz bo'lsa
    const alreadyCustomer = await prisma.customer.findFirst({
      where: { companyId: auth.companyId, OR: [{ userId }, { phone1: phone }] },
      select: { id: true },
    });
    if (alreadyCustomer) return badRequest("Bu foydalanuvchi allaqachon mijozingiz");

    // Faol taklif bormi?
    const existing = await prisma.customerInvitation.findFirst({
      where: { fromCompanyId: auth.companyId, toUserId: userId, status: "PENDING" },
      select: { id: true },
    });
    if (existing) return badRequest("Bu foydalanuvchiga allaqachon taklif yuborilgan");

    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { name: true },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const invitation = await prisma.customerInvitation.create({
      data: {
        phone,
        status: "PENDING",
        expiresAt,
        fromCompanyId: auth.companyId,
        toUserId: userId,
        invitedById: auth.userId,
      },
    });

    // Foydalanuvchiga bildirishnoma
    await createNotification({
      userId,
      type: "INVITATION",
      title: "Yangi taklif",
      body: `${company?.name || "Kompaniya"} sizni mijozlikka taklif qilyapti`,
      data: {
        invitationId: invitation.id,
        companyName: company?.name || null,
        companyId: auth.companyId,
      },
    });

    return success(
      {
        invitationId: invitation.id,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      "Taklif yuborildi",
    );
  } catch (error) {
    console.error("Invite error:", error);
    return serverError("Taklif yuborishda xatolik");
  }
}
