/**
 * POST /api/v1/superadmin/applications/[id]/approve — zayavkani qabul qilish
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

    const app = await prisma.application.findUnique({ where: { id: params.id } });
    if (!app) return badRequest("Zayavka topilmadi");
    if (app.status !== "PENDING") return badRequest("Zayavka allaqachon ko'rib chiqilgan");

    await prisma.application.update({
      where: { id: params.id },
      data: { status: "APPROVED" },
    });

    await prisma.activityLog.create({
      data: {
        action: "application_approved",
        description: `${app.companyName} zayavkasi qabul qilindi`,
      },
    });

    return success({ message: "Zayavka qabul qilindi" });
  } catch {
    return serverError();
  }
}
