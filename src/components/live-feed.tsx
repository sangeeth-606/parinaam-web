"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Radio, RefreshCw, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface LiveSnapshot {
  maxSeq: number;
  total: number;
  byStatus: {
    reported: number;
    under_review: number;
    reviewed: number;
    escalated: number;
  };
}

const POLL_MS = 15_000;

/**
 * Watches the shared ledger for newly sealed field tests and surfaces a prompt
 * when the corpus grows. Polls `/api/live`, which is itself session-scoped, so
 * a field officer is only ever told about their own submissions.
 *
 * Deliberately does NOT auto-refresh the page: a reviewer mid-decision must
 * not have the record under them change underneath. The banner offers an
 * explicit, user-initiated refresh instead.
 */
export function LiveFeed({ initialTotal }: { initialTotal: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<"connecting" | "live" | "offline">(
    "connecting"
  );
  const [newRecords, setNewRecords] = useState(0);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  // Held in refs so the interval callback never closes over a stale count.
  const baselineRef = useRef<number>(initialTotal);
  const primedRef = useRef(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as LiveSnapshot;

      if (!primedRef.current) {
        // The first successful response establishes the baseline rather than
        // reporting every pre-existing record as "new".
        baselineRef.current = data.total;
        primedRef.current = true;
        setNewRecords(0);
      } else if (data.total > baselineRef.current) {
        setNewRecords((n) => n + (data.total - baselineRef.current));
      } else if (data.total < baselineRef.current) {
        // Records were removed upstream; resync silently.
        setNewRecords(0);
      }
      baselineRef.current = data.total;

      setStatus("live");
      setLastChecked(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void poll();
    const id = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  function refresh() {
    setNewRecords(0);
    baselineRef.current = 0;
    primedRef.current = false;
    router.refresh();
    void poll();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {newRecords > 0 && (
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-2 rounded-md border border-gold-deep/60 bg-gold/20 px-3 py-1.5 text-xs font-medium text-navy-deep transition-colors hover:bg-gold/35"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {newRecords} new field record{newRecords === 1 ? "" : "s"} sealed —
          click to refresh
        </button>
      )}

      <span
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        title={
          status === "live"
            ? `Polling the shared ledger every ${POLL_MS / 1000}s. Last checked ${lastChecked}.`
            : status === "offline"
              ? "The dashboard cannot reach the database. Figures below may be stale."
              : "Connecting to the shared ledger…"
        }
      >
        {status === "live" ? (
          <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
        ) : status === "offline" ? (
          <WifiOff className="h-3.5 w-3.5 text-red-600" />
        ) : (
          <Radio className="h-3.5 w-3.5 animate-pulse text-muted-foreground" />
        )}
        {status === "live"
          ? `Live · checked ${lastChecked}`
          : status === "offline"
            ? "Live feed offline"
            : "Connecting…"}
      </span>
    </div>
  );
}