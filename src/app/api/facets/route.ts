import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { distinctFacets } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  // RBAC: facet lists are scoped too — field officers only see values from
  // their own corpus, so the filter dropdowns can't leak unit-wide data.
  return NextResponse.json(distinctFacets(session));
}
