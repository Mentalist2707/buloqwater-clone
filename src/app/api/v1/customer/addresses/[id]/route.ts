/**
 * PUT /api/v1/customer/addresses/[id] - Manzilni yangilash
 * DELETE /api/v1/customer/addresses/[id] - Manzilni o'chirish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError, badRequest } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { label, address, landmark, latitude, longitude, locationLink, isDefault } = body;

    // Customer topish
    const customer = user.companyId
      ? await prisma.customer.findFirst({ where: { companyId: user.companyId, phone1: user.phone } })
      : await prisma.customer.findFirst({ where: { phone1: user.phone } });

    if (!customer) return badRequest("Mijoz topilmadi");

    // Manzil mavjudligini tekshirish
    const existingAddress = await prisma.address.findFirst({
      where: { id: params.id, customerId: customer.id }
    });

    if (!existingAddress) return badRequest("Manzil topilmadi");

    // Agar default qilinsa, boshqa manzillarni default emas qilish
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Manzilni yangilash
    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: {
        label: label?.trim() || existingAddress.label,
        address: address?.trim() || existingAddress.address,
        landmark: landmark !== undefined ? (landmark?.trim() || null) : existingAddress.landmark,
        latitude: latitude !== undefined ? latitude : existingAddress.latitude,
        longitude: longitude !== undefined ? longitude : existingAddress.longitude,
        locationLink: locationLink !== undefined ? (locationLink?.trim() || null) : existingAddress.locationLink,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
      }
    });

    return success(updatedAddress);
  } catch (error) {
    console.error("Update address error:", error);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Customer topish
    const customer = user.companyId
      ? await prisma.customer.findFirst({ where: { companyId: user.companyId, phone1: user.phone } })
      : await prisma.customer.findFirst({ where: { phone1: user.phone } });

    if (!customer) return badRequest("Mijoz topilmadi");

    // Manzil mavjudligini tekshirish
    const existingAddress = await prisma.address.findFirst({
      where: { id: params.id, customerId: customer.id }
    });

    if (!existingAddress) return badRequest("Manzil topilmadi");

    // Manzilni o'chirish
    await prisma.address.delete({
      where: { id: params.id }
    });

    return success({ message: "Manzil o'chirildi" });
  } catch (error) {
    console.error("Delete address error:", error);
    return serverError();
  }
}
