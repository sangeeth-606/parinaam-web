// ---------------------------------------------------------------------------
// Supabase-backed Data Store for Parinaam Web.
// Reads and writes directly to the shared cloud Supabase PostgreSQL database.
// Complies with Rule 10(2) of NDPS Rules, 2022 and Section 63 BSA, 2023.
// ---------------------------------------------------------------------------

import { createHash, randomBytes } from "node:crypto";

import { query, queryOne } from "./db";
import { hashPassword } from "./password";
import { can, ownsRecord, type SessionUser } from "./roles";
import type {
  CaseQuery,
  CaseStatus,
  ClassificationOutcome,
  EnrichedCase,
  Paginated,
} from "./types";

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  kind:
    | "login"
    | "account_created"
    | "account_approved"
    | "status_change"
    | "export"
    | "integrity";
  detail: string;
  caseId?: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  officerCode?: string;
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** A raw `field_test` row joined with its `cases` review state. */
interface CaseRow {
  seq: number;
  record_uuid: string;
  officer_code: string | null;
  case_ref: string | null;
  package_no: string | null;
  operator_id: string | null;
  operator_name: string | null;
  outcome: string | null;
  confidence: number | null;
  reagent: string | null;
  kit_type: string | null;
  kit_batch: string | null;
  region: string | null;
  department: string | null;
  location_label: string | null;
  created_at: string | null;
  payload_jcs: string | null;
  record_hash: string | null;
  prev_hash: string | null;
  chain_hash: string | null;
  device_attestation: string | null;
  image_sha256: string | null;
  is_demo: boolean | null;
  case_status: string | null;
  panchnama_ref: string | null;
  case_region: string | null;
  case_dept: string | null;
  case_location_label: string | null;
}

/** The sealed JCS payload, as written by the mobile app at capture time. */
interface SealedPayload {
  outcome?: string;
  operator_name?: string;
  created_at?: string;
  image_sha256?: string;
  is_demo?: boolean;
  lot_no?: string;
  reagent?: string;
  device_id?: string;
  device_attestation?: string;
  device_security_level?: string;
  delta_e_00?: number;
  conformal_set?: string[];
  corrected_lab?: { l: number; a: number; b: number };
  gps?: {
    lat?: number;
    lon?: number;
    accuracy_m?: number;
    mocked?: boolean;
    source?: string;
  };
  kit?: {
    lot_no?: string;
    test_name?: string;
    make?: string;
    expiry?: string;
  };
}

function rowToEnrichedCase(row: CaseRow): EnrichedCase {
  let p: SealedPayload = {};
  if (row.payload_jcs) {
    try {
      p = JSON.parse(row.payload_jcs) as SealedPayload;
    } catch {
      p = {};
    }
  }

  const recordUuid = row.record_uuid || `REC-${row.seq}`;
  const caseRef = row.case_ref || "UNASSIGNED";
  const caseStatus = (row.case_status || "REPORTED") as CaseStatus;
  // Trilevel vocabulary only. Anything unrecognised is INCONCLUSIVE by
  // construction — never coerce an unknown value into a positive result.
  const rawOutcome = String(row.outcome ?? p.outcome ?? "INCONCLUSIVE").toUpperCase();
  const outcome = TRIVEL_OUTCOMES.has(rawOutcome)
    ? (rawOutcome as ClassificationOutcome)
    : "INCONCLUSIVE";
  const operatorName = row.operator_name || p.operator_name || row.operator_id || "Unknown officer";

  // Kit facts come from the sealed payload / indexed columns only. Absent data
  // is reported as absent, never invented.
  const kitBatch = p.kit?.lot_no || p.lot_no || row.kit_batch || "Not recorded";
  const kitName = p.kit?.test_name || row.kit_type || row.reagent || "Not recorded";
  const kitMake = p.kit?.make || "Not recorded";
  const kitExpiry = p.kit?.expiry || "Not recorded";

  // GPS: the sealed payload is authoritative. If the device recorded no
  // position we surface NaN-free 0/0 with an explicit "unavailable" marker
  // rather than a plausible-looking Delhi centroid.
  const hasGps =
    typeof p.gps?.lat === "number" && typeof p.gps?.lon === "number";
  const gpsLat = hasGps ? Number(p.gps!.lat) : null;
  const gpsLon = hasGps ? Number(p.gps!.lon) : null;
  const gpsAcc = typeof p.gps?.accuracy_m === "number" ? Number(p.gps!.accuracy_m) : null;
  const gpsMock = Boolean(p.gps?.mocked ?? false);
  const gpsSrc = p.gps?.source ?? null;

  const imageHash = row.image_sha256 || p.image_sha256 || "";
  // No fabricated photo when the blob is genuinely absent — the UI renders an
  // explicit "no evidence image on file" state instead of a fake test strip.
  const imageUrl = imageHash ? `/api/blobs/${imageHash}` : "";

  return {
    id: recordUuid,
    caseRef,
    createdAt: row.created_at || p.created_at || new Date().toISOString(),
    operatorId: row.operator_id || row.officer_code || "UNKNOWN",
    operatorName,
    deviceId: p.device_id || "Not recorded",
    kit: {
      name: kitName,
      model: kitMake,
      batchNo: kitBatch,
      expiry: kitExpiry,
      kitType: row.reagent || row.kit_type || "Not recorded",
    },
    gps: {
      available: hasGps,
      lat: gpsLat,
      lon: gpsLon,
      accuracy: gpsAcc,
      mocked: gpsMock,
      source: gpsSrc,
    },
    imageUrl,
    imageHash,
    classification: {
      outcome,
      // Confidence is only meaningful when the device actually recorded one.
      confidence:
        row.confidence !== null && row.confidence !== undefined
          ? Number(row.confidence)
          : null,
      deltaE: typeof p.delta_e_00 === "number" ? Number(p.delta_e_00) : null,
      qualityFlags: Array.isArray(p.conformal_set) ? p.conformal_set : [],
      reagent: row.reagent || p.reagent || null,
      correctedLab: p.corrected_lab ?? null,
    },
    recordHash: row.record_hash || "",
    prevRecordHash: row.prev_hash || "",
    chainHash: row.chain_hash || "",
    isDemo: Boolean(row.is_demo ?? p.is_demo),
    deviceAttestation: row.device_attestation || p.device_attestation || undefined,
    // Rule 10: the achieved keystore level must be probed on-device. The web
    // dashboard has no keystore, so it reports the level the handset recorded
    // and never assumes StrongBox.
    deviceSecurityLevel: readSecurityLevel(p),
    caseStatus,
    panchnamaRef: row.panchnama_ref ?? undefined,
    district:
      row.location_label || row.case_location_label || row.region || "Unlabelled",
    department: row.department || row.case_dept || "Unassigned",
  };
}

/** The only three outcomes this system may ever display (Rule 7). */
const TRIVEL_OUTCOMES = new Set<string>([
  "CONSISTENT_WITH_REAGENT_POSITIVE",
  "CONSISTENT_WITH_REAGENT_NEGATIVE",
  "INCONCLUSIVE",
]);

type SecurityLevel = "StrongBox" | "TEE" | "Software";

/**
 * Report the keystore security level the *device* actually achieved at
 * capture time. Anything missing or unrecognised degrades to "Software",
 * the least-privileged claim — we never overstate hardware protection.
 */
function readSecurityLevel(p: SealedPayload): SecurityLevel {
  const raw = String(p.device_security_level ?? "").toLowerCase();
  if (raw.includes("strongbox")) return "StrongBox";
  if (raw.includes("tee")) return "TEE";
  return "Software";
}

// NOTE: `device_security_level` and `device_id` are NOT indexed columns on
// `field_test` — they live only inside the sealed `payload_jcs`. Selecting them
// here would raise a SQL error, so they are read from the parsed payload by
// `rowToEnrichedCase`.
const SELECT_CASE_SQL = `
  SELECT
    ft.seq, ft.record_uuid, ft.officer_code, ft.case_ref, ft.package_no,
    ft.operator_id, ft.operator_name,
    ft.outcome, ft.confidence, ft.reagent, ft.kit_type, ft.kit_batch,
    ft.region, ft.department, ft.location_label, ft.created_at, ft.payload_jcs,
    ft.record_hash, ft.prev_hash, ft.chain_hash, ft.device_attestation,
    ft.image_sha256, ft.is_demo,
    c.case_status, c.panchnama_ref, c.region as case_region,
    c.department as case_dept, c.location_label as case_location_label
  FROM field_test ft
  LEFT JOIN cases c ON ft.case_ref = c.case_ref
`;

export async function allCases(viewer?: SessionUser): Promise<EnrichedCase[]> {
  try {
    const rows = await query<CaseRow>(
    `${SELECT_CASE_SQL} ORDER BY ft.created_at DESC;`
  );
    const all = rows.map(rowToEnrichedCase);
    if (!viewer || can(viewer.role, "records.view_unit")) {
      return all;
    }
    return all.filter((c) => ownsRecord(viewer, c));
  } catch (error) {
    console.error("Error in allCases:", error);
    return [];
  }
}

export async function queryCases(
  q: CaseQuery,
  viewer?: SessionUser
): Promise<Paginated<EnrichedCase>> {
  const cases = await allCases(viewer);

  const filtered = cases.filter((record) => {
    if (q.status && q.status !== "all") {
      const match = record.caseStatus.toLowerCase() === q.status.toLowerCase();
      if (!match) return false;
    }
    if (q.outcome && q.outcome !== "all") {
      const match = record.classification.outcome.toLowerCase() === q.outcome.toLowerCase();
      if (!match) return false;
    }
    if (q.district && q.district !== "all" && record.district !== q.district) return false;
    if (q.department && q.department !== "all" && record.department !== q.department) return false;
    if (q.officer && q.officer !== "all" && record.operatorName !== q.officer) return false;
    if (q.kitType && q.kitType !== "all" && record.kit.kitType !== q.kitType) return false;
    if (q.batchNo && !record.kit.batchNo.toLowerCase().includes(q.batchNo.toLowerCase())) return false;
    if (q.from && record.createdAt < new Date(q.from).toISOString()) return false;
    if (q.to) {
      const toEnd = new Date(q.to);
      toEnd.setHours(23, 59, 59, 999);
      if (record.createdAt > toEnd.toISOString()) return false;
    }
    if (q.search) {
      const needle = q.search.toLowerCase();
      const hay = [
        record.id,
        record.operatorName,
        record.operatorId,
        record.deviceId,
        record.kit.name,
        record.kit.batchNo,
        record.kit.kitType,
        record.district,
        record.panchnamaRef ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, q.pageSize ?? 25));
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function getCase(
  id: string,
  viewer?: SessionUser
): Promise<EnrichedCase | undefined> {
  try {
    const row = await queryOne<CaseRow>(
      `${SELECT_CASE_SQL} WHERE ft.record_uuid = $1 OR ft.case_ref = $1 LIMIT 1;`,
      [id]
    );
    if (!row) return undefined;
    const record = rowToEnrichedCase(row);
    if (viewer && !can(viewer.role, "records.view_unit") && !ownsRecord(viewer, record)) {
      return undefined;
    }
    return record;
  } catch (error) {
    console.error("Error in getCase:", error);
    return undefined;
  }
}

export async function updateCase(
  id: string,
  patch: { caseStatus?: CaseStatus; panchnamaRef?: string },
  actor = "System"
): Promise<EnrichedCase | undefined> {
  const current = await getCase(id);
  if (!current) return undefined;

  try {
    // Find case_ref
    const ftRow = await queryOne<{ case_ref: string }>(
      "SELECT case_ref FROM field_test WHERE record_uuid = $1 OR case_ref = $1 LIMIT 1;",
      [id]
    );
    const caseRef = ftRow?.case_ref || id;

    // Update cases table in Supabase
    if (patch.caseStatus || patch.panchnamaRef !== undefined) {
      await query(
        `UPDATE cases 
         SET case_status = COALESCE($1, case_status),
             panchnama_ref = COALESCE($2, panchnama_ref),
             updated_at = NOW()
         WHERE case_ref = $3;`,
        [patch.caseStatus ?? null, patch.panchnamaRef ?? null, caseRef]
      );

      // Record in append-only case_status_history
      if (patch.caseStatus && patch.caseStatus !== current.caseStatus) {
        await query(
          `INSERT INTO case_status_history (case_ref, from_status, to_status, actor, at, note)
           VALUES ($1, $2, $3, $4, NOW(), $5);`,
          [caseRef, current.caseStatus, patch.caseStatus, actor, patch.panchnamaRef || null]
        );
      }
    }

    return await getCase(id);
  } catch (error) {
    console.error("Error updating case:", error);
    return undefined;
  }
}

export async function distinctFacets(viewer?: SessionUser) {
  const cases = await allCases(viewer);
  return {
    districts: [...new Set(cases.map((c) => c.district))].filter(Boolean).sort(),
    departments: [...new Set(cases.map((c) => c.department))].filter(Boolean).sort(),
    officers: [...new Set(cases.map((c) => c.operatorName))].filter(Boolean).sort(),
    kitTypes: [...new Set(cases.map((c) => c.kit.kitType))].filter(Boolean).sort(),
  };
}

export type IntegrityReason =
  | "VERIFIED"
  | "RECORD_HASH_MISMATCH"
  | "CHAIN_HASH_MISMATCH"
  | "NO_SEALED_PAYLOAD";

export interface IntegrityVerdict {
  record: EnrichedCase;
  stored: string;
  recomputed: string;
  chainStored: string;
  chainRecomputed: string;
  ok: boolean;
  reason: IntegrityReason;
}

export async function verifyIntegrity(
  id: string,
  viewer: SessionUser
): Promise<IntegrityVerdict | undefined> {
  const record = await getCase(id, viewer);
  if (!record) return undefined;

  // Recompute the sealed hashes from the authoritative payload using the same
  // algorithm as parinaam-app server/src/verify.ts:
  //   record_hash = sha256(payload_jcs)
  //   chain_hash  = sha256(prev_hash + record_hash)
  const row = await queryOne<{
    payload_jcs: string | null;
    record_hash: string | null;
    prev_hash: string | null;
    chain_hash: string | null;
  }>(
    "SELECT payload_jcs, record_hash, prev_hash, chain_hash FROM field_test WHERE record_uuid = $1 OR case_ref = $1 LIMIT 1;",
    [id]
  );

  if (!row || !row.payload_jcs) {
    // No sealed payload on file — integrity can be neither confirmed nor denied.
    return {
      record,
      stored: row?.record_hash ?? record.recordHash ?? "",
      recomputed: "",
      chainStored: row?.chain_hash ?? record.chainHash ?? "",
      chainRecomputed: "",
      ok: false,
      reason: "NO_SEALED_PAYLOAD" as const,
    };
  }

  const recomputed = sha256(row.payload_jcs);
  const recordOk = recomputed === (row.record_hash ?? "");

  const prevHash = row.prev_hash ?? "";
  const chainRecomputed = sha256(`${prevHash}${row.record_hash ?? ""}`);
  const chainOk = chainRecomputed === (row.chain_hash ?? "");

  return {
    record,
    stored: row.record_hash ?? "",
    recomputed,
    chainStored: row.chain_hash ?? "",
    chainRecomputed,
    ok: recordOk && chainOk,
    reason: recordOk
      ? chainOk
        ? ("VERIFIED" as const)
        : ("CHAIN_HASH_MISMATCH" as const)
      : ("RECORD_HASH_MISMATCH" as const),
  };
}

// --- Accounts & User Management ---------------------------------------------

/** A row of the shared `officers` table. */
export interface OfficerRow {
  id: number;
  officer_code: string | null;
  username: string | null;
  display_name: string | null;
  role: string | null;
  status: string | null;
  department: string | null;
  unit: string | null;
  official_email: string | null;
  created_at: string | null;
  last_login_at: string | null;
}

export async function listUsers(): Promise<PublicUser[]> {
  try {
    const rows = await query<OfficerRow>(
      `SELECT id, officer_code, username, display_name, role, status, department, unit, official_email, created_at, last_login_at
       FROM officers
       ORDER BY id ASC;`
    );
    return rows.map((u) => ({
      id: String(u.id),
      name: u.display_name ?? "Unnamed officer",
      email: u.official_email || `${u.username}@parinaam.gov.in`,
      role: (u.role || "").toLowerCase(),
      department: u.department || u.unit || "Unassigned",
      status: (u.status || "active").toLowerCase(),
      createdAt: u.created_at || new Date().toISOString(),
      lastLoginAt: u.last_login_at || undefined,
      officerCode: u.officer_code ?? undefined,
    }));
  } catch (error) {
    console.error("Error listing users:", error);
    return [];
  }
}

export async function findUserByEmail(email: string): Promise<PublicUser | undefined> {
  const users = await listUsers();
  const lower = email.toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase() === lower || u.name.toLowerCase() === lower);
}

export function toPublicUser(user: OfficerRow): PublicUser {
  return {
    id: String(user.id),
    name: user.display_name ?? "Unnamed officer",
    email: user.official_email || `${user.username}@parinaam.gov.in`,
    role: (user.role || "").toLowerCase(),
    department: user.department || user.unit || "Unassigned",
    status: (user.status || "active").toLowerCase(),
    createdAt: user.created_at || new Date().toISOString(),
    lastLoginAt: user.last_login_at ?? undefined,
    officerCode: user.officer_code ?? undefined,
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  role: string;
  department: string;
  actor: string;
}): Promise<PublicUser> {
  const username = (input.email.includes("@")
    ? input.email.split("@")[0]
    : input.email
  ).toLowerCase();
  const officerCode = `OFFICER-${username.toUpperCase()}`;
  const now = new Date().toISOString();

  // The account starts with NO usable password. We hash 32 bytes of CSPRNG
  // entropy that is never surfaced to anyone, so the account cannot be signed
  // into until an admin/onboarding flow sets a real credential. (The previous
  // 'dummy_salt'/'dummy_hash' pair was a shared, guessable constant.)
  const unusable = randomBytes(32).toString("base64");
  const { saltHex, hashHex } = await hashPassword(unusable);

  const res = await queryOne<OfficerRow>(
    `INSERT INTO officers (
       officer_code, username, pass_salt, pass_hash, display_name, role, status,
       department, official_email, created_at, must_change_password
     ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, TRUE)
     RETURNING id, officer_code, username, display_name, role, status, department, official_email, created_at;`,
    [
      officerCode,
      username,
      saltHex,
      hashHex,
      input.name,
      input.role.toUpperCase(),
      input.department,
      input.email,
      now,
    ]
  );

  await query(
    `INSERT INTO server_audit (officer_code, actor, action, subject, at, detail)
     VALUES ($1, $2, 'account_created', $3, NOW(), $4);`,
    [officerCode, input.actor, String(res?.id), `Created pending account for ${input.name} (${input.role})`]
  ).catch(() => {});

  if (!res) throw new Error("Account creation failed.");
  return toPublicUser(res);
}

export async function setUserStatus(
  id: string,
  status: string,
  actor: string
): Promise<PublicUser | undefined> {
  const upperStatus = status.toUpperCase();
  const updated = await queryOne<OfficerRow>(
    `UPDATE officers
     SET status = $1,
         approved_at = CASE WHEN $1 = 'ACTIVE' THEN NOW() ELSE approved_at END
     WHERE id = $2
     RETURNING *;`,
    [upperStatus, Number(id)]
  );

  if (!updated) return undefined;

  await query(
    `INSERT INTO server_audit (officer_code, actor, action, subject, at, detail)
     VALUES ($1, $2, 'account_status_change', $3, NOW(), $4);`,
    [updated.officer_code, actor, String(id), `Set account status to ${status}`]
  ).catch(() => {});

  return toPublicUser(updated);
}

// --- Audit & Activity -------------------------------------------------------

interface AuditRow {
  id: number;
  officer_code: string | null;
  actor: string | null;
  action: string | null;
  subject: string | null;
  at: string | null;
  detail: string | null;
}

export async function recentActivity(limit = 10): Promise<AuditEvent[]> {
  try {
    const rows = await query<AuditRow>(
      `SELECT id, officer_code, actor, action, subject, at, detail
       FROM server_audit
       ORDER BY id DESC
       LIMIT $1;`,
      [limit]
    );

    return rows.map((r) => {
      let kind: AuditEvent["kind"] = "login";
      const action = (r.action || "").toLowerCase();
      if (action.includes("status")) kind = "status_change";
      else if (action.includes("created")) kind = "account_created";
      else if (action.includes("approved")) kind = "account_approved";
      else if (action.includes("export")) kind = "export";
      else if (action.includes("integrity")) kind = "integrity";

      return {
        id: `evt-${r.id}`,
        at: r.at || new Date().toISOString(),
        actor: r.actor || r.officer_code || "System",
        kind,
        detail: r.detail || r.action || "",
        caseId: r.subject ?? undefined,
      };
    });
  } catch (error) {
    console.error("Error reading recentActivity:", error);
    return [];
  }
}

export async function recordStatusChange(
  actor: string,
  caseId: string,
  from: string,
  to: string
): Promise<void> {
  await query(
    `INSERT INTO server_audit (officer_code, actor, action, subject, at, detail)
     VALUES ('SYSTEM', $1, 'status_change', $2, NOW(), $3);`,
    [actor, caseId, `Set ${caseId} → ${to} (from ${from})`]
  ).catch(() => {});
}

export async function recordExport(
  actor: string,
  format: string,
  caseId?: string
): Promise<void> {
  const detail = caseId
    ? `Exported ${caseId} as ${format.toUpperCase()} (court copy)`
    : `Exported case list as ${format.toUpperCase()}`;
  await query(
    `INSERT INTO server_audit (officer_code, actor, action, subject, at, detail)
     VALUES ('SYSTEM', $1, 'export', $2, NOW(), $3);`,
    [actor, caseId || "case-log", detail]
  ).catch(() => {});
}

export async function recordIntegrity(
  actor: string,
  caseId: string,
  ok: boolean
): Promise<void> {
  await query(
    `INSERT INTO server_audit (officer_code, actor, action, subject, at, detail)
     VALUES ('SYSTEM', $1, 'integrity', $2, NOW(), $3);`,
    [actor, caseId, ok ? `Verified SHA-256 integrity seal on ${caseId}` : `Integrity verification MISMATCH on ${caseId}`]
  ).catch(() => {});
}
