import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/session";
import { queryCases } from "@/lib/store";
import type { CaseQuery } from "@/lib/types";

function parseCaseQuery(searchParams: URLSearchParams): CaseQuery {
  return {
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
    page: Number(searchParams.get("page") ?? 1) || 1,
    pageSize: Number(searchParams.get("pageSize") ?? 25) || 25,
    sort: (searchParams.get("sort") as CaseQuery["sort"]) ?? "createdAt",
    dir: (searchParams.get("dir") as CaseQuery["dir"]) ?? "desc",
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const q = parseCaseQuery(request.nextUrl.searchParams);
  // RBAC: scope applied here — field officers only ever list their own records.
  const result = queryCases(q, session);
  if (q.dir === "asc") result.items = [...result.items].reverse();
  return NextResponse.json(result);
}
