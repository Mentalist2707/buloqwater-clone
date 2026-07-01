/**
 * GET /api/v1/notifications/unread-count — o'qilmagan bildirishnomalar soni
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();

    const count = await prisma.notification.count({
      where: { userId: auth.userId, isRead: false },
    });

    return success({ count });
  } catch (error) {
    console.error("Unread count error:", error);
    return serverError();
  }
}
