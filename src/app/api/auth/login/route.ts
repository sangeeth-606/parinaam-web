import { NextResponse } from "next/server";

import { serializeSession } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { verifyScryptPassword } from "@/lib/password";
import { normalizeRole, type SessionUser } from "@/lib/roles";

/** Shape of the `officers` columns this route reads. */
interface LoginOfficer {
  id: number;
  officer_code: string | null;
  username: string | null;
  display_name: string | null;
  role: string | null;
  status: string | null;
  pass_salt: string | null;
  pass_hash: string | null;
  department: string | null;
  unit: string | null;
  official_email: string | null;
  failed_attempts: number | null;
  locked_until: string | null;
}

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const identifier = (email || "").trim().toLowerCase();
  const rawPass = password || "";

  if (!identifier || !rawPass) {
    return NextResponse.json(
      { error: "Username/Email and password are required." },
      { status: 400 }
    );
  }

  // Look up officer by username or official email.
  const username = identifier.includes("@") ? identifier.split("@")[0] : identifier;
  const officer = await queryOne<LoginOfficer>(
    `SELECT id, officer_code, username, display_name, role, status, pass_salt, pass_hash,
            department, unit, official_email, failed_attempts, locked_until
     FROM officers
     WHERE LOWER(username) = $1 OR LOWER(official_email) = $2
     LIMIT 1;`,
    [username, identifier]
  );

  if (!officer) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const status = (officer.status || "").toUpperCase();
  if (status === "PENDING") {
    return NextResponse.json(
      { error: "Account awaiting admin approval." },
      { status: 403 }
    );
  }
  if (status === "SUSPENDED") {
    return NextResponse.json(
      { error: "Account suspended. Contact your administrator." },
      { status: 403 }
    );
  }

  // Progressive lockout after repeated failures, mirroring parinaam-app's
  // server-side policy so both front doors behave identically.
  if (officer.locked_until && new Date(officer.locked_until) > new Date()) {
    return NextResponse.json(
      {
        error: `Account temporarily locked after repeated failed sign-ins. Try again after ${officer.locked_until}.`,
      },
      { status: 423 }
    );
  }

  const passwordValid = await verifyScryptPassword(
    rawPass,
    officer.pass_salt ?? "",
    officer.pass_hash ?? ""
  );

  if (!passwordValid) {
    const attempts = (officer.failed_attempts ?? 0) + 1;
    // 5 strikes → 15 minute lock.
    const lockUntil =
      attempts >= 5
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;
    await query(
      `UPDATE officers
       SET failed_attempts = $1,
           locked_until = $2::timestamptz
       WHERE id = $3;`,
      [attempts, lockUntil, officer.id]
    ).catch(() => {});

    await query(
      `INSERT INTO server_audit (officer_code, actor, action, subject, at, detail)
       VALUES ($1, $2, 'login_failed', $3, NOW(), $4);`,
      [
        officer.officer_code,
        officer.username,
        String(officer.id),
        lockUntil
          ? `Failed sign-in; account locked until ${lockUntil}`
          : `Failed sign-in (attempt ${attempts} of 5)`,
      ]
    ).catch(() => {});

    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Successful sign-in: clear the failure counter and stamp last_login_at.
  await query(
    `UPDATE officers SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW()
     WHERE id = $1;`,
    [officer.id]
  ).catch(() => {});

  // Append-only audit trail of the authenticated session.
  await query(
    `INSERT INTO server_audit (officer_code, actor, action, subject, at, detail)
     VALUES ($1, $2, 'login', $3, NOW(), 'Web dashboard session authenticated')`,
    [officer.officer_code, officer.username, String(officer.id)]
  ).catch(() => {});

  const sessionUser: SessionUser = {
    id: String(officer.id),
    name: officer.display_name ?? officer.username ?? "Officer",
    email: officer.official_email || `${officer.username}@parinaam.gov.in`,
    role: normalizeRole(officer.role ?? ""),
    department: officer.department || officer.unit || "Unassigned",
    officerCode: officer.officer_code ?? undefined,
  };

  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set("parinaam_session", serializeSession(sessionUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hour duty shift
  });

  return response;
}
