import { NextResponse } from "next/server";

import { serializeSession } from "@/lib/auth";
import { toSessionUser } from "@/lib/to-session-user";
import { findUserByEmail, recordLogin } from "@/lib/store";

// HACKATHON NOTE: replace with Supabase Auth (`signInWithPassword` + TOTP
// `verifyOtp` for MFA) — this handler is the only place that knows about
// mock passwords.
export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }
  if (user.status === "pending") {
    return NextResponse.json(
      { error: "Account awaiting admin approval." },
      { status: 403 }
    );
  }
  if (user.status === "suspended") {
    return NextResponse.json(
      { error: "Account suspended. Contact your administrator." },
      { status: 403 }
    );
  }

  recordLogin(user, "10.4.0.1");

  const response = NextResponse.json({ user: toSessionUser(user) });
  response.cookies.set("parinaam_session", serializeSession(toSessionUser(user)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h shift
  });
  return response;
}
