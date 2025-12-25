import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session_token";

// Admin-only routes (requires admin role)
const ADMIN_ONLY_ROUTES = ["/users"];

export function middleware(request: NextRequest) {
  const sessionValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isLoggedIn = !!sessionValue;

  const pathname = request.nextUrl.pathname;

  // Parse userId from session token (format: "userId:token")
  let userId: number | null = null;
  if (sessionValue) {
    const [userIdStr] = sessionValue.split(":");
    userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) userId = null;
  }

  const protectedRoutes = ["/users", "/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !isLoggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Note: For full RBAC with role checking, we would need to:
  // 1. Store role in the session token, OR
  // 2. Use a database call (not recommended in Edge middleware)
  // For now, we trust that logged-in users with admin routes are admins
  // Full role validation happens at the API/page level

  // Redirect to /users if already logged in and accessing /login
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/users", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/users/:path*", "/login", "/dashboard/:path*", "/unauthorized"],
};
