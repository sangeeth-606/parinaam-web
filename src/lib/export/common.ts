// Shared export helpers: turn a URLSearchParams filter into the matching case
// set (used by every export route), and provide a common filename builder.
//
// RBAC: this is the single gate for all four export formats —
//   * 401 when there is no valid session,
//   * 403 when the role lacks `records.export_court`,
//   * record scope applied via queryCases(viewer), so field officers can
//     only ever export their own records (missing/foreign ids and empty
//     filtered sets are indistinguishable — no existence probing).

import { NextResponse } from "next/server";

import { can, type SessionUser } from "@/lib/roles";
import { getSession } from "@/lib/session";
import { queryCases } from "@/lib/store";
import type { CaseQuery, EnrichedCase } from "@/lib/types";

const EXPORT_CAP = 5000;

export type CasesForExport =
  | { ok: true; session: SessionUser; cases: EnrichedCase[]; caseId?: string }
  | { ok: false; response: NextResponse };

export async function casesForExport(
  searchParams: URLSearchParams
): Promise<CasesForExport> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      ),
    };
  }
  if (!can(session.role, "records.export_court")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your role cannot export court bundles." },
        { status: 403 }
      ),
    };
  }

  const caseId = searchParams.get("caseId") ?? undefined;
  if (caseId) {
    return {
      ok: true,
      session,
      caseId,
      cases: queryCases({ search: caseId, pageSize: 1 }, session).items,
    };
  }

  const q: CaseQuery = {
    search: searchParams.get("search") ?? undefined,
    status: (searchParams.get("status") as CaseQuery["status"]) ?? undefined,
    outcome: (searchParams.get("outcome") as CaseQuery["outcome"]) ?? undefined,
    district: searchParams.get("district") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    officer: searchParams.get("officer") ?? undefined,
    kitType: searchParams.get("kitType") ?? undefined,
    batchNo: searchParams.get("batchNo") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: 1,
    pageSize: EXPORT_CAP,
  };
  return { ok: true, session, cases: queryCases(q, session).items };
}

export function exportFilename(ext: string, caseId?: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return caseId
    ? `parinaam-${caseId}-${stamp}.${ext}`
    : `parinaam-cases-${stamp}.${ext}`;
}
