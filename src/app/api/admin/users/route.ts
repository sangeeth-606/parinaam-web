import { NextResponse } from "next/server";

import { canManageAccounts } from "@/lib/roles";
import { getSession } from "@/lib/session";
import { createUser, listUsers, toPublicUser } from "@/lib/store";

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  if (!canManageAccounts(session.role)) {
    return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  return NextResponse.json(listUsers().map(toPublicUser));
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    role?: "admin" | "supervisor" | "io" | "judiciary";
    department?: string;
  };

  if (!body.name || !body.email || !body.role || !body.department) {
    return NextResponse.json(
      { error: "name, email, role and department are required." },
      { status: 400 }
    );
  }

  const user = createUser({
    name: body.name,
    email: body.email,
    role: body.role,
    department: body.department,
    actor: guard.session!.name,
  });
  return NextResponse.json(toPublicUser(user), { status: 201 });
}
