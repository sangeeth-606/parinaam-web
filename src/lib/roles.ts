// Shared, environment-agnostic role definitions.
// Kept free of server-only imports (next/headers, node:crypto) so client
// components can use them; lib/auth.ts re-exports for server code.

export type Role = "admin" | "supervisor" | "io" | "judiciary";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  io: "Investigating Officer",
  judiciary: "Judiciary",
};

/** Only admins manage accounts; supervisors + admins can change case status. */
export function canReview(role: Role): boolean {
  return role === "admin" || role === "supervisor";
}

export function canManageAccounts(role: Role): boolean {
  return role === "admin";
}
