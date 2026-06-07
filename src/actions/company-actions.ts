"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { ActionResult } from "@/types";

export async function getCompanies(): Promise<ActionResult<any[]>> {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          where: { role: "DIRECTOR" },
          select: { id: true, name: true, phone: true },
          take: 1,
        },
        _count: { select: { users: true, customers: true, orders: true } },
      },
    });

    const formatted = companies.map((c) => ({
      id: c.id,
      name: c.name,
      subdomain: c.subdomain,
      status: c.status,
      phone: c.phone,
      createdAt: c.createdAt.toISOString(),
      director: c.users[0] || null,
      _count: c._count,
    }));

    return { success: true, data: formatted };
  } catch (error) {
    return { success: false, error: "Kompaniyalar yuklanmadi" };
  }
}

interface CreateCompanyInput {
  companyName: string;
  subdomain: string;
  directorName: string;
  directorPhone: string;
  directorPassword: string;
}

export async function createCompany(input: CreateCompanyInput): Promise<ActionResult> {
  try {
    const existing = await prisma.company.findUnique({
      where: { subdomain: input.subdomain },
    });
    if (existing) {
      return { success: false, error: `"${input.subdomain}" subdomeni allaqachon band` };
    }

    const hashedPassword = await bcrypt.hash(input.directorPassword, 10);

    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.companyName,
          subdomain: input.subdomain,
          phone: input.directorPhone,
        },
      });

      await tx.user.create({
        data: {
          name: input.directorName,
          phone: input.directorPhone,
          password: hashedPassword,
          role: "DIRECTOR",
          companyId: company.id,
        },
      });
    });

    return { success: true, message: "Kompaniya muvaffaqiyatli yaratildi" };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "Bu telefon raqami yoki subdomen band" };
    }
    return { success: false, error: "Kompaniya yaratishda xatolik yuz berdi" };
  }
}

export async function toggleCompanyStatus(companyId: string): Promise<ActionResult> {
  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return { success: false, error: "Kompaniya topilmadi" };

    await prisma.company.update({
      where: { id: companyId },
      data: { status: company.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
    });

    return { success: true, message: "Status o'zgartirildi" };
  } catch (error) {
    return { success: false, error: "Status o'zgartirishda xatolik" };
  }
}
