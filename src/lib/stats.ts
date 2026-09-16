// Aggregations over the case corpus, shared by the dashboard home and the
// analytics page. In production these become backend aggregation endpoints.

import { allCases } from "./store";
import type { CaseStatus, ClassificationOutcome, EnrichedCase } from "./types";
import type { DailyPoint } from "@/components/charts";

export interface Stats {
  total: number;
  byStatus: Record<CaseStatus, number>;
  byOutcome: Record<ClassificationOutcome, number>;
  mockedGps: number;
  avgConfidence: number;
  last14Days: DailyPoint[];
  topDistricts: { district: string; cases: number; positive: number }[];
  mapPoints: { id: string; lat: number; lon: number; outcome: string }[];
}

export function computeStats(): Stats {
  const cases = allCases();

  const byStatus: Record<CaseStatus, number> = {
    reported: 0,
    under_review: 0,
    reviewed: 0,
    escalated: 0,
  };
  const byOutcome: Record<ClassificationOutcome, number> = {
    positive: 0,
    negative: 0,
    inconclusive: 0,
  };
  let mockedGps = 0;
  let confidenceSum = 0;

  for (const c of cases) {
    byStatus[c.caseStatus]++;
    byOutcome[c.classification.outcome]++;
    if (c.gps.mocked) mockedGps++;
    confidenceSum += c.classification.confidence;
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
  for (const c of cases) {
    const key = c.createdAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.total++;
      bucket[c.classification.outcome]++;
    }
  }

  // district aggregation
  const districtMap = new Map<string, { cases: number; positive: number }>();
  for (const c of cases) {
    const entry = districtMap.get(c.district) ?? { cases: 0, positive: 0 };
    entry.cases++;
    if (c.classification.outcome === "positive") entry.positive++;
    districtMap.set(c.district, entry);
  }
  const topDistricts = [...districtMap.entries()]
    .map(([district, v]) => ({ district, ...v }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 8);

  const mapPoints = cases
    .slice(0, 800) // keep the map light
    .map((c: EnrichedCase) => ({
      id: c.id,
      lat: c.gps.lat,
      lon: c.gps.lon,
      outcome: c.classification.outcome,
    }));

  return {
    total: cases.length,
    byStatus,
    byOutcome,
    mockedGps,
    avgConfidence: cases.length ? confidenceSum / cases.length : 0,
    last14Days: [...buckets.values()],
    topDistricts,
    mapPoints,
  };
}
