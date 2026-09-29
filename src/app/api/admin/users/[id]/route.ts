import { NextResponse } from "next/server";

import { canManageAccounts } from "@/lib/roles";
import { getSession } from "@/lib/session";
import { setUserStatus } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!canManageAccounts(session.role)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { id } = await params;
  const { status } = (await request.json()) as {
    status: "active" | "suspended";
  };

  const user = await setUserStatus(id, status, session.name);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json(user);
}
