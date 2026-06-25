/**
 * POST /api/v1/applications  — yangi firma zayavkasi (public, token shart emas)
 * GET  /api/v1/applications  — zayavka holati tekshirish (telefon bo'yicha)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, badRequest, serverError } from "@/lib/api-auth";

// ── POST — zayavka yuborish ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, ownerName, phone, address, description } = body;

    if (!companyName?.trim()) return badRequest("Kompaniya nomi kiritilmadi");
    if (!ownerName?.trim())   return badRequest("Ism familiya kiritilmadi");
    if (!phone?.trim())       return badRequest("Telefon raqam kiritilmadi");

    // Avvalgi pending zayavka bormi?
    const existing = await prisma.application.findFirst({
      where: { phone: phone.trim(), status: "PENDING" },
    });
    if (existing) {
      return badRequest("Bu telefon raqamidan zayavka allaqachon yuborilgan va ko'rib chiqilmoqda");
    }

    const app = await prisma.application.create({
      data: {
        companyName: companyName.trim(),
        ownerName:   ownerName.trim(),
        phone:       phone.trim(),
        address:     address?.trim() || null,
        description: description?.trim() || null,
      },
    });

    return success({
      id:     app.id,
      status: app.status,
      message: "Zayavkangiz qabul qilindi! Tez orada siz bilan bog'lanamiz.",
    });
  } catch {
    return serverError();
  }
}

// ── GET — zayavka holati tekshirish (telefon orqali) ─────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) return badRequest("Telefon raqam kiritilmadi");

    const app = await prisma.application.findFirst({
      where: { phone: phone.trim() },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, companyName: true, ownerName: true,
        phone: true, status: true, adminNote: true,
        createdAt: true,
      },
    });

    if (!app) return badRequest("Bu telefon raqamidan zayavka topilmadi");

    return success({
      ...app,
      createdAt: app.createdAt.toISOString(),
    });
  } catch {
    return serverError();
  }
}
