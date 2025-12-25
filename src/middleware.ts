import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session_token";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isLoggedIn = !!token;
  const pathname = request.nextUrl.pathname;

  // Redirect to /users if already logged in and accessing /login
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/users", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login"],
};
