import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getCase } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;
  // RBAC: scoped lookup — a foreign record 404s exactly like a missing one.
  const record = getCase(id, session);
  if (!record) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }
  return NextResponse.json(record);
}
