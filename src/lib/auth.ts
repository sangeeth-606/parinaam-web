// ---------------------------------------------------------------------------
// Auth — mock session layer (server-only).
//
// HACKATHON NOTE: production uses Supabase Auth with TOTP MFA (see tech spec).
// Everything behind `signIn`/`getSession` is intentionally isolated behind this
// module + lib/roles.ts so the swap to Supabase (@supabase/ssr, verifyOtp,
// RLS role claims) touches only this file, lib/session.ts and middleware.ts.
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from "crypto";

import {
  ROLE_LABELS,
  can,
  canManageAccounts,
  canReview,
  type Capability,
  type Role,
  type SessionUser,
} from "./roles";

// Re-exported for server-side consumers; client components must import
// from "@/lib/roles" directly (this file imports node/next server APIs).
export { ROLE_LABELS, can, canManageAccounts, canReview };
export type { Capability, Role, SessionUser };

export const SESSION_COOKIE = "parinaam_session";

const SECRET =
  process.env.SESSION_SECRET ?? "parinaam-dev-secret-do-not-use-in-prod";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function serializeSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseSession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser;
  } catch {
    return null;
  }
}

