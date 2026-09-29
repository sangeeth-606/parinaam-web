// ---------------------------------------------------------------------------
// Parinaam case record — shared type definitions.
// Shape matches the authoritative database schema and backend contract in `parinaam-app`.
// Complies with Rule 10(2) of NDPS Rules, 2022 and Section 63 Bharatiya Sakshya Adhiniyam, 2023.
// ---------------------------------------------------------------------------

export type CaseStatus =
  | "reported"
  | "under_review"
  | "reviewed"
  | "escalated"
  | "REPORTED"
  | "UNDER_REVIEW"
  | "REVIEWED"
  | "ESCALATED";

export type ClassificationOutcome =
  | "CONSISTENT_WITH_REAGENT_POSITIVE"
  | "CONSISTENT_WITH_REAGENT_NEGATIVE"
  | "INCONCLUSIVE"
  | "positive"
  | "negative"
  | "inconclusive";

export interface KitInfo {
  name: string;
  model: string;
  batchNo: string;
  expiry: string; // ISO date, or "Not recorded"
  kitType: string;
}

export type GpsSource =
  | "DEVICE_GPS"
  | "CELL_TOWER_APPROXIMATE"
  | "USER_ESTIMATED"
  | string;

export interface GpsInfo {
  /**
   * False when the device captured no usable position. Consumers MUST render an
   * explicit "position unavailable" state rather than defaulting to 0,0 or any
   * plausible-looking coordinate.
   */
  available: boolean;
  lat: number | null;
  lon: number | null;
  accuracy: number | null; // metres
  mocked: boolean;
  source?: GpsSource | null;
}

export interface ClassificationInfo {
  outcome: ClassificationOutcome;
  /** null when the device recorded no confidence value. */
  confidence: number | null; // 0..1
  /** CIE L*a*b* ΔE00 distance; null when not measured. */
  deltaE: number | null;
  qualityFlags: string[];
  reagent?: string | null;
  correctedLab?: { l: number; a: number; b: number } | null;
}

export interface CaseRecord {
  id: string;
  /** Human-facing case reference, e.g. "NCB/DZU/CR-14/2026". */
  caseRef?: string;
  createdAt: string; // ISO datetime
  operatorId: string;
  operatorName?: string;
  deviceId: string;
  kit: KitInfo;
  gps: GpsInfo;
  /** Empty string when no evidence blob is on file. */
  imageUrl: string;
  imageHash: string;
  classification: ClassificationInfo;
  recordHash: string;
  prevRecordHash?: string;
  /** sha256(prev_hash + record_hash) — the ledger chain link. */
  chainHash?: string;
  /** True for seeded demonstration records, which are not real seizures. */
  isDemo?: boolean;
  /**
   * Device integrity seal. Per Rule 6 this is a `deviceAttestation` recorded
   * by the handset — NOT a digital/PKI/e-signature, since no statutory
   * Certifying Authority backs it.
   */
  deviceAttestation?: string;
  /**
   * Security level actually achieved at capture time, as probed on device.
   * Never assert StrongBox/HardwareKeystore without a live probe (Rule 10).
   */
  deviceSecurityLevel?: "StrongBox" | "TEE" | "Software";
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

export const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  under_review: "Under Review",
  reviewed: "Reviewed",
  escalated: "Escalated",
  REPORTED: "Reported",
  UNDER_REVIEW: "Under Review",
  REVIEWED: "Reviewed",
  ESCALATED: "Escalated",
};

export const OUTCOME_LABELS: Record<string, string> = {
  CONSISTENT_WITH_REAGENT_POSITIVE: "Consistent With Reagent Positive",
  CONSISTENT_WITH_REAGENT_NEGATIVE: "Consistent With Reagent Negative",
  INCONCLUSIVE: "Inconclusive",
  positive: "Consistent With Reagent Positive",
  negative: "Consistent With Reagent Negative",
  inconclusive: "Inconclusive",
};

// Enriched record as served by the dashboard API.
export interface EnrichedCase extends CaseRecord {
  district: string; // derived from gps / posting station
  department: string; // operator's department / NCB zone
  operatorName: string; // operator display name
}

export interface CaseQuery {
  search?: string;
  status?: string | "all";
  outcome?: string | "all";
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
