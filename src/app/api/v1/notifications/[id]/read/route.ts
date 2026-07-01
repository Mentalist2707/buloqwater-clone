/**
 * POST /api/v1/notifications/:id/read — bildirishnomani o'qilgan deb belgilash
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: auth.userId },
      select: { id: true },
    });
    if (!notification) return notFound("Bildirishnoma topilmadi");

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return success({ message: "O'qilgan deb belgilandi" });
  } catch (error) {
    console.error("Mark read error:", error);
    return serverError();
  }
}
