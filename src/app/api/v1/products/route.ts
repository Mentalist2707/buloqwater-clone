/**
 * GET  /api/v1/products — Mahsulotlar ro'yxati
 * POST /api/v1/products — Yangi mahsulot yaratish
 *
 * GET  roles: DIRECTOR, OPERATOR (DIRECTOR noaktivlarni ham ko'radi)
 * POST roles: DIRECTOR
 * Query params (GET): ?category=WATER|PROMO|ACCESSORIES
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

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = { companyId: auth.companyId };

    // DIRECTOR boshqaruv uchun noaktivlarni ham ko'radi; qolganlar faqat faol
    if (auth.role !== "DIRECTOR") {
      where.isActive = true;
    }

    if (category && ["WATER", "PROMO", "ACCESSORIES"].includes(category)) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        category: true,
        unit: true,
        isBottle: true,
        isActive: true,
      },
    });

    return success(products);
  } catch (error) {
    console.error("Get products error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR"])) return forbidden("Faqat direktor mahsulot qo'sha oladi");

    const body = await request.json();
    const { name, description, price, category, unit, isBottle, imageUrl } = body;

    if (!name || !name.trim()) return badRequest("Mahsulot nomi talab qilinadi");
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) return badRequest("Narx to'g'ri kiritilishi kerak");

    const cat = ["WATER", "PROMO", "ACCESSORIES"].includes(category) ? category : "WATER";
    const productUnit = ["PIECE", "LITER"].includes(unit) ? unit : "PIECE";

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: priceNum,
        category: cat,
        unit: productUnit,
        isBottle: isBottle !== undefined ? !!isBottle : true,
        imageUrl: imageUrl?.trim() || null,
        isActive: true,
        companyId: auth.companyId,
      },
    });

    return success(product, "Mahsulot qo'shildi");
  } catch (error) {
    console.error("Create product error:", error);
    return serverError("Mahsulot yaratishda xatolik");
  }
}
