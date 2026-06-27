/**
 * POST /api/v1/auth/register
 * 
 * Oddiy mijoz (CUSTOMER) ro'yxatdan o'tishi
 * 
 * Body: { 
 *   name: string, 
 *   phone: string, 
 *   password: string,
 *   address?: string 
 * }
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
    const { name, phone: rawPhone, password, address } = body;

    // Validatsiya
    if (!name || !rawPhone || !password) {
      return badRequest("Ism, telefon va parol kiritilishi shart");
    }

    if (password.length < 6) {
      return badRequest("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
    }

    const phone = normalizePhone(rawPhone);

    // Telefon mavjudligini tekshirish
    const existingUser = await prisma.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      return badRequest("Bu telefon raqam allaqachon ro'yxatdan o'tgan");
    }

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10);

    // Customer yaratish
    const customer = await prisma.user.create({
      data: {
        name: name.trim(),
        phone,
        password: hashedPassword,
        role: "CUSTOMER",
        address: address?.trim() || null,
        companyId: null, // Customerlar kompaniyaga tegishli emas
        isActive: true,
      },
    });

    // Token yaratish
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
        address: customer.address,
        company: null,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return serverError("Tizimda xatolik yuz berdi");
  }
}
