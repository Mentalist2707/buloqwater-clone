/**
 * GET  /api/v1/customer/orders — buyurtmalar tarixi (barcha a'zo kompaniyalar)
 * POST /api/v1/customer/orders — yangi buyurtma (savat kompaniya bo'yicha guruhlanadi)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Mijozning barcha yozuvlari (userId yoki telefon bo'yicha)
    const customers = await prisma.customer.findMany({
      where: user.companyId
        ? { companyId: user.companyId, OR: [{ userId: user.userId }, { phone1: user.phone }] }
        : { OR: [{ userId: user.userId }, { phone1: user.phone }] },
      select: { id: true },
    });

    if (customers.length === 0) return success([]);

    const orders = await prisma.order.findMany({
      where: { customerId: { in: customers.map((c) => c.id) } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: { include: { product: { select: { name: true, isBottle: true } } } },
        driver: { select: { name: true, phone: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return success(orders);
  } catch (error) {
    console.error("Customer orders GET error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { items, notes } = body;

    if (!items || items.length === 0) return badRequest("Mahsulotlar tanlanmagan");

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });
    if (products.length === 0) return badRequest("Mahsulotlar topilmadi");

    // Savatni kompaniya bo'yicha guruhlash — har kompaniya alohida buyurtma
    const byCompany = new Map<string, { productId: string; quantity: number }[]>();
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const list = byCompany.get(product.companyId) || [];
      list.push({ productId: item.productId, quantity: item.quantity });
      byCompany.set(product.companyId, list);
    }

    let createdCount = 0;

    for (const [companyId, companyItems] of byCompany) {
      // Kompaniyadagi mijoz yozuvini topish/yaratish (userId bilan bog'lash)
      let customer = await prisma.customer.findFirst({
        where: { companyId, OR: [{ userId: user.userId }, { phone1: user.phone }] },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: user.phone,
            phone1: user.phone,
            address: "Manzil kiritilmagan",
            companyId,
            userId: user.userId,
          },
        });
      } else if (!customer.userId) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { userId: user.userId },
        });
      }

      let totalAmount = 0;
      let totalBottles = 0;
      const orderItems = companyItems.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        if (product.isBottle) totalBottles += item.quantity;
        return { productId: item.productId, quantity: item.quantity, unitPrice: product.price, totalPrice: itemTotal };
      });

      const lastOrder = await prisma.order.findFirst({
        where: { companyId },
        orderBy: { orderNumber: "desc" },
      });
      const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

      await prisma.order.create({
        data: {
          orderNumber: nextOrderNumber,
          companyId,
          customerId: customer.id,
          totalAmount,
          bottlesDelivered: totalBottles,
          notes: notes || null,
          status: "PENDING",
          items: { create: orderItems },
        },
      });
      createdCount++;
    }

    return success({
      message:
        createdCount > 1
          ? `${createdCount} ta buyurtma qabul qilindi (kompaniyalar bo'yicha)`
          : "Buyurtma qabul qilindi!",
      orders: createdCount,
    });
  } catch (error) {
    console.error("Customer orders POST error:", error);
    return serverError();
  }
}
