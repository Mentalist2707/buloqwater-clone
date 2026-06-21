/**
 * GET /api/v1/customers — Mijozlar ro'yxati (qidiruv bilan)
 * POST /api/v1/customers — Yangi mijoz yaratish
 * 
 * Roles: DIRECTOR, OPERATOR
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  badRequest,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";

// ── GET: Mijozlar ro'yxati ──────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: auth.companyId,
      isActive: true,
    };

    // Qidiruv: ism, telefon, manzil bo'yicha
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone1: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          phone1: true,
          phone2: true,
          address: true,
          landmark: true,
          locationLink: true,
          notes: true,
          bottleBalance: true,
          debtBalance: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return success({
      items: customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return serverError();
  }
}

// ── POST: Yangi mijoz yaratish ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const body = await request.json();
    const { name, phone1, phone2, address, landmark, locationLink, notes } = body;

    if (!name || !phone1 || !address) {
      return badRequest("name, phone1, va address talab qilinadi");
    }

    // Telefon raqam mavjudligini tekshirish
    const existing = await prisma.customer.findFirst({
      where: { phone1, companyId: auth.companyId },
    });
    if (existing) {
      return badRequest("Bu telefon raqami allaqachon ro'yxatda");
    }

    // Kompaniya limitini tekshirish
    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { maxCustomers: true },
    });
    const currentCount = await prisma.customer.count({
      where: { companyId: auth.companyId },
    });
    if (company && currentCount >= company.maxCustomers) {
      return badRequest(`Mijozlar limiti (${company.maxCustomers}) to'lgan`);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone1,
        phone2: phone2 || null,
        address,
        landmark: landmark || null,
        locationLink: locationLink || null,
        notes: notes || null,
        companyId: auth.companyId,
      },
    });

    return success(customer, "Mijoz qo'shildi");
  } catch (error: any) {
    if (error?.code === "P2002") {
      return badRequest("Bu telefon raqami allaqachon mavjud");
    }
    console.error("Create customer error:", error);
    return serverError("Mijoz yaratishda xatolik");
  }
}
