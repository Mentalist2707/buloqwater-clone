/**
 * POST /api/v1/staff/[id]/toggle — xodimni bloklash/faollashtirish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  requireRoles,
  unauthorized,
  forbidden,
  success,
  serverError,
  badRequest,
} from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["DIRECTOR", "SUPER_ADMIN"])) return forbidden();
    if (!user.companyId) return forbidden();

    const { id } = params;

    const target = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!target) return badRequest("Xodim topilmadi");

    await prisma.user.update({
      where: { id },
      data: { isActive: !target.isActive },
    });

    return success({
      message: target.isActive ? "Xodim bloklandi" : "Xodim faollashtirildi",
      isActive: !target.isActive,
    });
  } catch {
    return serverError();
  }
}
