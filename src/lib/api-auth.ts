/**
 * Mobile API uchun JWT authentication helper
 * jose kutubxonasi (next-auth dependency) orqali ishlaydi
 */

import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-key"
);

const TOKEN_EXPIRY = "30d"; // 30 kun

export interface JWTPayload {
  userId: string;
  /** userId bilan bir xil — qulaylik uchun alias */
  id: string;
  role: Role;
  companyId: string | null;
  phone: string;
  subdomain: string | null;
}

// ── JWT Token yaratish ──────────────────────────────────────
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

// ── JWT Token tekshirish ────────────────────────────────────
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const data = payload as unknown as JWTPayload;
    // userId → id alias (ba'zi route'lar user.id ishlatadi)
    if (data.userId && !data.id) {
      data.id = data.userId;
    }
    return data;
  } catch {
    return null;
  }
}

// ── Request'dan token olish ─────────────────────────────────
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

// ── Auth middleware — request'dan user olish ────────────────
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

// ── Role tekshirish helper ──────────────────────────────────
export function requireRoles(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

// ── API xato javoblari ──────────────────────────────────────
export function unauthorized(message = "Avtorizatsiya talab qilinadi") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Ruxsat yo'q") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function notFound(message = "Topilmadi") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function success<T>(data?: T, message?: string) {
  return NextResponse.json({ success: true, data, message });
}

export function serverError(message = "Serverda xatolik yuz berdi") {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}
