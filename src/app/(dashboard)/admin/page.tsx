import { redirect } from "next/navigation";

import { CreateUserForm, UserActions } from "./admin-clients";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageAccounts, ROLE_LABELS, type Role } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { listUsers, recentActivity } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pending: "bg-gold/30 text-[#7a5e0f] border-gold-deep/60",
  suspended: "bg-red-50 text-red-800 border-red-200",
};

export default async function AdminPage() {
  const session = await getSession();
  // Defense in depth: middleware can't verify the HMAC signature (edge-safe
  // cookie check only), so the page re-validates the role server-side.
  if (!session || !canManageAccounts(session.role as Role)) {
    redirect("/");
  }

  const users = listUsers();
  const activity = recentActivity(15);
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Accounts &amp; Audit</h1>
        <p className="text-sm text-muted-foreground">
          Onboard reviewers, approve pending accounts and inspect recent sign-ins.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add account</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateUserForm />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              New accounts start <strong>pending</strong> and must be approved before they can
              sign in. In production, approval triggers a Supabase Auth invite + TOTP MFA
              enrolment instead of a mock password.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Recent logins &amp; audit trail
              {pendingCount > 0 && (
                <Badge className="ml-2 border-gold-deep/60 bg-gold/30 text-[#7a5e0f]">
                  {pendingCount} pending approval
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {activity.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-xs">
                    <span className="font-medium">{event.actor}</span> — {event.detail}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatDateTime(event.at)}</p>
                </div>
                <Badge className="shrink-0 capitalize">{event.kind.replace("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-xs">{u.email}</TableCell>
                  <TableCell className="text-xs">{ROLE_LABELS[u.role as Role]}</TableCell>
                  <TableCell className="text-xs">{u.department}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(u.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_BADGE[u.status]}`}
                    >
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <UserActions userId={u.id} status={u.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
