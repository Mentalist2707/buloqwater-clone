/**
 * GET /api/v1/products — Mahsulotlar ro'yxati
 * 
 * Roles: DIRECTOR, OPERATOR
 * Query params: ?category=WATER|PROMO|ACCESSORIES
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
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

    const where: any = {
      companyId: auth.companyId,
      isActive: true,
    };

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
      },
    });

    return success(products);
  } catch (error) {
    console.error("Get products error:", error);
    return serverError();
  }
}
