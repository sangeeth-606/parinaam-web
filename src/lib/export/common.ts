// Shared export helpers: turn a URLSearchParams filter into the matching case
// set (used by every export route), and provide a common filename builder.

import { queryCases } from "@/lib/store";
import type { CaseQuery, EnrichedCase } from "@/lib/types";

const EXPORT_CAP = 5000;

export function casesForExport(searchParams: URLSearchParams): {
  cases: EnrichedCase[];
  caseId?: string;
} {
  const caseId = searchParams.get("caseId") ?? undefined;
  if (caseId) {
    return { caseId, cases: queryCases({ search: caseId, pageSize: 1 }).items };
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
  return { cases: queryCases(q).items };
}

export function exportFilename(ext: string, caseId?: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return caseId
    ? `parinaam-${caseId}-${stamp}.${ext}`
    : `parinaam-cases-${stamp}.${ext}`;
}
