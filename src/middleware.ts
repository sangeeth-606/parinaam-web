import { NextResponse, type NextRequest } from "next/server";

// Only the login screen and the auth endpoints are reachable without a session.
// Everything else — including /api/blobs/* evidence photos — requires a cookie.
// NOTE: this is a presence check only; full HMAC verification and role checks
// happen in layouts/route handlers (node runtime) via `parseSession()`.

const PUBLIC_PATHS = ["/login", "/api/auth"];

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
