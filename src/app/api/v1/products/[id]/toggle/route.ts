/**
 * POST /api/v1/products/:id/toggle — mahsulotni faol/noaktiv qilish
 *
 * Roles: DIRECTOR
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  notFound,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR"])) return forbidden();

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, companyId: auth.companyId },
      select: { id: true, isActive: true },
    });
    if (!product) return notFound("Mahsulot topilmadi");

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      select: { id: true, isActive: true },
    });

    return success(updated, updated.isActive ? "Mahsulot faollashtirildi" : "Mahsulot noaktiv qilindi");
  } catch (error) {
    console.error("Toggle product error:", error);
    return serverError();
  }
}
