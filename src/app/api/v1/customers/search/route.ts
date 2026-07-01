/**
 * GET /api/v1/customers/search?query=&scope=all|mine
 * ────────────────────────────────────────────────────────────
 * Operator/Director uchun global odam qidiruvi (a'zolik holati bilan).
 *
 * scope="mine" → faqat joriy kompaniya mijozlari.
 * scope="all"  → butun baza: joriy kompaniya mijozlari + boshqa
 *                kompaniyalar mijozlari + tizimdagi CUSTOMER userlar.
 *
 * Har bir natija `PersonSearchResult` shaklida qaytadi:
 *   membership: "mine" | "other" | "none"
 *   - mine  → sizning mijozingiz (customerId bor, buyurtma berish mumkin)
 *   - other → boshqa kompaniya(lar)da mijoz (companyName + companyCount)
 *   - none  → tizimda bor, lekin hech qaysi kompaniyaga a'zo emas
 *
 * Roles: DIRECTOR, OPERATOR
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

// Telefonni taqqoslash uchun normalizatsiya: faqat raqamlar, 998 prefiksisiz
function normPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.replace(/^998/, "");
}

interface PersonResult {
  id: string;
  userId: string | null;
  customerId: string | null;
  name: string;
  phone: string;
  address: string | null;
  membership: "mine" | "other" | "none";
  companyName?: string | null;
  companyCount?: number;
  bottleBalance?: number;
  debtBalance?: number;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").trim();
    const scope = searchParams.get("scope") === "mine" ? "mine" : "all";

    if (query.length < 1) return success([]);

    const companyId = auth.companyId;
    const map = new Map<string, PersonResult>();

    // ── 1. Joriy kompaniya mijozlari (membership: mine) ──────
    const customerOr = [
      { name: { contains: query, mode: "insensitive" as const } },
      { phone1: { contains: query, mode: "insensitive" as const } },
      { phone2: { contains: query, mode: "insensitive" as const } },
      { address: { contains: query, mode: "insensitive" as const } },
    ];

    const mine = await prisma.customer.findMany({
      where: { companyId, isActive: true, OR: customerOr },
      take: 20,
      orderBy: { name: "asc" },
      select: {
        id: true,
        userId: true,
        name: true,
        phone1: true,
        address: true,
        bottleBalance: true,
        debtBalance: true,
      },
    });

    for (const c of mine) {
      map.set(normPhone(c.phone1), {
        id: c.id,
        userId: c.userId,
        customerId: c.id,
        name: c.name,
        phone: c.phone1,
        address: c.address,
        membership: "mine",
        bottleBalance: c.bottleBalance,
        debtBalance: c.debtBalance,
      });
    }

    if (scope === "all") {
      // ── 2. Boshqa kompaniyalar mijozlari (membership: other) ──
      const others = await prisma.customer.findMany({
        where: { companyId: { not: companyId }, isActive: true, OR: customerOr },
        take: 60,
        select: {
          id: true,
          userId: true,
          name: true,
          phone1: true,
          address: true,
          company: { select: { name: true } },
        },
      });

      // Telefon bo'yicha guruhlash — nechta kompaniyaga a'zo ekanini hisoblash
      const grouped = new Map<
        string,
        { sample: (typeof others)[number]; companies: Set<string> }
      >();
      for (const c of others) {
        const key = normPhone(c.phone1);
        if (map.has(key)) continue; // allaqachon "mine"
        const entry = grouped.get(key) || { sample: c, companies: new Set<string>() };
        entry.companies.add(c.company.name);
        grouped.set(key, entry);
      }
      for (const [key, entry] of grouped) {
        const c = entry.sample;
        map.set(key, {
          id: c.userId || c.id,
          userId: c.userId,
          customerId: null,
          name: c.name,
          phone: c.phone1,
          address: c.address,
          membership: "other",
          companyName: Array.from(entry.companies)[0],
          companyCount: entry.companies.size,
        });
      }

      // ── 3. Tizimdagi CUSTOMER userlar (membership: none) ─────
      const users = await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 60,
        select: { id: true, name: true, phone: true, address: true },
      });

      for (const u of users) {
        const key = normPhone(u.phone);
        const existing = map.get(key);
        if (existing) {
          // Taklif yuborish uchun userId'ni to'ldirib qo'yamiz
          if (!existing.userId) existing.userId = u.id;
          continue;
        }
        map.set(key, {
          id: u.id,
          userId: u.id,
          customerId: null,
          name: u.name,
          phone: u.phone,
          address: u.address,
          membership: "none",
        });
      }
    }

    // Tartib: avval mening mijozlarim, keyin boshqa kompaniya, keyin bosh
    const order = { mine: 0, other: 1, none: 2 };
    const results = Array.from(map.values())
      .sort((a, b) => order[a.membership] - order[b.membership])
      .slice(0, 30);

    return success(results);
  } catch (error) {
    console.error("Customer search error:", error);
    return serverError("Qidiruvda xatolik");
  }
}
