// Aggregations over the case corpus, shared by the dashboard home and the
// analytics page. Reads live data from Supabase.

import { allCases } from "./store";
import type { SessionUser } from "./roles";

import type { DailyPoint } from "@/components/charts";

export interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byOutcome: Record<string, number>;
  mockedGps: number;
  avgConfidence: number;
  last14Days: DailyPoint[];
  topDistricts: { district: string; cases: number; positive: number }[];
  mapPoints: { id: string; lat: number; lon: number; outcome: string; cluster: string }[];
  // --- Derived review metrics (all computed from the live corpus) ---
  /** Share of records consistent with a reagent positive, 0..1. */
  presumptivePositiveRate: number;
  /** Records that reached a terminal review state (reviewed / escalated). */
  closedCount: number;
  /** Share of records still awaiting a reviewer decision, 0..1. */
  openReviewRate: number;
  /** Records that captured no GPS fix at all (never plotted on the map). */
  noGpsCount: number;
  /** Median hours from capture to the case's last record, 0..1. */
  medianReviewLatencyHours: number;
  /** True when the corpus is entirely seeded demonstration data. */
  isDemoOnly: boolean;
  /** Number of demo-flagged records in the corpus. */
  demoCount: number;
}

export async function computeStats(viewer?: SessionUser): Promise<Stats> {
  const cases = await allCases(viewer);

  const byStatus: Record<string, number> = {
    reported: 0,
    under_review: 0,
    reviewed: 0,
    escalated: 0,
  };
  const byOutcome: Record<string, number> = {
    positive: 0,
    negative: 0,
    inconclusive: 0,
  };
  let mockedGps = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const c of cases) {
    const s = (c.caseStatus || "reported").toLowerCase();
    if (byStatus[s] !== undefined) {
      byStatus[s]++;
    } else {
      byStatus.reported++;
    }

    const o = c.classification.outcome;
    if (o === "CONSISTENT_WITH_REAGENT_POSITIVE" || o === "positive") {
      byOutcome.positive++;
    } else if (o === "CONSISTENT_WITH_REAGENT_NEGATIVE" || o === "negative") {
      byOutcome.negative++;
    } else {
      byOutcome.inconclusive++;
    }

    if (c.gps.mocked) mockedGps++;
    if (c.classification.confidence !== null) {
      confidenceSum += c.classification.confidence;
      confidenceCount++;
    }
  }

  // last 14 days daily buckets
  const dayMs = 24 * 3600 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<string, DailyPoint>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      total: 0,
      positive: 0,
      negative: 0,
      inconclusive: 0,
    });
  }

  const districtCounts = new Map<string, { total: number; positive: number }>();

  for (const c of cases) {
    const key = c.createdAt.slice(0, 10);
    const b = buckets.get(key);
    const isPos = c.classification.outcome === "CONSISTENT_WITH_REAGENT_POSITIVE" || c.classification.outcome === "positive";
    const isNeg = c.classification.outcome === "CONSISTENT_WITH_REAGENT_NEGATIVE" || c.classification.outcome === "negative";

    if (b) {
      b.total++;
      if (isPos) b.positive++;
      else if (isNeg) b.negative++;
      else b.inconclusive++;
    }

    const d = districtCounts.get(c.district) ?? { total: 0, positive: 0 };
    d.total++;
    if (isPos) d.positive++;
    districtCounts.set(c.district, d);
  }

  const topDistricts = Array.from(districtCounts.entries())
    .map(([district, v]) => ({ district, cases: v.total, positive: v.positive }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 8);

  // Only records that actually carry a position belong on the map — a record
  // with no captured GPS must not be plotted at a fabricated coordinate.
  const mapPoints = cases
    .filter(
      (c) =>
        c.gps.available &&
        typeof c.gps.lat === "number" &&
        typeof c.gps.lon === "number"
    )
    .map((c) => ({
      id: c.id,
      lat: c.gps.lat as number,
      lon: c.gps.lon as number,
      outcome: c.classification.outcome as string,
      cluster: c.district,
    }));

  // --- Derived review metrics -----------------------------------------------

  const presumptivePositiveRate = cases.length
    ? byOutcome.positive / cases.length
    : 0;

  const closedCount = cases.filter((c) => {
    const s = (c.caseStatus || "").toLowerCase();
    return s === "reviewed" || s === "escalated";
  }).length;
  const openReviewRate = cases.length ? (cases.length - closedCount) / cases.length : 0;

  const noGpsCount = cases.filter((c) => !c.gps.available).length;

  // Review latency: elapsed hours from the first capture in each case to its
  // most recent record. Cases with a single record are excluded — measuring a
  // record against itself would report a meaningless 0.
  const caseSpanHours: number[] = [];
  const byCase = new Map<string, number[]>();
  for (const c of cases) {
    const key = c.caseRef ?? c.id;
    const t = Date.parse(c.createdAt);
    if (Number.isNaN(t)) continue;
    const arr = byCase.get(key) ?? [];
    arr.push(t);
    byCase.set(key, arr);
  }
  for (const times of byCase.values()) {
    if (times.length < 2) continue;
    const span = (Math.max(...times) - Math.min(...times)) / 3_600_000;
    if (span > 0) caseSpanHours.push(span);
  }
  caseSpanHours.sort((a, b) => a - b);
  const medianReviewLatencyHours = caseSpanHours.length
    ? caseSpanHours[Math.floor(caseSpanHours.length / 2)]
    : 0;

  const demoCount = cases.filter((c) => c.isDemo).length;

  return {
    total: cases.length,
    byStatus,
    byOutcome,
    mockedGps,
    avgConfidence: confidenceCount ? confidenceSum / confidenceCount : 0,
    last14Days: Array.from(buckets.values()),
    topDistricts,
    mapPoints,
    presumptivePositiveRate,
    closedCount,
    openReviewRate,
    noGpsCount,
    medianReviewLatencyHours,
    isDemoOnly: cases.length > 0 && demoCount === cases.length,
    demoCount,
  };
}
