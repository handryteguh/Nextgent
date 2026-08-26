import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie, SESSION_COOKIE_NAME } from "@/lib/session";

// Proteksi semua halaman dashboard. Login & API auth tetap publik.
const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Izinkan aset statis & semua API routes (auth via session di masing2 handler)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const authed = await verifySessionCookie(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  // Halaman publik + sudah login → arahkan ke dashboard
  if (isPublic && authed) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  // Halaman privat + belum login → arahkan ke /login
  if (!isPublic && !authed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // Semua route kecuali aset statis
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};