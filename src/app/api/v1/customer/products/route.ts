/**
 * GET /api/v1/customer/products
 * ────────────────────────────────────────────────────────────
 * Mijoz uchun mahsulotlar vitrinasi — faqat a'zo bo'lgan kompaniyalar.
 *  - 1 kompaniya a'zoligi → o'sha kompaniya mahsulotlari
 *  - bir nechta a'zolik  → hamma a'zo kompaniyalar mahsulotlari,
 *    har birida `company` (id + nom) bo'ladi
 * A'zolik bo'lmasa → bo'sh ro'yxat (mijoz kompaniya qidirib a'zo bo'ladi).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";
import { getMemberCompanyIds } from "@/lib/customer-companies";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Xodimlar (companyId bor) — o'z kompaniyasi mahsulotlari
    let companyIds: string[];
    if (user.companyId) {
      companyIds = [user.companyId];
    } else {
      companyIds = await getMemberCompanyIds(user.userId, user.phone);
    }

    if (companyIds.length === 0) return success([]);

    const products = await prisma.product.findMany({
      where: { companyId: { in: companyIds }, isActive: true },
      orderBy: [{ companyId: "asc" }, { createdAt: "desc" }],
      include: { company: { select: { id: true, name: true } } },
    });

    return success(products);
  } catch (error) {
    console.error("Customer products error:", error);
    return serverError();
  }
}
