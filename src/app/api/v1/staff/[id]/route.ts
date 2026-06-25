/**
 * PUT  /api/v1/staff/[id]  — xodim ma'lumotlarini yangilash
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  getAuthUser,
  requireRoles,
  unauthorized,
  forbidden,
  success,
  serverError,
  badRequest,
} from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["DIRECTOR", "SUPER_ADMIN"])) return forbidden();
    if (!user.companyId) return forbidden();

    const { id } = params;
    const body = await request.json();
    const { name, phone, password } = body;

    if (!name || !phone) return badRequest("Ism va telefon kerak");

    // Faqat o'z kompaniyasidagi xodimni tahrirlash
    const target = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!target) return badRequest("Xodim topilmadi");

    // Telefon band emasligini tekshirish
    if (phone !== target.phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, companyId: user.companyId, id: { not: id } },
      });
      if (existing) return badRequest("Bu telefon raqami allaqachon ishlatilmoqda");
    }

    const updateData: any = { name, phone };

    if (password) {
      if (password.length < 6) return badRequest("Parol kamida 6 ta belgi bo'lishi kerak");
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({ where: { id }, data: updateData });

    return success({ message: "Xodim yangilandi" });
  } catch {
    return serverError();
  }
}
