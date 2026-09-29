import { NextResponse } from "next/server";

import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordScope, type Role } from "@/lib/roles";

/**
 * Lightweight "what's new" probe backing the dashboard's live feed.
 *
 * Why polling rather than the app's SSE (`/api/v1/stream`): that endpoint
 * authenticates with a bearer token minted by the mobile app. Handing a
 * long-lived token to a browser so it can hold an EventSource would defeat
 * the token's purpose, and the app server is not guaranteed to be running.
 * Polling the shared Supabase database keeps the dashboard self-contained and
 * works whether or not the mobile backend is up.
 *
 * Returns the newest ledger sequence and a per-status count snapshot. The
 * client compares consecutive responses to decide whether to surface a toast.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // A field officer only ever learns about their OWN submissions, so the
  // probe is scoped exactly like the case list.
  const ownOnly = recordScope(session.role as Role) === "own";
  const officerCode = session.officerCode ?? null;

  try {
    const row = await queryOne<{
      max_seq: number | null;
      total: number;
      reported: number;
      under_review: number;
      reviewed: number;
      escalated: number;
    }>(
      `SELECT
         MAX(seq)::int           AS max_seq,
         COUNT(*)::int           AS total,
         COUNT(*) FILTER (WHERE COALESCE(c.case_status,'REPORTED') = 'REPORTED')::int    AS reported,
         COUNT(*) FILTER (WHERE COALESCE(c.case_status,'REPORTED') = 'UNDER_REVIEW')::int AS under_review,
         COUNT(*) FILTER (WHERE COALESCE(c.case_status,'REPORTED') = 'REVIEWED')::int    AS reviewed,
         COUNT(*) FILTER (WHERE COALESCE(c.case_status,'REPORTED') = 'ESCALATED')::int   AS escalated
       FROM field_test ft
       LEFT JOIN cases c ON ft.case_ref = c.case_ref
       ${ownOnly ? "WHERE ft.officer_code = $1 OR ft.operator_id = $1" : ""};`,
      ownOnly ? [officerCode] : []
    );

    return NextResponse.json(
      {
        maxSeq: row?.max_seq ?? 0,
        total: row?.total ?? 0,
        byStatus: {
          reported: row?.reported ?? 0,
          under_review: row?.under_review ?? 0,
          reviewed: row?.reviewed ?? 0,
          escalated: row?.escalated ?? 0,
        },
        scopedToOwnRecords: ownOnly,
        at: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error reading live feed state:", error);
    return NextResponse.json(
      { error: "Live feed state unavailable." },
      { status: 503 }
    );
  }
}