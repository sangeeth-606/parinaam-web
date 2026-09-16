// Server-side session accessor (node runtime). Thin wrapper over lib/auth
// so pages/route handlers read the current user in one call.

import { cookies } from "next/headers";

import { parseSession, SESSION_COOKIE, type SessionUser } from "./auth";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return parseSession(store.get(SESSION_COOKIE)?.value);
}
