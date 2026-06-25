/**
 * GET /api/v1/customer/products
 * Mijoz uchun mahsulotlar vitrinasi
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    let products;
    if (user.companyId) {
      products = await prisma.product.findMany({
        where: { companyId: user.companyId, isActive: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      products = await prisma.product.findMany({
        where: { isActive: true, company: { status: "ACTIVE" } },
        orderBy: { createdAt: "desc" },
        include: { company: { select: { name: true } } },
      });
    }

    return success(products);
  } catch (error) {
    return serverError();
  }
}
