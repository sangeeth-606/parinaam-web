import { NextResponse, type NextRequest } from "next/server";

// Edge-safe auth gate: middleware only checks that a session cookie exists.
// Full HMAC verification + role checks happen in layouts/route handlers
// (node runtime) via `parseSession()` — see src/lib/auth.ts.
// HACKATHON NOTE: swap this for Supabase's @supabase/ssr session refresh
// when wiring real auth.

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/mock-image"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("parinaam_session")?.value);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
