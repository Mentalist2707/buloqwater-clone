/**
 * Customer membership helper — mijozning qaysi kompaniyalarga a'zoligini
 * aniqlaydi. A'zolik `Customer` yozuvlari orqali (userId bilan bog'langan,
 * yoki eski ma'lumotlar uchun phone1 mos kelishi bilan).
 */
import { prisma } from "@/lib/prisma";

export interface Membership {
  customerId: string;
  companyId: string;
  companyName: string;
  bottleBalance: number;
  debtBalance: number;
}

/** Foydalanuvchining barcha a'zo kompaniyalari (faol kompaniyalar). */
export async function getMemberships(userId: string, phone: string): Promise<Membership[]> {
  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      company: { status: "ACTIVE" },
      OR: [{ userId }, { phone1: phone }],
    },
    select: {
      id: true,
      companyId: true,
      bottleBalance: true,
      debtBalance: true,
      company: { select: { name: true } },
    },
  });

  // Kompaniya bo'yicha dedupe (bitta kompaniyada bir nechta yozuv bo'lsa)
  const map = new Map<string, Membership>();
  for (const c of customers) {
    if (map.has(c.companyId)) continue;
    map.set(c.companyId, {
      customerId: c.id,
      companyId: c.companyId,
      companyName: c.company.name,
      bottleBalance: c.bottleBalance,
      debtBalance: c.debtBalance,
    });
  }
  return Array.from(map.values());
}

/** A'zo kompaniya ID'lari. */
export async function getMemberCompanyIds(userId: string, phone: string): Promise<string[]> {
  const memberships = await getMemberships(userId, phone);
  return memberships.map((m) => m.companyId);
}
