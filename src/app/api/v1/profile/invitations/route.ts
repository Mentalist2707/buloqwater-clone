/**
 * GET /api/v1/profile/invitations — foydalanuvchining kutilayotgan takliflari
 *
 * CUSTOMER o'ziga kelgan mijozlik takliflarini ko'radi.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();

    const invitations = await prisma.customerInvitation.findMany({
      where: { toUserId: auth.userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        fromCompany: { select: { id: true, name: true, subdomain: true } },
        invitedBy: { select: { name: true, role: true } },
      },
    });

    return success(
      invitations.map((inv) => ({
        id: inv.id,
        status: inv.status,
        company: inv.fromCompany,
        invitedBy: inv.invitedBy,
        invitedAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("Get invitations error:", error);
    return serverError();
  }
}
