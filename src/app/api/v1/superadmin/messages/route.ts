/**
 * GET /api/v1/superadmin/messages  — barcha xabarlar ro'yxati
 * POST /api/v1/superadmin/messages — yangi xabar yuborish
 * Requires: SUPER_ADMIN
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser, requireRoles, unauthorized, forbidden,
  success, serverError, badRequest,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!requireRoles(auth.role, ["SUPER_ADMIN"])) return forbidden();

    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
    });

    return success(messages);
  } catch (error) {
    console.error("GET messages error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorized();
    if (!requireRoles(auth.role, ["SUPER_ADMIN"])) return forbidden();

    const body = await request.json();
    const { title, content, type, isGlobal, companyId, companyName } = body;

    if (!title || !content || !type) {
      return badRequest("title, content va type majburiy");
    }

    const validTypes = ["INFO", "WARNING", "URGENT", "ANNOUNCEMENT"];
    if (!validTypes.includes(type)) {
      return badRequest("Noto'g'ri tur: INFO | WARNING | URGENT | ANNOUNCEMENT");
    }

    const message = await prisma.message.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type,
        isGlobal: Boolean(isGlobal),
        companyId: isGlobal ? null : (companyId || null),
        companyName: isGlobal ? null : (companyName || null),
      },
    });

    return success(message, "Xabar yuborildi");
  } catch (error) {
    console.error("POST messages error:", error);
    return serverError();
  }
}
