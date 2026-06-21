/**
 * GET /api/v1/auth/me
 * 
 * Joriy foydalanuvchi ma'lumotlarini qaytaradi
 * Header: Authorization: Bearer <token>
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError, notFound } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            status: true,
            logoUrl: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return notFound("Foydalanuvchi topilmadi yoki o'chirilgan");
    }

    return success({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      company: user.company,
    });
  } catch (error) {
    console.error("Get me error:", error);
    return serverError();
  }
}
