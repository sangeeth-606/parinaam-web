import { NextResponse } from "next/server";

import { canReview, type Role } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getCase, recordStatusChange, updateCase } from "@/lib/store";
import { CASE_STATUSES, type CaseStatus } from "@/lib/types";

// The ONLY write path for case metadata: reviewers with
// `records.change_status` (admin + supervisor) change caseStatus (and set
// panchnamaRef) through this action. Record data itself is immutable here —
// the backend owns the truth.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!canReview(session.role as Role)) {
    return NextResponse.json(
      { error: "Only supervisors and admins can change case status." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = (await request.json()) as {
    caseStatus?: CaseStatus;
    panchnamaRef?: string;
  };

  if (body.caseStatus && !CASE_STATUSES.includes(body.caseStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const before = getCase(id, session);
  if (!before) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const updated = updateCase(id, {
    caseStatus: body.caseStatus,
    panchnamaRef: body.panchnamaRef,
  });

  if (body.caseStatus && body.caseStatus !== before.caseStatus) {
    recordStatusChange(session.name, id, before.caseStatus, body.caseStatus);
  }

  return NextResponse.json(updated);
}
