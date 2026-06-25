/**
 * PUT /api/v1/superadmin/companies/[id] — kompaniya nomini va telefonini yangilash
 * Requires: SUPER_ADMIN
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser, requireRoles, unauthorized, forbidden,
  success, serverError, badRequest, notFound,
} from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!requireRoles(auth.role, ["SUPER_ADMIN"])) return forbidden();

    const { id } = params;
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !name.trim()) {
      return badRequest("Kompaniya nomi bo'sh bo'lmasin");
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return notFound("Kompaniya topilmadi");

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        phone: true,
        status: true,
        updatedAt: true,
      },
    });

    return success(updated, "Kompaniya yangilandi");
  } catch (error) {
    console.error("PUT company error:", error);
    return serverError();
  }
}
