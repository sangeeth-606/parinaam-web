// Shared, environment-agnostic role + capability definitions.
// Unified with parinaam-app src/contracts/officer-roles.ts
// Kept free of server-only imports so client components can use them.

export type Role = "admin" | "supervisor" | "senior" | "junior" | "judiciary" | "io";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  badgeNumber?: string;
  officerCode?: string;
}

export type Capability =
  | "records.view_own"
  | "records.view_unit"
  | "records.change_status"
  | "records.export_court"
  | "records.recompute_integrity"
  | "records.edit_sealed" // NEVER granted — sealed records are immutable
  | "lab.enter_results"
  | "admin.users"
  | "audit.view";

export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  admin: [
    "records.view_own",
    "records.view_unit",
    "records.change_status",
    "records.export_court",
    "records.recompute_integrity",
    "lab.enter_results",
    "admin.users",
    "audit.view",
    // records.edit_sealed deliberately absent — no role ever receives it.
  ],
  supervisor: [
    "records.view_own",
    "records.view_unit",
    "records.change_status",
    "records.export_court",
    "records.recompute_integrity",
    "audit.view",
  ],
  senior: [
    "records.view_own",
    "records.view_unit",
    "records.export_court",
    "records.recompute_integrity",
  ],
  io: [
    "records.view_own",
    "records.view_unit",
    "records.export_court",
    "records.recompute_integrity",
  ],
  junior: [
    "records.view_own",
    "records.export_court",
  ],
  judiciary: [
    "records.view_own",
    "records.view_unit",
    "records.export_court",
    "audit.view",
  ],
};

export function normalizeRole(role: string): Role {
  const lower = (role || "").toLowerCase().trim();
  if (lower === "admin") return "admin";
  if (lower === "supervisor") return "supervisor";
  if (lower === "senior" || lower === "io") return "senior";
  if (lower === "junior") return "junior";
  if (lower === "judiciary") return "judiciary";
  return "junior";
}

export function can(role: string, capability: Capability): boolean {
  const norm = normalizeRole(role);
  return ROLE_CAPABILITIES[norm]?.includes(capability) ?? false;
}

/** Visibility breadth for a role: unit-wide, or own records only. */
export type RecordScope = "own" | "unit";

export function recordScope(role: string): RecordScope {
  return can(role, "records.view_unit") ? "unit" : "own";
}

export function ownsRecord(
  user: SessionUser,
  record: { operatorName: string; operatorId?: string }
): boolean {
  if (record.operatorId && user.officerCode && record.operatorId === user.officerCode) {
    return true;
  }
  return record.operatorName.toLowerCase() === user.name.toLowerCase();
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  senior: "Senior Investigating Officer",
  io: "Investigating Officer",
  junior: "Junior Field Officer",
  judiciary: "Judiciary / Court Reviewer",
};

/** Only admins manage accounts; supervisors + admins can change case status. */
export function canReview(role: string): boolean {
  return can(role, "records.change_status");
}

export function canManageAccounts(role: string): boolean {
  return can(role, "admin.users");
}
