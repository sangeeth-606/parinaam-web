import {
  AlertTriangle,
  ClipboardList,
  LogIn,
  FileUp,
  ShieldCheck,
  UserCheck,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Lock,
  Link2,
} from "lucide-react";
import Link from "next/link";

import { TrendChart } from "@/components/charts";
import { SimsPlaceholder } from "@/components/sims-placeholder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { computeStats } from "@/lib/stats";
import { recentActivity, allCases } from "@/lib/store";
import { can, type Role } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

import { PresumptiveBanner, StatutoryFootnote } from "@/components/presumptive-banner";
import { LiveFeed } from "@/components/live-feed";

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
  const stats = await computeStats(session);
  const canViewActivity = can(session.role as Role, "audit.view");
  const activity = canViewActivity ? await recentActivity(6) : [];
  const cases = (await allCases(session)).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Evidentiary Dashboard
            </h1>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700">
              Field Node
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <strong className="font-semibold text-slate-700">{session.name}</strong>. Real-time central repository for NDPS presumptive field tests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveFeed initialTotal={stats.total} />
          <Link href="/cases">
            <Button size="sm" className="gap-1.5 shadow-xs">
              <ClipboardList className="h-4 w-4" />
              <span>Inspect All Records</span>
            </Button>
          </Link>
        </div>
      </div>

      {stats.isDemoOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-2xs">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
          <span>
            <strong>Synthetic Demonstration Corpus.</strong> Every record currently in this database is
            synthetic demonstration data created for trial evaluation. No figure or assay below constitutes a real seizure.
          </span>
        </div>
      )}

      {/* Statutory Presumptive Notice */}
      <PresumptiveBanner />

      {/* Stat Metric Counters (Matched to Mobile App Home UI) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="pt-5">
            <div className="text-3xl font-extrabold tabular-nums text-slate-900">
              {String(stats.total).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Tests
            </div>
            <div className="text-[11px] text-slate-400 font-medium">All logged assays</div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="pt-5">
            <div className="text-3xl font-extrabold tabular-nums text-amber-600">
              {String(stats.byStatus.under_review ?? 0).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Under Review
            </div>
            <div className="text-[11px] text-amber-700/80 font-medium">Awaiting evaluation</div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="pt-5">
            <div className="text-3xl font-extrabold tabular-nums text-emerald-700">
              {String(stats.byStatus.reviewed ?? 0).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Reviewed
            </div>
            <div className="text-[11px] text-emerald-700/80 font-medium">Formally evaluated</div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="pt-5">
            <div className="text-3xl font-extrabold tabular-nums text-emerald-700">
              {String(stats.byOutcome.positive ?? 0).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Reagent Positive
            </div>
            <div className="text-[11px] text-emerald-700/80 font-medium">
              {stats.total ? `${(((stats.byOutcome.positive ?? 0) / stats.total) * 100).toFixed(1)}% of assays` : "0%"}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="pt-5">
            <div className="text-3xl font-extrabold tabular-nums text-blue-600">
              {String(stats.total - (stats.byOutcome.inconclusive ?? 0)).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Sealed Ledgers
            </div>
            <div className="text-[11px] text-blue-700/80 font-medium">Append-only chain</div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="pt-5">
            <div className="text-3xl font-extrabold tabular-nums text-slate-800">
              {(stats.avgConfidence * 100).toFixed(1)}%
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg CIE ΔE Match
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {stats.mockedGps} mock-GPS flagged
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Split: Evidentiary Feed & Trend Charts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Recent Evidentiary Logs (Mobile-Styled Cards) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Recent Evidentiary Logs
              </h2>
              <p className="text-xs text-slate-500">
                Latest assays sealed by field officers into the append-only ledger
              </p>
            </div>
            <Link href="/cases" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View Case Log</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {cases.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 text-sm">
                No field tests recorded in this ledger yet.
              </Card>
            ) : (
              cases.map((c) => {
                const isPos = c.classification.outcome === "CONSISTENT_WITH_REAGENT_POSITIVE";
                const isNeg = c.classification.outcome === "CONSISTENT_WITH_REAGENT_NEGATIVE";
                const accentBorder = isPos ? "border-l-emerald-600" : isNeg ? "border-l-slate-400" : "border-l-amber-500";
                const accentColor = isPos ? "text-emerald-700" : isNeg ? "text-slate-600" : "text-amber-700";
                const statusTitle = isPos ? "CONSISTENT WITH POSITIVE" : isNeg ? "CONSISTENT WITH NEGATIVE" : "INCONCLUSIVE";

                return (
                  <Link key={c.id} href={`/cases/${c.id}`} className="block group">
                    <div
                      className={`rounded-xl border border-slate-200/90 bg-white p-4.5 shadow-2xs transition-all group-hover:border-slate-300 group-hover:shadow-xs border-l-4 ${accentBorder}`}
                    >
                      {/* Top Row: Outcome & Timestamp */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          {isPos ? (
                            <CheckCircle2 className={`h-4 w-4 ${accentColor}`} />
                          ) : (
                            <AlertTriangle className={`h-4 w-4 ${accentColor}`} />
                          )}
                          <span className={`text-xs font-extrabold uppercase tracking-wide ${accentColor}`}>
                            {statusTitle}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-slate-400">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>

                      {/* 2-Column Evidentiary Grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Case Reference
                          </div>
                          <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {c.id}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Assigned Package
                          </div>
                          <div className="font-bold text-sm text-slate-900">
                            PKG-01 · {c.district}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Field Reagent
                          </div>
                          <div className="text-xs font-medium text-slate-700">
                            {c.kit.kitType || c.kit.name || "MARQUIS"}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Ledger Integrity
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {c.deviceAttestation ? (
                              <>
                                <Lock className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">INTEGRITY SEALED</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="h-3 w-3 text-amber-600" />
                                <span className="text-amber-700">CHAIN-ONLY</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Submission Trends & Audit Feed */}
        <div className="lg:col-span-5 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Field Activity Trends</CardTitle>
              <CardDescription>Daily outcome distribution across the past 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={stats.last14Days} />
            </CardContent>
          </Card>

          {canViewActivity && (
            <Card>
              <CardHeader>
                <CardTitle>Audit &amp; Security Log</CardTitle>
                <CardDescription>Chronological events recorded in the server audit ledger</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activity.map((event) => {
                  const Icon = ACTIVITY_ICONS[event.kind] || ShieldCheck;
                  return (
                    <div key={event.id} className="flex items-start gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                      <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 text-slate-600">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-slate-800">
                          <strong className="font-semibold text-slate-900">{event.actor}</strong> — {event.detail}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{formatDateTime(event.at)}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Integration & Policy Callout */}
          <Card>
            <CardHeader>
              <CardTitle>System Architecture &amp; Boundary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SimsPlaceholder />
              <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-xs text-blue-900 leading-relaxed">
                <strong>Statutory Chain of Custody:</strong> Direct hardware capture pipeline with no gallery import.
                Every result is hashed into an immutable append-only ledger on SQLite (mobile) and PostgreSQL (central).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statutory Footnote */}
      <StatutoryFootnote />
    </div>
  );
}
