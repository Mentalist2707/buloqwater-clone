/**
 * GET /api/v1/customers/:id — bitta mijoz haqida to'liq ma'lumot
 * ────────────────────────────────────────────────────────────
 * Qaytaradi: mijoz asosiy ma'lumoti, barcha manzillari (Customer.address +
 * saqlangan manzillar + ilovadagi UserAddress'lar), buyurtmalar tarixi va
 * statistika (jami buyurtma, sarflangan summa, idish/qarz qoldig'i).
 *
 * Roles: DIRECTOR, OPERATOR
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  notFound,
  success,
  serverError,
  requireRoles,
} from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!auth.companyId) return forbidden("Kompaniyaga tegishli emassiz");
    if (!requireRoles(auth.role, ["DIRECTOR", "OPERATOR"])) return forbidden();

    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
        user: {
          select: {
            id: true,
            userAddresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
          },
        },
      },
    });
    if (!customer) return notFound("Mijoz topilmadi");

    // ── Manzillarni birlashtirish ──────────────────────────────
    const addresses: any[] = [];
    if (customer.address && customer.address !== "Manzil kiritilmagan") {
      addresses.push({
        id: `primary-${customer.id}`,
        label: "Asosiy manzil",
        address: customer.address,
        landmark: customer.landmark,
        locationLink: customer.locationLink,
        latitude: null,
        longitude: null,
        isDefault: true,
        source: "primary",
      });
    }
    for (const a of customer.addresses) {
      addresses.push({
        id: a.id,
        label: a.label,
        address: a.address,
        landmark: a.landmark,
        locationLink: a.locationLink,
        latitude: a.latitude,
        longitude: a.longitude,
        isDefault: a.isDefault,
        source: "saved",
      });
    }
    for (const a of customer.user?.userAddresses || []) {
      addresses.push({
        id: a.id,
        label: a.label,
        address: a.address,
        landmark: a.landmark,
        locationLink: a.locationLink,
        latitude: a.latitude,
        longitude: a.longitude,
        isDefault: a.isDefault,
        source: "app",
      });
    }

    // ── Buyurtmalar tarixi ─────────────────────────────────────
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentType: true,
        totalAmount: true,
        paidAmount: true,
        bottlesDelivered: true,
        bottlesReturned: true,
        createdAt: true,
        deliveredAt: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            product: { select: { name: true, isBottle: true } },
          },
        },
      },
    });

    // ── Statistika ─────────────────────────────────────────────
    const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
    const totalSpent = deliveredOrders.reduce((s, o) => s + o.totalAmount, 0);

    return success({
      customer: {
        id: customer.id,
        name: customer.name,
        phone1: customer.phone1,
        phone2: customer.phone2,
        address: customer.address,
        landmark: customer.landmark,
        locationLink: customer.locationLink,
        notes: customer.notes,
        bottleBalance: customer.bottleBalance,
        debtBalance: customer.debtBalance,
        createdAt: customer.createdAt.toISOString(),
        hasAppAccount: !!customer.userId,
      },
      addresses,
      orders: orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
      })),
      stats: {
        totalOrders: orders.length,
        deliveredOrders: deliveredOrders.length,
        totalSpent,
      },
    });
  } catch (error) {
    console.error("Customer detail error:", error);
    return serverError();
  }
}
