/**
 * GET  /api/v1/superadmin/companies — kompaniyalar ro'yxati
 * POST /api/v1/superadmin/companies — yangi kompaniya yaratish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAuthUser, requireRoles, unauthorized, forbidden, success, serverError, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["SUPER_ADMIN"])) return forbidden();

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, subdomain: true, status: true,
        phone: true, maxCustomers: true, maxUsers: true, createdAt: true,
        _count: { select: { users: true, customers: true, orders: true } },
        subscription: { select: { endDate: true, isPaid: true, amount: true } },
        users: {
          where: { role: "DIRECTOR" },
          select: { id: true, name: true, phone: true },
          take: 1,
        },
      },
    });

    return success(
      companies.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        director: c.users[0] || null,
        users: undefined,
        subscription: c.subscription
          ? { ...c.subscription, endDate: c.subscription.endDate.toISOString() }
          : null,
      }))
    );
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["SUPER_ADMIN"])) return forbidden();

    const body = await request.json();
    const { companyName, subdomain, directorName, directorPhone, directorPassword } = body;

    if (!companyName || !subdomain || !directorName || !directorPhone || !directorPassword) {
      return badRequest("Barcha maydonlar kerak");
    }

    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.company.findUnique({ where: { subdomain: cleanSubdomain } });
    if (existing) return badRequest("Bu subdomen allaqachon band");

    const existingPhone = await prisma.user.findFirst({
      where: { phone: directorPhone, companyId: null },
    });

    const hashed = await bcrypt.hash(directorPassword, 10);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        subdomain: cleanSubdomain,
        users: {
          create: {
            name: directorName,
            phone: directorPhone,
            password: hashed,
            role: "DIRECTOR",
          },
        },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        action: "company_created",
        description: `${companyName} kompaniyasi yaratildi`,
        companyId: company.id,
      },
    });

    return success({ message: "Kompaniya yaratildi", companyId: company.id });
  } catch {
    return serverError();
  }
}
