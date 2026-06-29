/**
 * GET  /api/v1/staff   — xodimlar ro'yxati
 * POST /api/v1/staff   — yangi xodim qo'shish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAuthUser, requireRoles, unauthorized, forbidden, success, serverError, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["DIRECTOR", "SUPER_ADMIN"])) return forbidden();
    if (!user.companyId) return forbidden();

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { companyId: user.companyId, role: { in: ["OPERATOR", "DRIVER"] } },
      orderBy: { createdAt: "desc" },
    });

    const driverIds = users.filter((u) => u.role === "DRIVER").map((u) => u.id);

    const [driverDeliveries, driverActive] = await Promise.all([
      prisma.order.findMany({
        where: { driverId: { in: driverIds }, status: "DELIVERED", deliveredAt: { gte: today } },
        select: { driverId: true, bottlesReturned: true, paidAmount: true, paymentType: true, totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ["driverId"],
        where: { driverId: { in: driverIds }, status: { in: ["ASSIGNED", "IN_TRANSIT"] } },
        _count: true,
      }),
    ]);

    const kpiMap: Record<string, any> = {};
    driverDeliveries.forEach((d) => {
      if (!d.driverId) return;
      if (!kpiMap[d.driverId]) kpiMap[d.driverId] = { delivered: 0, assigned: 0, bottlesCollected: 0, cashCollected: 0, activeOrders: 0 };
      kpiMap[d.driverId].delivered++;
      kpiMap[d.driverId].assigned++;
      kpiMap[d.driverId].bottlesCollected += d.bottlesReturned;
      if (d.paymentType !== "CREDIT") kpiMap[d.driverId].cashCollected += d.paidAmount;
    });
    driverActive.forEach((d) => {
      if (!d.driverId) return;
      if (!kpiMap[d.driverId]) kpiMap[d.driverId] = { delivered: 0, assigned: 0, bottlesCollected: 0, cashCollected: 0, activeOrders: 0 };
      kpiMap[d.driverId].activeOrders = d._count;
    });

    const result = users.map((u) => ({
      id: u.id, name: u.name, phone: u.phone, role: u.role, isActive: u.isActive,
      kpi: u.role === "DRIVER" ? kpiMap[u.id] || { delivered: 0, assigned: 0, bottlesCollected: 0, cashCollected: 0, activeOrders: 0 } : undefined,
    }));

    return success(result);
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["DIRECTOR", "SUPER_ADMIN"])) return forbidden();
    if (!user.companyId) return forbidden();

    const body = await request.json();
    const { name, phone: rawPhone, password, role } = body;

    if (!name || !rawPhone || !password || !role) return badRequest("Barcha maydonlar kerak");

    // Telefon normalizatsiya
    const phone = normalizePhone(rawPhone);

    const existing = await prisma.user.findFirst({ where: { phone, companyId: user.companyId } });
    if (existing) return badRequest("Bu telefon raqami allaqachon ro'yxatda");

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, phone, password: hashed, role, companyId: user.companyId },
    });

    return success({ message: "Xodim qo'shildi" });
  } catch {
    return serverError();
  }
}

// Telefon normalizatsiya funksiyasi
function normalizePhone(rawPhone: string): string {
  let phone = rawPhone.replace(/\D/g, "");
  if (phone.startsWith("998") && phone.length === 12) {
    return `+${phone}`;
  } else if (phone.length === 9) {
    return `+998${phone}`;
  } else if (rawPhone.startsWith("+")) {
    return rawPhone;
  }
  return `+998${phone}`;
}
