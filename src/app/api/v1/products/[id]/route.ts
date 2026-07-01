/**
 * PUT    /api/v1/products/:id — mahsulotni yangilash (narx, nom, va h.k.)
 * DELETE /api/v1/products/:id — mahsulotni o'chirish
 *
 * Roles: DIRECTOR
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR"])) return forbidden();

    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, companyId: auth.companyId },
      select: { id: true },
    });
    if (!existing) return notFound("Mahsulot topilmadi");

    const body = await request.json();
    const { name, description, price, category, unit, isBottle, imageUrl } = body;

    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return badRequest("Nom bo'sh bo'lmasligi kerak");
      data.name = name.trim();
    }
    if (description !== undefined) data.description = description?.trim() || null;
    if (price !== undefined) {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum <= 0) return badRequest("Narx noto'g'ri");
      data.price = priceNum;
    }
    if (category !== undefined && ["WATER", "PROMO", "ACCESSORIES"].includes(category)) data.category = category;
    if (unit !== undefined && ["PIECE", "LITER"].includes(unit)) data.unit = unit;
    if (isBottle !== undefined) data.isBottle = !!isBottle;
    if (imageUrl !== undefined) data.imageUrl = imageUrl?.trim() || null;

    if (Object.keys(data).length === 0) return badRequest("O'zgartirish kiritilmadi");

    const product = await prisma.product.update({ where: { id }, data });
    return success(product, "Mahsulot yangilandi");
  } catch (error) {
    console.error("Update product error:", error);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR"])) return forbidden();

    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, companyId: auth.companyId },
      select: { id: true, _count: { select: { orderItems: true } } },
    });
    if (!existing) return notFound("Mahsulot topilmadi");

    // Buyurtmalarda ishlatilgan bo'lsa — o'chirmaymiz, faqat noaktiv qilamiz
    if (existing._count.orderItems > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return success({ deactivated: true }, "Mahsulot buyurtmalarda mavjud — noaktiv qilindi");
    }

    await prisma.product.delete({ where: { id } });
    return success({ deleted: true }, "Mahsulot o'chirildi");
  } catch (error) {
    console.error("Delete product error:", error);
    return serverError();
  }
}
