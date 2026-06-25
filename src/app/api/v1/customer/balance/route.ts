/**
 * GET /api/v1/customer/balance — idish va qarz balansi
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const customer = user.companyId
      ? await prisma.customer.findFirst({ where: { companyId: user.companyId, phone1: user.phone } })
      : await prisma.customer.findFirst({ where: { phone1: user.phone } });

    if (!customer) return success({ bottleBalance: 0, debtBalance: 0, name: user.phone });

    return success({
      bottleBalance: customer.bottleBalance,
      debtBalance: customer.debtBalance,
      name: customer.name,
      address: customer.address,
      landmark: customer.landmark,
      locationLink: customer.locationLink,
    });
  } catch (error) {
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
