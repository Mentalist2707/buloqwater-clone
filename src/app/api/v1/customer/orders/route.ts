/**
 * GET  /api/v1/customer/orders — buyurtmalar tarixi
 * POST /api/v1/customer/orders — yangi buyurtma berish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const customer = user.companyId
      ? await prisma.customer.findFirst({ where: { companyId: user.companyId, phone1: user.phone } })
      : await prisma.customer.findFirst({ where: { phone1: user.phone } });

    if (!customer) return success([]);

    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        items: { include: { product: { select: { name: true, isBottle: true } } } },
        driver: { select: { name: true, phone: true } },
      },
    });

    return success(orders);
  } catch (error) {
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

    const companyId = products[0].companyId;

    let customer = await prisma.customer.findFirst({
      where: { phone1: user.phone, companyId },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: user.phone,
          phone1: user.phone,
          address: "Manzil kiritilmagan",
          companyId,
        },
      });
    }

    let totalAmount = 0;
    let totalBottles = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error("Mahsulot topilmadi");
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

    return success({ message: "Buyurtma qabul qilindi!" });
  } catch (error) {
    return serverError();
  }
}
