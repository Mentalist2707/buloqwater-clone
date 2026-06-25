/**
 * GET /api/v1/profile  — joriy foydalanuvchi profili
 * PUT /api/v1/profile  — profilni yangilash (ism, telefon, parol)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  getAuthUser,
  unauthorized,
  success,
  serverError,
  badRequest,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, phone: true, role: true, createdAt: true },
    });

    if (!profile) return badRequest("Foydalanuvchi topilmadi");

    return success({
      ...profile,
      createdAt: profile.createdAt.toISOString(),
    });
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { name, phone, currentPassword, newPassword } = body;

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return badRequest("Foydalanuvchi topilmadi");

    const updateData: any = {};

    if (name && name !== dbUser.name) {
      if (name.trim().length < 2) return badRequest("Ism kamida 2 ta belgi bo'lishi kerak");
      updateData.name = name.trim();
    }

    if (phone && phone !== dbUser.phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, companyId: dbUser.companyId, id: { not: user.userId } },
      });
      if (existing) return badRequest("Bu telefon raqami band");
      updateData.phone = phone;
    }

    if (currentPassword && newPassword) {
      const isValid = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isValid) return badRequest("Joriy parol noto'g'ri");
      if (newPassword.length < 6) return badRequest("Yangi parol kamida 6 ta belgi bo'lishi kerak");
      if (currentPassword === newPassword) return badRequest("Yangi parol joriy paroldan farqli bo'lishi kerak");
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("O'zgartirish kiritilmadi");
    }

    await prisma.user.update({ where: { id: user.userId }, data: updateData });
    return success({ message: "Profil yangilandi" });
  } catch {
    return serverError();
  }
}
