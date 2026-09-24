import {
  AlertTriangle,
  ClipboardList,
  LogIn,
  FileUp,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import { TrendChart } from "@/components/charts";
import { SimsPlaceholder } from "@/components/sims-placeholder";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { computeStats } from "@/lib/stats";
import { recentActivity } from "@/lib/store";
import { can, canManageAccounts, type Role } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

const ACTIVITY_ICONS = {
  login: LogIn,
  status_change: ClipboardList,
  account_created: UserPlus,
  account_approved: UserCheck,
  export: FileUp,
  integrity: ShieldCheck,
} as const;

export default async function DashboardHome() {
  const session = (await getSession())!;
  // RBAC: stats are scope-derived — field officers aggregate their own records.
  const stats = computeStats(session);
  const isAdmin = canManageAccounts(session.role as Role);
  // RBAC: `audit.view` — the activity feed is an audit surface; field
  // officers (and anyone without the capability) don't see it.
  const canViewActivity = can(session.role as Role, "audit.view");
  const activity = canViewActivity ? recentActivity(8) : [];
  const canSeeAnalytics = can(session.role as Role, "records.view_unit");

  const cards = [
    { label: "Total cases", value: String(stats.total), sub: "all time" },
    { label: "Under review", value: String(stats.byStatus.under_review), sub: "awaiting decision" },
    { label: "Reviewed", value: String(stats.byStatus.reviewed), sub: "closed by reviewers" },
    { label: "Escalated", value: String(stats.byStatus.escalated), sub: "need attention" },
    {
      label: "Positive tests",
      value: String(stats.byOutcome.positive),
      sub: `${((stats.byOutcome.positive / stats.total) * 100).toFixed(1)}% of all`,
    },
    {
      label: "Avg confidence",
      value: `${(stats.avgConfidence * 100).toFixed(1)}%`,
      sub: `${stats.mockedGps} mocked-GPS flagged`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {session.name}. Here&apos;s the current state of field submissions.
        </p>
      </div>

      {/* Summary numbers */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <div className="text-2xl font-semibold tabular-nums">{c.value}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">{c.label}</div>
              <div className="text-[11px] text-muted-foreground/70">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={`gap-6 ${canViewActivity ? "grid lg:grid-cols-3" : ""}`}>
        {/* Trend */}
        <Card className={canViewActivity ? "lg:col-span-2" : ""}>
          <CardHeader>
            <CardTitle>Submissions — last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={stats.last14Days} />
          </CardContent>
        </Card>

        {/* Recent activity — RBAC: audit.view only */}
        {canViewActivity && (
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.map((event) => {
                const Icon = ACTIVITY_ICONS[event.kind];
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">
                        <span className="font-medium">{event.actor}</span> — {event.detail}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(event.at)}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Integrations + integrity note */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SimsPlaceholder />
            {stats.mockedGps > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-gold-deep/50 bg-gold/15 p-3 text-xs text-navy-deep">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {stats.mockedGps} record(s) report mocked GPS coordinates — verify device
                  integrity for these submissions.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link
              href="/cases"
              className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Open the case log
              </span>
              <span className="text-xs text-muted-foreground">search, filter, export</span>
            </Link>
            {canSeeAnalytics ? (
              <Link
                href="/analytics"
                className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Regional analytics
                </span>
                <span className="text-xs text-muted-foreground">map + trends</span>
              </Link>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-gold-deep/50 bg-gold/15 p-3 text-xs text-navy-deep">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Regional analytics are restricted to unit-wide roles — your
                  dashboard figures cover your own submissions only.
                </span>
              </div>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" /> Accounts &amp; audit trail
                </span>
                <span className="text-xs text-muted-foreground">approve pending users</span>
              </Link>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <StatusBadge status="reported" /> Newest records land here first — supervisors
              move them through review.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

