// ---------------------------------------------------------------------------
// Deterministic mock dataset — stands in for the `parinaam` backend during the
// hackathon. Seeded PRNG so every server restart produces the same corpus,
// which keeps tests, exports and screenshots stable.
// ---------------------------------------------------------------------------

import { createHash } from "crypto";
import type {
  CaseRecord,
  CaseStatus,
  ClassificationOutcome,
  EnrichedCase,
} from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sha = (input: string) =>
  createHash("sha256").update(input).digest("hex");

/**
 * Canonical record-hash derivation. Kept next to the generator so the
 * "recompute integrity" action (RBAC: records.recompute_integrity) always
 * agrees with what was sealed at ingest. Backend owns this in production.
 */
export function deriveRecordHash(id: string): string {
  return sha(`record:${id}`);
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "supervisor" | "io" | "judiciary";
  department: string;
  status: "active" | "pending" | "suspended";
  createdAt: string;
  lastLoginAt?: string;
  password: string; // mock-only; Supabase Auth owns this in production
}

const DISTRICTS: { name: string; lat: number; lon: number }[] = [
  { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { name: "Jodhpur", lat: 26.2389, lon: 73.0243 },
  { name: "Udaipur", lat: 24.5854, lon: 73.7125 },
  { name: "Kota", lat: 25.2138, lon: 75.8648 },
  { name: "Ajmer", lat: 26.4499, lon: 74.6399 },
  { name: "Bikaner", lat: 28.0229, lon: 73.3119 },
  { name: "Alwar", lat: 27.5525, lon: 76.6265 },
  { name: "Bharatpur", lat: 27.2152, lon: 77.503 },
  { name: "Sri Ganganagar", lat: 29.9038, lon: 73.8772 },
  { name: "Barmer", lat: 25.7524, lon: 71.3967 },
];

const OFFICERS: { name: string; department: string }[] = [
  { name: "R. Meena", department: "Excise Department" },
  { name: "S. Choudhary", department: "Excise Department" },
  { name: "A. Sharma", department: "Police Department" },
  { name: "V. Singh Rathore", department: "Police Department" },
  { name: "P. Yadav", department: "Police Department" },
  { name: "M. Khan", department: "Customs (Preventive)" },
  { name: "D. Vyas", department: "Forest Department" },
  { name: "K. Bishnoi", department: "Forest Department" },
];

const KITS: { name: string; model: string; kitType: string }[] = [
  { name: "NDPS Field Kit — Cannabis", model: "FK-CAN-12", kitType: "Cannabis / Ganja" },
  { name: "NDPS Field Kit — Opiates", model: "FK-OPA-08", kitType: "Opiates / Heroin" },
  { name: "NDPS Field Kit — Cocaine", model: "FK-COC-06", kitType: "Cocaine" },
  { name: "NDPS Field Kit — Amphetamine", model: "FK-AMP-10", kitType: "Amphetamine / MDMA" },
  { name: "NDPS Field Kit — Barbiturates", model: "FK-BAR-05", kitType: "Barbiturates" },
];

const QUALITY_FLAGS = [
  "LOW_LIGHT",
  "GLARE_DETECTED",
  "POOR_FOCUS",
  "STRIP_MISALIGNED",
  "COLOR_CHECK_PASSED",
];

const STATUS_WEIGHTS: [CaseStatus, number][] = [
  ["reported", 0.45],
  ["under_review", 0.25],
  ["reviewed", 0.25],
  ["escalated", 0.05],
];

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function weighted<T>(rnd: () => number, pairs: readonly [T, number][]): T {
  const r = rnd();
  let acc = 0;
  for (const [value, weight] of pairs) {
    acc += weight;
    if (r <= acc) return value;
  }
  return pairs[pairs.length - 1][0];
}

export const CORPUS_SIZE = 1200;

export function generateCases(): EnrichedCase[] {
  const rnd = mulberry32(20260916);
  const now = Date.now();
  const cases: EnrichedCase[] = [];

  for (let i = 0; i < CORPUS_SIZE; i++) {
    const kit = pick(rnd, KITS);
    const officer = pick(rnd, OFFICERS);
    const district = pick(rnd, DISTRICTS);
    const createdAt = new Date(
      now -
        Math.floor(rnd() * 120) * 24 * 3600 * 1000 -
        Math.floor(rnd() * 24 * 3600 * 1000)
    );
    const id = `NDPS-${100000 + i}`;
    const outcome: ClassificationOutcome = weighted(
      rnd,
      [
        ["positive", 0.38],
        ["negative", 0.5],
        ["inconclusive", 0.12],
      ] as [ClassificationOutcome, number][]
    );
    const confidence =
      outcome === "inconclusive" ? 0.55 + rnd() * 0.25 : 0.78 + rnd() * 0.21;
    const deltaE = outcome === "inconclusive" ? 8 + rnd() * 14 : 1.5 + rnd() * 6;
    const qualityFlags: string[] = [];
    if (rnd() < 0.12) qualityFlags.push(pick(rnd, QUALITY_FLAGS));
    if (rnd() < 0.03) qualityFlags.push("LOW_LIGHT");

    const imageSeed = sha(`img:${id}`).slice(0, 12);
    const record: CaseRecord = {
      id,
      createdAt: createdAt.toISOString(),
      operatorId: `OPS-${1000 + OFFICERS.indexOf(officer)}`,
      deviceId: `DEV-${sha(id).slice(0, 6).toUpperCase()}`,
      kit: {
        name: kit.name,
        model: kit.model,
        batchNo: `BATCH-${2025 + (i % 2)}-${String(100 + (i % 40)).padStart(4, "0")}`,
        expiry: new Date(2026, 8 + (i % 6), 28).toISOString().slice(0, 10),
        kitType: kit.kitType,
      },
      gps: {
        lat: district.lat + (rnd() - 0.5) * 0.18,
        lon: district.lon + (rnd() - 0.5) * 0.18,
        accuracy: Number((4 + rnd() * 26).toFixed(1)),
        mocked: rnd() < 0.015,
      },
      imageUrl: `/api/mock-image?seed=${imageSeed}`,
      imageHash: sha(`image:${id}`),
      classification: {
        outcome,
        confidence: Number(confidence.toFixed(4)),
        deltaE: Number(deltaE.toFixed(2)),
        qualityFlags,
      },
      recordHash: deriveRecordHash(id),
      signature: sha(`sig:${id}:${i}`),
      caseStatus: weighted(rnd, STATUS_WEIGHTS),
    };

    if (rnd() < 0.3) {
      record.panchnamaRef = `PN/${createdAt.getFullYear()}/${district.name.slice(0, 3).toUpperCase()}/${3000 + i}`;
    }

    cases.push({
      ...record,
      district: district.name,
      department: officer.department,
      operatorName: officer.name,
    });
  }

  return cases.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const DEMO_USERS: MockUser[] = [
  { id: "u-001", name: "Admin Control", email: "admin@parinaam.gov.in", role: "admin", department: "NCB — Zonal Unit", status: "active", createdAt: "2026-07-01T09:00:00.000Z", password: "admin123" },
  { id: "u-002", name: "Supervisor Sharma", email: "supervisor@parinaam.gov.in", role: "supervisor", department: "Excise Department", status: "active", createdAt: "2026-07-02T09:00:00.000Z", password: "supervisor123" },
  { id: "u-003", name: "A. Sharma", email: "io@parinaam.gov.in", role: "io", department: "Police Department", status: "active", createdAt: "2026-07-03T09:00:00.000Z", password: "io123" },
  { id: "u-004", name: "Magistrate Rao", email: "judiciary@parinaam.gov.in", role: "judiciary", department: "District Court", status: "active", createdAt: "2026-07-04T09:00:00.000Z", password: "judiciary123" },
  { id: "u-005", name: "Officer Nair", email: "nair@parinaam.gov.in", role: "io", department: "Customs (Preventive)", status: "pending", createdAt: "2026-09-10T09:00:00.000Z", password: "nair123" },
  { id: "u-006", name: "Judge Iyer", email: "iyer@parinaam.gov.in", role: "judiciary", department: "Sessions Court", status: "pending", createdAt: "2026-09-12T09:00:00.000Z", password: "iyer123" },
];

export function generateUsers(): MockUser[] {
  return DEMO_USERS.map((u) => ({ ...u }));
}

