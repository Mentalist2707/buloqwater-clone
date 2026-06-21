/**
 * GET /api/v1/orders — Buyurtmalar ro'yxati
 * POST /api/v1/orders — Yangi buyurtma yaratish
 * 
 * Roles: DIRECTOR, OPERATOR
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  badRequest,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";

// ── GET: Buyurtmalar ro'yxati ───────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, ASSIGNED, DELIVERED, etc.
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filter shartlari
    const where: any = { companyId: auth.companyId };

    if (status) {
      where.status = status;
    } else {
      // Default: faol buyurtmalar + oxirgi 2 kun ichida yetkazilganlar
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      where.OR = [
        { status: { in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] } },
        { status: "DELIVERED", deliveredAt: { gte: twoDaysAgo } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, name: true, phone1: true, address: true, landmark: true, locationLink: true },
          },
          driver: { select: { id: true, name: true, phone: true } },
          operator: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return success({
      items: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return serverError();
  }
}

// ── POST: Yangi buyurtma yaratish ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const body = await request.json();
    const { customerId, items } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return badRequest("customerId va items (productId, quantity) talab qilinadi");
    }

    const companyId = auth.companyId;

    // Mijozni tekshirish
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) return badRequest("Mijoz topilmadi");

    // Mahsulotlarni olish
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, companyId, isActive: true },
    });

    if (products.length === 0) return badRequest("Mahsulotlar topilmadi");

    // Hisoblash
    let totalAmount = 0;
    let totalBottles = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Mahsulot topilmadi: ${item.productId}`);
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      if (product.isBottle) totalBottles += item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
      };
    });

    // Order number
    const lastOrder = await prisma.order.findFirst({
      where: { companyId },
      orderBy: { orderNumber: "desc" },
    });
    const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

    // Yaratish
    const order = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        companyId,
        customerId,
        operatorId: auth.userId,
        totalAmount,
        bottlesDelivered: totalBottles,
        status: "PENDING",
        items: { create: orderItems },
      },
      include: {
        customer: { select: { id: true, name: true, phone1: true, address: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    return success(order, "Buyurtma yaratildi");
  } catch (error) {
    console.error("Create order error:", error);
    return serverError("Buyurtma yaratishda xatolik");
  }
}
