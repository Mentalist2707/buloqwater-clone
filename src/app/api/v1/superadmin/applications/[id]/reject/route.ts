/**
 * POST /api/v1/superadmin/applications/[id]/reject — zayavkani rad etish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRoles, unauthorized, forbidden, success, serverError, badRequest } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["SUPER_ADMIN"])) return forbidden();

    const body = await request.json().catch(() => ({}));
    const { note } = body;

    const app = await prisma.application.findUnique({ where: { id: params.id } });
    if (!app) return badRequest("Zayavka topilmadi");
    if (app.status !== "PENDING") return badRequest("Zayavka allaqachon ko'rib chiqilgan");

    await prisma.application.update({
      where: { id: params.id },
      data: { status: "REJECTED", adminNote: note || null },
    });

    return success({ message: "Zayavka rad etildi" });
  } catch {
    return serverError();
  }
}
