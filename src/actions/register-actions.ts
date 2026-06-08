"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { ActionResult } from "@/types";
import { headers } from "next/headers";

interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  address: string;
  landmark?: string;
  subdomain?: string; // Client-dan keladi (dev mode uchun)
}

export async function registerCustomer(input: RegisterInput): Promise<ActionResult> {
  try {
    // Subdomenni aniqlash
    const headersList = headers();
    const hostname = headersList.get("host") || "";
    let subdomain = getSubdomainFromHost(hostname);

    // Agar header-dan topilmasa, client yuborgan subdomenni ishlatamiz
    if (!subdomain && input.subdomain) {
      subdomain = input.subdomain;
    }

    if (!subdomain) {
      return { success: false, error: "Kompaniya aniqlanmadi. Subdomen orqali kiring." };
    }

    // Kompaniyani topish
    const company = await prisma.company.findUnique({
      where: { subdomain },
    });

    if (!company) {
      return { success: false, error: `"${subdomain}" kompaniyasi topilmadi` };
    }

    if (company.status === "SUSPENDED") {
      return { success: false, error: "Bu kompaniya faoliyati to'xtatilgan" };
    }

    // Telefon raqam tekshirish
    const existingUser = await prisma.user.findFirst({
      where: { phone: input.phone, companyId: company.id },
    });
    if (existingUser) {
      return { success: false, error: "Bu telefon raqami allaqachon ro'yxatda" };
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: { phone1: input.phone, companyId: company.id },
    });
    if (existingCustomer) {
      return { success: false, error: "Bu telefon raqami allaqachon ro'yxatda" };
    }

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Transaction: User + Customer bir vaqtda yaratiladi
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name: input.name,
          phone: input.phone,
          password: hashedPassword,
          role: "CUSTOMER",
          companyId: company.id,
        },
      });

      await tx.customer.create({
        data: {
          name: input.name,
          phone1: input.phone,
          address: input.address,
          landmark: input.landmark || null,
          companyId: company.id,
        },
      });
    });

    return { success: true, message: "Ro'yxatdan muvaffaqiyatli o'tdingiz!" };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "Bu telefon raqami band" };
    }
    console.error("Register error:", error);
    return { success: false, error: "Ro'yxatdan o'tishda xatolik yuz berdi" };
  }
}

function getSubdomainFromHost(hostname: string): string | null {
  const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "buloqwater.uz";

  if (hostname.includes(".vercel.app")) return null;

  if (hostname.includes(baseDomain)) {
    const clean = hostname.replace(`:${process.env.PORT || "3000"}`, "");
    if (clean === baseDomain || clean === `www.${baseDomain}`) return null;
    const sub = clean.replace(`.${baseDomain}`, "");
    if (sub && sub !== clean) return sub;
  }

  if (hostname.includes(".localhost")) {
    return hostname.split(".")[0];
  }

  return null;
}
