"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export async function getProducts(): Promise<ActionResult<any[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.companyId) return { success: false, error: "Ruxsat yo'q" };

    const products = await prisma.product.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: products as any };
  } catch (error) {
    return { success: false, error: "Mahsulotlar yuklanmadi" };
  }
}

interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  category: "WATER" | "PROMO" | "ACCESSORIES";
  isBottle: boolean;
}

export async function createProduct(input: CreateProductInput): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.companyId) return { success: false, error: "Ruxsat yo'q" };

    await prisma.product.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        category: input.category,
        isBottle: input.isBottle,
        companyId: session.user.companyId,
      },
    });

    return { success: true, message: "Mahsulot yaratildi" };
  } catch (error) {
    return { success: false, error: "Mahsulot yaratishda xatolik" };
  }
}

export async function updateProductPrice(productId: string, newPrice: number): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.companyId) return { success: false, error: "Ruxsat yo'q" };

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId: session.user.companyId },
    });
    if (!product) return { success: false, error: "Mahsulot topilmadi" };

    await prisma.product.update({
      where: { id: productId },
      data: { price: newPrice },
    });

    return { success: true, message: "Narx yangilandi" };
  } catch (error) {
    return { success: false, error: "Narx o'zgartirishda xatolik" };
  }
}



// ── Mahsulotni to'liq yangilash ───────────────────────────────
interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  category?: "WATER" | "PROMO" | "ACCESSORIES";
  isBottle?: boolean;
}

export async function updateProduct(productId: string, input: UpdateProductInput): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.companyId) return { success: false, error: "Ruxsat yo'q" };

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId: session.user.companyId },
    });
    if (!product) return { success: false, error: "Mahsulot topilmadi" };

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.isBottle !== undefined) updateData.isBottle = input.isBottle;

    await prisma.product.update({ where: { id: productId }, data: updateData });
    return { success: true, message: "Mahsulot yangilandi" };
  } catch (error) {
    return { success: false, error: "Yangilashda xatolik" };
  }
}

// ── Mahsulot statusini o'zgartirish ───────────────────────────
export async function toggleProductStatus(productId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.companyId) return { success: false, error: "Ruxsat yo'q" };

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId: session.user.companyId },
    });
    if (!product) return { success: false, error: "Mahsulot topilmadi" };

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Status o'zgartirishda xatolik" };
  }
}
