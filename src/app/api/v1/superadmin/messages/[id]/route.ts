/**
 * DELETE /api/v1/superadmin/messages/[id] — xabarni o'chirish
 * Requires: SUPER_ADMIN
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser, requireRoles, unauthorized, forbidden,
  success, serverError, notFound,
} from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!requireRoles(auth.role, ["SUPER_ADMIN"])) return forbidden();

    const { id } = params;

    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) return notFound("Xabar topilmadi");

    await prisma.message.delete({ where: { id } });

    return success(null, "Xabar o'chirildi");
  } catch (error) {
    console.error("DELETE message error:", error);
    return serverError();
  }
}
