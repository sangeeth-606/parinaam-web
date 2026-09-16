// ---------------------------------------------------------------------------
// In-memory data store — the hackathon stand-in for the `parinaam` backend.
// Every accessor here mirrors the REST surface the real backend will expose
// (GET /cases, GET /cases/:id, POST /cases/:id/status, /admin/users, ...),
// so `src/app/api/*` route handlers can later proxy instead of reading this.
// Cached on globalThis so dev hot-reloads keep one dataset.
// ---------------------------------------------------------------------------

import { generateCases, generateUsers, type MockUser } from "./mock-data";
import type {
  CaseQuery,
  CaseStatus,
  EnrichedCase,
  Paginated,
} from "./types";

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  kind: "login" | "account_created" | "account_approved" | "status_change" | "export";
  detail: string;
  caseId?: string;
}

interface Store {
  cases: EnrichedCase[];
  users: MockUser[];
  audit: AuditEvent[];
}

const g = globalThis as unknown as { __parinaamStore?: Store };

function seedAudit(): AuditEvent[] {
  const now = Date.now();
  const mk = (
    i: number,
    actor: string,
    kind: AuditEvent["kind"],
    detail: string,
    minutesAgo: number,
    caseId?: string
  ): AuditEvent => ({
    id: `evt-${i}`,
    at: new Date(now - minutesAgo * 60_000).toISOString(),
    actor,
    kind,
    detail,
    caseId,
  });
  return [
    mk(1, "Magistrate Rao", "login", "Signed in from 10.4.2.17", 12),
    mk(2, "Supervisor Sharma", "status_change", "Set NDPS-101142 → under_review", 48, "NDPS-101142"),
    mk(3, "Admin Control", "account_created", "Created account for Officer Nair (io)", 130),
    mk(4, "IO Verma", "login", "Signed in from 10.4.9.62", 190),
    mk(5, "Supervisor Sharma", "status_change", "Set NDPS-100977 → reviewed", 260, "NDPS-100977"),
    mk(6, "Admin Control", "account_approved", "Approved judiciary account for Judge Iyer", 400),
    mk(7, "Magistrate Rao", "export", "Exported NDPS-100864 as PDF (court copy)", 520, "NDPS-100864"),
  ];
}

function getStore(): Store {
  if (!g.__parinaamStore) {
    g.__parinaamStore = {
      cases: generateCases(),
      users: generateUsers(),
      audit: seedAudit(),
    };
  }
  return g.__parinaamStore;
}

function matches(record: EnrichedCase, q: CaseQuery): boolean {
  if (q.status && q.status !== "all" && record.caseStatus !== q.status) return false;
  if (q.outcome && q.outcome !== "all" && record.classification.outcome !== q.outcome) return false;
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
}

export function queryCases(q: CaseQuery): Paginated<EnrichedCase> {
  const store = getStore();
  const filtered = store.cases.filter((c) => matches(c, q));
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

export function getCase(id: string): EnrichedCase | undefined {
  return getStore().cases.find((c) => c.id === id);
}

export function updateCase(
  id: string,
  patch: { caseStatus?: CaseStatus; panchnamaRef?: string }
): EnrichedCase | undefined {
  const record = getCase(id);
  if (!record) return undefined;
  if (patch.caseStatus) record.caseStatus = patch.caseStatus;
  if (patch.panchnamaRef !== undefined) record.panchnamaRef = patch.panchnamaRef;
  return record;
}

export function distinctFacets() {
  const store = getStore();
  return {
    districts: [...new Set(store.cases.map((c) => c.district))].sort(),
    departments: [...new Set(store.cases.map((c) => c.department))].sort(),
    officers: [...new Set(store.cases.map((c) => c.operatorName))].sort(),
    kitTypes: [...new Set(store.cases.map((c) => c.kit.kitType))].sort(),
  };
}

export function allCases(): EnrichedCase[] {
  return getStore().cases;
}

// --- accounts --------------------------------------------------------------

export function listUsers(): MockUser[] {
  return getStore().users;
}

export function findUserByEmail(email: string): MockUser | undefined {
  return getStore().users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function createUser(input: {
  name: string;
  email: string;
  role: MockUser["role"];
  department: string;
  actor: string;
}): MockUser {
  const store = getStore();
  const user: MockUser = {
    id: `u-${String(store.users.length + 1).padStart(3, "0")}`,
    name: input.name,
    email: input.email,
    role: input.role,
    department: input.department,
    status: "pending",
    createdAt: new Date().toISOString(),
    password: "parinaam",
  };
  store.users.push(user);
  store.audit.unshift({
    id: `evt-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    actor: input.actor,
    kind: "account_created",
    detail: `Created account for ${user.name} (${user.role})`,
  });
  return user;
}

export function setUserStatus(
  id: string,
  status: MockUser["status"],
  actor: string
): MockUser | undefined {
  const user = getStore().users.find((u) => u.id === id);
  if (!user) return undefined;
  user.status = status;
  if (status === "active") {
    getStore().audit.unshift({
      id: `evt-${crypto.randomUUID()}`,
      at: new Date().toISOString(),
      actor,
      kind: "account_approved",
      detail: `Approved ${user.role} account for ${user.name}`,
    });
  }
  return user;
}

export function recordLogin(user: MockUser, ip = "10.4.0.1"): void {
  user.lastLoginAt = new Date().toISOString();
  getStore().audit.unshift({
    id: `evt-${crypto.randomUUID()}`,
    at: user.lastLoginAt,
    actor: user.name,
    kind: "login",
    detail: `Signed in from ${ip}`,
  });
}

export function recordStatusChange(
  actor: string,
  caseId: string,
  from: CaseStatus,
  to: CaseStatus
): void {
  getStore().audit.unshift({
    id: `evt-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    actor,
    kind: "status_change",
    detail: `Set ${caseId} → ${to.replace("_", " ")}`,
    caseId,
  });
}

export function recordExport(actor: string, detail: string, caseId?: string): void {
  getStore().audit.unshift({
    id: `evt-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    actor,
    kind: "export",
    detail,
    caseId,
  });
}

export function recentActivity(limit = 20): AuditEvent[] {
  return getStore().audit.slice(0, limit);
}

/** Strip the mock password before a user record leaves the API. */
export function toPublicUser(user: MockUser): Omit<MockUser, "password"> {
  const { password: _password, ...rest } = user;
  void _password;
  return rest;
}


