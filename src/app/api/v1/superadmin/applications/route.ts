/**
 * GET /api/v1/superadmin/applications — zayavkalar ro'yxati
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRoles, unauthorized, forbidden, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["SUPER_ADMIN"])) return forbidden();

    const applications = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
    });

    return success(
      applications.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }))
    );
  } catch {
    return serverError();
  }
}
