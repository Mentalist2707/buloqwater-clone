/**
 * POST /api/v1/notifications/read-all — hamma bildirishnomalarni o'qilgan deb belgilash
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, success, serverError } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();

    await prisma.notification.updateMany({
      where: { userId: auth.userId, isRead: false },
      data: { isRead: true },
    });

    return success({ message: "Hammasi o'qilgan deb belgilandi" });
  } catch (error) {
    console.error("Read all error:", error);
    return serverError();
  }
}
