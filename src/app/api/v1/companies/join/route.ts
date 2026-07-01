/**
 * POST /api/v1/companies/join
 * ────────────────────────────────────────────────────────────
 * Mijoz o'zi tanlagan kompaniyaga a'zo bo'ladi (mijoz sifatida qo'shiladi).
 * Body: { companyId: string, address?: string }
 *
 * A'zo bo'lgach — kompaniya egasi (DIRECTOR) va operatorlarga yangi mijoz
 * haqida bildirishnoma boradi.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  badRequest,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";
import { createNotifications } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { companyId, address } = body;
    if (!companyId) return badRequest("companyId talab qilinadi");

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, status: true, maxCustomers: true },
    });
    if (!company) return notFound("Kompaniya topilmadi");
    if (company.status !== "ACTIVE") return badRequest("Kompaniya faol emas");

    // Allaqachon a'zomi?
    const existing = await prisma.customer.findFirst({
      where: { companyId, OR: [{ userId: user.userId }, { phone1: user.phone }] },
    });
    if (existing) {
      if (!existing.userId) {
        await prisma.customer.update({ where: { id: existing.id }, data: { userId: user.userId } });
      }
      return badRequest("Siz allaqachon bu kompaniya mijozisiz");
    }

    // Limit
    const currentCount = await prisma.customer.count({ where: { companyId } });
    if (currentCount >= company.maxCustomers) {
      return badRequest("Kompaniya mijozlar limiti to'lgan");
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true, phone: true, address: true },
    });

    const customer = await prisma.customer.create({
      data: {
        name: dbUser?.name || user.phone,
        phone1: user.phone,
        address: address || dbUser?.address || "Manzil kiritilmagan",
        companyId,
        userId: user.userId,
      },
    });

    // Kompaniya xodimlariga (DIRECTOR + OPERATOR) bildirishnoma
    const staff = await prisma.user.findMany({
      where: { companyId, role: { in: ["DIRECTOR", "OPERATOR"] }, isActive: true },
      select: { id: true },
    });
    await createNotifications(
      staff.map((s) => s.id),
      {
        type: "SYSTEM",
        title: "Yangi mijoz",
        body: `${customer.name} kompaniyangizga mijoz sifatida qo'shildi`,
        data: { customerId: customer.id, phone: customer.phone1 },
      },
    );

    return success(
      { customerId: customer.id, companyId, companyName: company.name },
      `Siz "${company.name}" mijozi bo'ldingiz`,
    );
  } catch (error) {
    console.error("Company join error:", error);
    return serverError("A'zo bo'lishda xatolik");
  }
}
