/**
 * GET /api/v1/companies/search?query=
 * ────────────────────────────────────────────────────────────
 * Mijoz o'ziga yoqqan kompaniyani qidiradi va a'zo bo'lishi mumkin.
 * Faqat faol kompaniyalar. Har birida a'zolik holati (isMember) bo'ladi.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";
import { getMemberCompanyIds } from "@/lib/customer-companies";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").trim();

    const where: any = { status: "ACTIVE" };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { subdomain: { contains: query, mode: "insensitive" } },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      take: 40,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        subdomain: true,
        address: true,
        logoUrl: true,
        _count: { select: { products: true } },
      },
    });

    const memberIds = new Set(await getMemberCompanyIds(user.userId, user.phone));

    return success(
      companies.map((c) => ({
        id: c.id,
        name: c.name,
        subdomain: c.subdomain,
        address: c.address,
        logoUrl: c.logoUrl,
        productCount: c._count.products,
        isMember: memberIds.has(c.id),
      })),
    );
  } catch (error) {
    console.error("Company search error:", error);
    return serverError();
  }
}
