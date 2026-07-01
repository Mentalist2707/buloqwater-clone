/**
 * POST /api/v1/profile/invitations/:id/reject — taklifni rad etish
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
    });
    if (!invitation) return notFound("Taklif topilmadi");
    if (invitation.status !== "PENDING") return badRequest("Taklif allaqachon ko'rib chiqilgan");

    await prisma.customerInvitation.update({
      where: { id },
      data: { status: "REJECTED", respondedAt: new Date() },
    });

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, phone: true },
    });

    await notifyCompanyDirectors(
      invitation.fromCompanyId,
      {
        type: "INVITATION_REJECTED",
        title: "Taklif rad etildi",
        body: `${user?.name || invitation.phone} taklifni rad etdi`,
        data: { phone: invitation.phone },
      },
      [invitation.invitedById],
    );

    return success({ message: "Taklif rad etildi" }, "Taklif rad etildi");
  } catch (error) {
    console.error("Reject invitation error:", error);
    return serverError();
  }
}
