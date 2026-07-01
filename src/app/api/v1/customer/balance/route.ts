/**
 * GET /api/v1/customer/balance — idish va qarz balansi
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";
import { getMemberships } from "@/lib/customer-companies";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Xodim (companyId bor) — bitta kompaniya; mijoz — barcha a'zoliklar yig'indisi
    if (user.companyId) {
      const customer = await prisma.customer.findFirst({
        where: { companyId: user.companyId, phone1: user.phone },
      });
      if (!customer) return success({ bottleBalance: 0, debtBalance: 0, name: user.phone, companies: [] });
      return success({
        bottleBalance: customer.bottleBalance,
        debtBalance: customer.debtBalance,
        name: customer.name,
        address: customer.address,
        landmark: customer.landmark,
        locationLink: customer.locationLink,
        companies: [],
      });
    }

    const memberships = await getMemberships(user.userId, user.phone);
    const bottleBalance = memberships.reduce((s, m) => s + m.bottleBalance, 0);
    const debtBalance = memberships.reduce((s, m) => s + m.debtBalance, 0);

    return success({
      bottleBalance,
      debtBalance,
      name: user.phone,
      companyCount: memberships.length,
      companies: memberships.map((m) => ({
        companyId: m.companyId,
        companyName: m.companyName,
        bottleBalance: m.bottleBalance,
        debtBalance: m.debtBalance,
      })),
    });
  } catch (error) {
    console.error("Customer balance error:", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { address, landmark, locationLink } = body;

    if (!address) return serverError();

    const customer = user.companyId
      ? await prisma.customer.findFirst({ where: { companyId: user.companyId, phone1: user.phone } })
      : await prisma.customer.findFirst({ where: { phone1: user.phone } });

    if (!customer) return serverError();

    await prisma.customer.update({
      where: { id: customer.id },
      data: { address, landmark: landmark || null, locationLink: locationLink || null },
    });

    return success({ message: "Manzil yangilandi" });
  } catch (error) {
    return serverError();
  }
}
