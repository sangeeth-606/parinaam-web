import { redirect } from "next/navigation";

import { CreateUserForm, UserActions } from "./admin-clients";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { StatutoryFootnote } from "@/components/presumptive-banner";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
  pending: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
  suspended: "bg-red-50 text-red-800 border-red-200 font-semibold",
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session || !canManageAccounts(session.role as Role)) {
    redirect("/");
  }

  const users = (await listUsers()).map((u) => ({
    ...u,
    status: u.status as "active" | "suspended" | "pending",
  }));
  const activity = await recentActivity(15);
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Officer Accounts &amp; Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">
          Reviewer onboarding, officer credential provisioning, and immutable authentication audit ledger.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enroll New Officer</CardTitle>
            <CardDescription>Issue central credential for mobile app or dashboard access</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm />
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              New accounts start in <strong>pending</strong> state and require supervisor approval.
              In production, approval triggers biometric/TOTP enrolment bound to hardware security level.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Authentication Audit Trail</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  {pendingCount} pending approval
                </span>
              )}
            </CardTitle>
            <CardDescription>Server audit log for logins, lockouts, and mutations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-800">
                    <strong className="font-semibold text-slate-900">{event.actor}</strong> — {event.detail}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{formatDateTime(event.at)}</p>
                </div>
                <Badge className="shrink-0 capitalize font-medium">{event.kind.replace("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Officer Roster</CardTitle>
          <CardDescription>Active credentials bound to device and institutional permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Officer Name</TableHead>
                  <TableHead>Email / Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Zonal Unit</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/70">
                    <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{u.email}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">{ROLE_LABELS[u.role as Role]}</TableCell>
                    <TableCell className="text-xs text-slate-600">{u.department}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                      {formatDateTime(u.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_BADGE[u.status]}`}
                      >
                        {u.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions userId={u.id} status={u.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StatutoryFootnote />
    </div>
  );
}
