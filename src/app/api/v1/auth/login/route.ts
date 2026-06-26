/**
 * POST /api/v1/auth/login
 * 
 * Mobile login — Variant 4: Telefon raqam bo'yicha avtomatik kompaniya aniqlash
 * 
 * Body: { phone: string, password: string }
 * 
 * Javoblar:
 * 1. Faqat 1 ta kompaniyada → token qaytaradi
 * 2. Bir nechta kompaniyada → kompaniyalar ro'yxati qaytaradi (token yo'q)
 * 3. SUPER_ADMIN/CUSTOMER → to'g'ridan-to'g'ri token
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken, badRequest, success, serverError } from "@/lib/api-auth";

// Telefon normalizatsiya
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
    const { phone: rawPhone, password } = body;

    if (!rawPhone || !password) {
      return badRequest("Telefon va parol kiritilishi shart");
    }

    const phone = normalizePhone(rawPhone);

    // 1. Barcha aktiv foydalanuvchilarni shu telefon bilan qidirish
    const users = await prisma.user.findMany({
      where: { phone, isActive: true },
      include: {
        company: {
          select: { id: true, name: true, subdomain: true, status: true, logoUrl: true },
        },
      },
    });

    if (users.length === 0) {
      return badRequest("Foydalanuvchi topilmadi");
    }

    // 2. Parolni tekshirish (birinchi topilgan user bilan — parol bir xil bo'lishi kerak)
    //    Aslida har bir user uchun alohida tekshirish kerak
    const validUsers = [];
    for (const user of users) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        validUsers.push(user);
      }
    }

    if (validUsers.length === 0) {
      return badRequest("Parol noto'g'ri");
    }

    // 3. SUPER_ADMIN — to'g'ridan-to'g'ri kirish
    const superAdmin = validUsers.find((u) => u.role === "SUPER_ADMIN");
    if (superAdmin) {
      const token = await createToken({
        userId: superAdmin.id,
        id: superAdmin.id,
        role: superAdmin.role,
        companyId: null,
        phone: superAdmin.phone,
        subdomain: null,
      });

      return success({
        type: "authenticated",
        token,
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          phone: superAdmin.phone,
          role: superAdmin.role,
          company: null,
        },
      });
    }

    // 4. CUSTOMER (companyId null) — to'g'ridan-to'g'ri kirish
    const customer = validUsers.find((u) => u.role === "CUSTOMER" && !u.companyId);
    if (customer) {
      const token = await createToken({
        userId: customer.id,
        id: customer.id,
        role: customer.role,
        companyId: null,
        phone: customer.phone,
        subdomain: null,
      });

      return success({
        type: "authenticated",
        token,
        user: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          role: customer.role,
          company: null,
        },
      });
    }

    // 5. Kompaniya foydalanuvchilari — suspended kompaniyalarni chiqarib tashlash
    const activeCompanyUsers = validUsers.filter(
      (u) => u.company && u.company.status === "ACTIVE"
    );

    if (activeCompanyUsers.length === 0) {
      return badRequest("Kompaniya faoliyati to'xtatilgan");
    }

    // 6. Faqat 1 ta kompaniya — to'g'ridan-to'g'ri token berish
    if (activeCompanyUsers.length === 1) {
      const user = activeCompanyUsers[0];
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
    }

    // 7. Bir nechta kompaniya — ro'yxat qaytarish (token bermaydi)
    const companies = activeCompanyUsers.map((u) => ({
      userId: u.id,
      role: u.role,
      company: {
        id: u.company!.id,
        name: u.company!.name,
        subdomain: u.company!.subdomain,
        logoUrl: u.company!.logoUrl,
      },
    }));

    return success({
      type: "select_company",
      message: "Kompaniyani tanlang",
      companies,
    });
  } catch (error) {
    console.error("Login error:", error);
    return serverError("Tizimda xatolik yuz berdi");
  }
}
