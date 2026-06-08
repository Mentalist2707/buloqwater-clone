"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { ActionResult } from "@/types";

interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  address?: string;
  landmark?: string;
}

export async function registerCustomer(input: RegisterInput): Promise<ActionResult> {
  try {
    // Telefon tekshirish — companyId NULL (oddiy user, hech qaysi firmaga bog'lanmagan)
    const existingUser = await prisma.user.findFirst({
      where: { phone: input.phone, companyId: null, role: "CUSTOMER" },
    });
    if (existingUser) {
      return { success: false, error: "Bu telefon raqami allaqachon ro'yxatda" };
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Oddiy CUSTOMER yaratish — hech qaysi kompaniyaga bog'lanmagan
    await prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        password: hashedPassword,
        role: "CUSTOMER",
        companyId: null, // Firmaga bog'lanmagan
      },
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
