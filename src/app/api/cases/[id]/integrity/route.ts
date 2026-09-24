import { NextResponse } from "next/server";

import { can, type Capability, type Role } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { recordIntegrity, verifyIntegrity } from "@/lib/store";

// RBAC surface for `records.recompute_integrity` (field officer ✓):
// re-derive the sealed record hash, compare against the stored value and
// audit the attempt. Lookup is scope-filtered, so a field officer can only
// ever recompute their own records — foreign ids 404 like missing ones.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const required: Capability = "records.recompute_integrity";
  if (!can(session.role as Role, required)) {
    return NextResponse.json(
      { error: "Your role cannot recompute record integrity." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const result = verifyIntegrity(id, session);
  if (!result) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  recordIntegrity(session.name, id, result.ok);

  return NextResponse.json({
    caseId: id,
    ok: result.ok,
    stored: result.stored,
    recomputed: result.recomputed,
  });
}

// Records are sealed: there is no PATCH/DELETE surface for record data —
// `records.edit_sealed` is granted to no role (see lib/roles.ts); the only
// writable fields remain caseStatus/panchnamaRef behind
// `records.change_status` (admin + supervisor only), in status/route.ts.