// Shared, environment-agnostic role + capability definitions.
// Kept free of server-only imports (next/headers, node:crypto) so client
// components can use them; lib/auth.ts re-exports for server code.
//
// RBAC capability matrix (web app). Mobile/device-only rows from the spec
// ("Create a test record", "Build and seal a lot") are owned by the field
// app and intentionally not modelled here.
//
//   Capability                 admin  supervisor  io (field)  judiciary
//   records.view_own             ✓       ✓           ✓          ✓
//   records.view_unit            ✓       ✓           —          ✓
//   records.change_status        ✓       ✓           —          —
//   records.export_court         ✓       ✓        own only      ✓
//   records.recompute_integrity  ✓       ✓        own only      —
//   records.edit_sealed        never   never       never       never
//   lab.enter_results            ✓       —           —          —   (no UI yet)
//   admin.users                  ✓       —           —          —
//   audit.view                   ✓       ✓           —          ✓
//
// "Search and filter the log — own only" and "Export — own" are enforced by
// the record SCOPE (recordScope/ownsRecord below) applied in lib/store,
// not as separate capabilities.

export type Role = "admin" | "supervisor" | "io" | "judiciary";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
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
  // Investigating / field officer — exactly the spec table.
  io: [
    "records.view_own",
    "records.export_court",
    "records.recompute_integrity",
  ],
  judiciary: [
    "records.view_own",
    "records.view_unit",
    "records.export_court",
    "audit.view",
  ],
};

export function can(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

/** Visibility breadth for a role: unit-wide, or own records only. */
export type RecordScope = "own" | "unit";

export function recordScope(role: Role): RecordScope {
  return can(role, "records.view_unit") ? "unit" : "own";
}

/**
 * A record is "own" when the session user is the recorded operator.
 * Production binds this to operatorId/user.id; the mock corpus links
 * accounts to field officers by display name.
 */
export function ownsRecord(
  user: SessionUser,
  record: { operatorName: string }
): boolean {
  return record.operatorName === user.name;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  io: "Investigating Officer",
  judiciary: "Judiciary",
};

/** Only admins manage accounts; supervisors + admins can change case status. */
export function canReview(role: Role): boolean {
  return can(role, "records.change_status");
}

export function canManageAccounts(role: Role): boolean {
  return can(role, "admin.users");
}
