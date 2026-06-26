/**
 * POST /api/v1/auth/select-company
 * 
 * Agar foydalanuvchi bir nechta kompaniyada bo'lsa,
 * login'dan keyin kompaniyani tanlab token oladi.
 * 
 * Body: { phone: string, password: string, companyId: string }
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken, badRequest, success, serverError } from "@/lib/api-auth";

function normalizePhone(rawPhone: string): string {
  let phone = rawPhone.replace(/\D/g, "");
  if (phone.startsWith("998") && phone.length === 12) {
    return `+${phone}`;
  } else if (phone.length === 9) {
    return `+998${phone}`;
  } else if (rawPhone.startsWith("+")) {
    return rawPhone;
  }
  return `+998${phone}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone: rawPhone, password, companyId } = body;

    if (!rawPhone || !password || !companyId) {
      return badRequest("Telefon, parol va kompaniya tanlanishi shart");
    }

    const phone = normalizePhone(rawPhone);

    // Foydalanuvchini tanlangan kompaniyada qidirish
    const user = await prisma.user.findFirst({
      where: {
        phone,
        companyId,
        isActive: true,
      },
      include: {
        company: {
          select: { id: true, name: true, subdomain: true, status: true, logoUrl: true },
        },
      },
    });

    if (!user) {
      return badRequest("Foydalanuvchi topilmadi");
    }

    if (user.company?.status === "SUSPENDED") {
      return badRequest("Kompaniya faoliyati to'xtatilgan");
    }

    // Parolni tekshirish
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return badRequest("Parol noto'g'ri");
    }

    // Token yaratish
    const token = await createToken({
      userId: user.id,
      id: user.id,
      role: user.role,
      companyId: user.companyId,
      phone: user.phone,
      subdomain: user.company!.subdomain,
    });

    return success({
      type: "authenticated",
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        company: {
          id: user.company!.id,
          name: user.company!.name,
          subdomain: user.company!.subdomain,
          logoUrl: user.company!.logoUrl,
        },
      },
    });
  } catch (error) {
    console.error("Select company error:", error);
    return serverError("Tizimda xatolik yuz berdi");
  }
}
