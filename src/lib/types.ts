// ---------------------------------------------------------------------------
// Parinaam case record — shared type definitions.
// Shape matches the backend contract in the `parinaam` repo.
// Everything except `caseStatus` and `panchnamaRef` is READ-ONLY on this end:
// the backend owns the truth; this dashboard only displays it and lets
// reviewers change status via proper actions.
// ---------------------------------------------------------------------------

export type CaseStatus = "reported" | "under_review" | "reviewed" | "escalated";

export type ClassificationOutcome =
  | "positive"
  | "negative"
  | "inconclusive";

export interface KitInfo {
  name: string;
  model: string;
  batchNo: string;
  expiry: string; // ISO date
  kitType: string;
}

export interface GpsInfo {
  lat: number;
  lon: number;
  accuracy: number; // metres
  mocked: boolean;
}

export interface ClassificationInfo {
  outcome: ClassificationOutcome;
  confidence: number; // 0..1
  deltaE: number;
  qualityFlags: string[];
}

export interface CaseRecord {
  id: string;
  createdAt: string; // ISO datetime
  operatorId: string;
  deviceId: string;
  kit: KitInfo;
  gps: GpsInfo;
  imageUrl: string;
  imageHash: string;
  classification: ClassificationInfo;
  recordHash: string;
  signature: string;
  caseStatus: CaseStatus;
  panchnamaRef?: string;
}

// Reviewer-settable fields only (submitted through actions, never edited raw)
export interface CaseStatusUpdate {
  caseStatus: CaseStatus;
  panchnamaRef?: string;
}

export const CASE_STATUSES: CaseStatus[] = [
  "reported",
  "under_review",
  "reviewed",
  "escalated",
];

export const STATUS_LABELS: Record<CaseStatus, string> = {
  reported: "Reported",
  under_review: "Under Review",
  reviewed: "Reviewed",
  escalated: "Escalated",
};

export const OUTCOME_LABELS: Record<ClassificationOutcome, string> = {
  positive: "Positive",
  negative: "Negative",
  inconclusive: "Inconclusive",
};

// Enriched record as served by the dashboard API. The core fields above come
// from the backend untouched; the enrichment fields are derived/joined by the
// API layer (mock store now, parinaam backend later) so the UI can filter by
// region / department / officer name.
export interface EnrichedCase extends CaseRecord {
  district: string; // derived from gps at ingest (backend-owned)
  department: string; // operator's department
  operatorName: string; // operator display name
}

export interface CaseQuery {
  search?: string;
  status?: CaseStatus | "all";
  outcome?: ClassificationOutcome | "all";
  district?: string | "all";
  department?: string | "all";
  officer?: string | "all";
  kitType?: string | "all";
  batchNo?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "confidence";
  dir?: "asc" | "desc";
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

