import type { MockUser } from "./mock-data";
import type { Role, SessionUser } from "./roles";

export function toSessionUser(user: MockUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    department: user.department,
  };
}

