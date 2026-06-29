/**
 * GET /api/v1/customer/addresses - Mijoz barcha manzillarini olish
 * POST /api/v1/customer/addresses - Yangi manzil qo'shish
 * 
 * Oddiy CUSTOMER'lar uchun UserAddress ishlatiladi
 * Kompaniya mijozlari uchun Address (Customer bog'langan) ishlatiladi
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Oddiy CUSTOMER (companyId yo'q) - UserAddress'dan olish
    if (user.role === "CUSTOMER" && !user.companyId) {
      const addresses = await prisma.userAddress.findMany({
        where: { userId: user.id },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      return success(addresses);
    }

    // Kompaniya mijozi - Customer orqali Address'dan olish
    const customer = await prisma.customer.findFirst({ 
      where: { companyId: user.companyId!, phone1: user.phone } 
    });

    if (!customer) return success([]);

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

    // Oddiy CUSTOMER (companyId yo'q) - UserAddress yaratish
    if (user.role === "CUSTOMER" && !user.companyId) {
      // Agar default qilinsa, boshqa manzillarni default emas qilish
      if (isDefault) {
        await prisma.userAddress.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false }
        });
      }

      const newAddress = await prisma.userAddress.create({
        data: {
          userId: user.id,
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
    }

    // Kompaniya mijozi - Customer orqali Address yaratish
    const customer = await prisma.customer.findFirst({ 
      where: { companyId: user.companyId!, phone1: user.phone } 
    });

    if (!customer) return badRequest("Mijoz topilmadi");

    if (isDefault) {
      await prisma.address.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false }
      });
    }

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
