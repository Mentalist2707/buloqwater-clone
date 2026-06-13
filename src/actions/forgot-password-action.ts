"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { ActionResult } from "@/types";

/**
 * Foydalanuvchi mavjudligini tekshiradi va parolni tiklash so'rovini
 * SupportTicket sifatida saqlaydi. Session talab qilinmaydi.
 */
export async function requestPasswordReset(
  phone: string
): Promise<ActionResult<{ name: string; companyName: string | null }>> {
  try {
    // Telefon raqamni normalizatsiya qilish
    let formatted = phone.replace(/\D/g, "");
    if (formatted.startsWith("998") && formatted.length === 12) {
      formatted = `+${formatted}`;
    } else if (formatted.length === 9) {
      formatted = `+998${formatted}`;
    } else if (phone.startsWith("+")) {
      formatted = phone;
    } else {
      formatted = `+998${formatted}`;
    }

    // Foydalanuvchini qidirish
    const user = await prisma.user.findFirst({
      where: { phone: formatted, isActive: true },
      include: { company: { select: { name: true, subdomain: true } } },
    });

    if (!user) {
      // Xavfsizlik uchun: hatto topilmasa ham shu xabarni qaytarmaymiz
      return {
        success: false,
        error: "Bu telefon raqam tizimda ro'yxatdan o'tmagan",
      };
    }

    // Avvalgi hal qilinmagan so'rovlarni tekshirish (spam himoya)
    const existingTicket = await prisma.supportTicket.findFirst({
      where: {
        userPhone: formatted,
        subject: "Parolni tiklash so'rovi",
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    });

    if (existingTicket) {
      return {
        success: false,
        error: "Sizning oldingi so'rovingiz hali ko'rib chiqilmoqda. Adminizga murojaat qiling.",
      };
    }

    // SupportTicket yaratish
    await prisma.supportTicket.create({
      data: {
        subject: "Parolni tiklash so'rovi",
        description: `Foydalanuvchi ${user.name} (${formatted}) parolini unutib, tiklash so'radi.\n\nKompaniya: ${user.company?.name ?? "Yo'q"}\nRol: ${user.role}`,
        priority: "HIGH",
        status: "OPEN",
        companyId: user.companyId ?? null,
        companyName: user.company?.name ?? null,
        userName: user.name,
        userPhone: formatted,
      },
    });

    return {
      success: true,
      data: {
        name: user.name,
        companyName: user.company?.name ?? null,
      },
    };
  } catch (error) {
    return { success: false, error: "So'rov yuborishda xatolik yuz berdi" };
  }
}
