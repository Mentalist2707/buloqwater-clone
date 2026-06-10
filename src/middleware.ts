import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;
    const hostname = request.headers.get("host") || "";

    const subdomain = getSubdomainFromHost(hostname);

    if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname.startsWith("/register/") || pathname.startsWith("/api/auth") || pathname === "/manifest.json" || pathname.startsWith("/icon")) {
      // Subdomen bor bo'lsa — faqat /login ruxsat, landing va register ga yo'l yo'q
      if (subdomain && (pathname === "/" || pathname === "/register")) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role;

    if (pathname.startsWith("/superadmin")) {
      if (role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    if (pathname.startsWith("/admin")) {
      if (role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
        return redirectToRoleHome(role as string, request.url);
      }
    }

    if (pathname.startsWith("/operator")) {
      if (role !== "OPERATOR" && role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
        return redirectToRoleHome(role as string, request.url);
      }
    }

    if (pathname.startsWith("/driver")) {
      if (role !== "DRIVER" && role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
        return redirectToRoleHome(role as string, request.url);
      }
    }

    // ═══ SUBDOMEN XAVFSIZLIK TEKSHIRUVI ═══
    // 1. Agar foydalanuvchi subdomen bilan login qilgan bo'lsa (masalan shifo.buloqwater.uz),
    //    lekin hozir boshqa subdomen yoki asosiy domenga kirmoqchi bo'lsa — login sahifasiga yo'naltirish
    if (subdomain && token.subdomain && subdomain !== token.subdomain) {
      // Boshqa kompaniyaning subdomenida — login sahifasiga
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Agar foydalanuvchi tenant (kompaniya) xodimi bo'lsa (token.subdomain bor),
    //    lekin hozir ASOSIY domenga (buloqwater.uz) kirgan bo'lsa — o'z subdomeniga yo'naltirish
    if (!subdomain && token.subdomain && token.role !== "SUPER_ADMIN") {
      // Asosiy domenga kirish ruxsat emas, tenant xodimini o'z subdomeniga yo'naltirish
      const tenantUrl = new URL(pathname, request.url);
      tenantUrl.hostname = `${token.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN || "buloqwater.uz"}`;
      return NextResponse.redirect(tenantUrl);
    }

    // 3. Agar asosiy domenga SUPER_ADMIN bo'lmagan, subdomen ham bo'lmagan user kirsa
    //    (masalan, xato cookie qolgan holat) — login ga yo'naltirish
    if (!subdomain && !token.subdomain && token.role !== "SUPER_ADMIN" && token.role !== "CUSTOMER") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (
          pathname === "/" ||
          pathname === "/login" ||
          pathname === "/register" ||
          pathname.startsWith("/register/") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname === "/manifest.json"
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

function getSubdomainFromHost(hostname: string): string | null {
  const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "buloqwater.uz";

  // Vercel default domeni — subdomen emas
  if (hostname.includes(".vercel.app")) return null;

  // Production: shifo.buloqwater.uz → "shifo"
  if (hostname.includes(baseDomain)) {
    const clean = hostname.replace(`:${process.env.PORT || "3000"}`, "");
    // buloqwater.uz yoki www.buloqwater.uz — subdomen emas
    if (clean === baseDomain || clean === `www.${baseDomain}`) return null;
    // shifo.buloqwater.uz → "shifo"
    const sub = clean.replace(`.${baseDomain}`, "");
    if (sub && sub !== clean) return sub;
  }

  // Dev: shifo.localhost:3000
  if (hostname.includes(".localhost")) {
    return hostname.split(".")[0];
  }

  return null;
}

function redirectToRoleHome(role: string, baseUrl: string): NextResponse {
  const redirectMap: Record<string, string> = {
    SUPER_ADMIN: "/superadmin/dashboard",
    DIRECTOR: "/admin",
    OPERATOR: "/operator/orders",
    DRIVER: "/driver/tasks",
  };

  const path = redirectMap[role] || "/login";
  return NextResponse.redirect(new URL(path, baseUrl));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|logo|public|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)",
  ],
};
