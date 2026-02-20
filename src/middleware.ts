import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedPaths = [
  "/dashboard",
  "/onboarding",
  "/business",
  "/settings",
  "/team",
  "/billing",
  "/plans",
  "/assets",
  "/audits",
];

// Routes that require admin
const adminPaths = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if this is a protected route
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAdmin) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_URL || "fallback-dev-secret-change-in-prod",
  });

  // Not logged in -> redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require isAdmin flag
  if (isAdmin && !token.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/business/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/billing/:path*",
    "/plans/:path*",
    "/assets/:path*",
    "/audits/:path*",
    "/admin/:path*",
  ],
};
