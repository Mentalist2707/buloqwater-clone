/**
 * GET /api/v1/customer/addresses - Mijoz barcha manzillarini olish
 * POST /api/v1/customer/addresses - Yangi manzil qo'shish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Customer topish
    const customer = user.companyId
      ? await prisma.customer.findFirst({ where: { companyId: user.companyId, phone1: user.phone } })
      : await prisma.customer.findFirst({ where: { phone1: user.phone } });

    if (!customer) return success([]);

    // Barcha manzillarni olish
    const addresses = await prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return success(addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { label, address, landmark, latitude, longitude, locationLink, isDefault } = body;

    if (!label || !address) {
      return badRequest("Label va manzil kiritilishi shart");
    }

    // Customer topish
    const customer = user.companyId
      ? await prisma.customer.findFirst({ where: { companyId: user.companyId, phone1: user.phone } })
      : await prisma.customer.findFirst({ where: { phone1: user.phone } });

    if (!customer) return badRequest("Mijoz topilmadi");

    // Agar default qilinsa, boshqa manzillarni default emas qilish
    if (isDefault) {
      await prisma.address.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Yangi manzil yaratish
    const newAddress = await prisma.address.create({
      data: {
        customerId: customer.id,
        label: label.trim(),
        address: address.trim(),
        landmark: landmark?.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null,
        locationLink: locationLink?.trim() || null,
        isDefault: isDefault || false,
      }
    });

    return success(newAddress);
  } catch (error) {
    console.error("Create address error:", error);
    return serverError();
  }
}
