import { DistrictBar, OutcomePie, TrendChart } from "@/components/charts";
import { PresumptiveBanner, StatutoryFootnote } from "@/components/presumptive-banner";
import { MapWrapper } from "@/components/map-wrapper";
import { SimsPlaceholder } from "@/components/sims-placeholder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { can, type Role } from "@/lib/roles";
import { getSession } from "@/lib/session";
import { computeStats } from "@/lib/stats";
import { ShieldCheck } from "lucide-react";

// Rajasthan centroid for the district overview map.
const MAP_CENTER: [number, number] = [26.6, 74.3];

export default async function AnalyticsPage() {
  const session = (await getSession())!;

  if (!can(session.role as Role, "records.view_unit")) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200/80 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Regional Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Regional load, outcome mix and submission trends across the jurisdiction.
          </p>
        </div>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-amber-900">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-800">
            <p>
              Regional analytics aggregate <strong>unit-wide</strong> records,
              which your current role (Investigating Officer) is not permitted to view.
            </p>
            <p>
              Your dashboard home and case log show statistics and records
              scoped to your own submissions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = await computeStats(session);

  const outcomeData: { name: string; value: number }[] = [
    { name: "CONSISTENT_WITH_REAGENT_POSITIVE", value: stats.byOutcome.positive ?? 0 },
    { name: "CONSISTENT_WITH_REAGENT_NEGATIVE", value: stats.byOutcome.negative ?? 0 },
    { name: "INCONCLUSIVE", value: stats.byOutcome.inconclusive ?? 0 },
  ];

  const metrics = [
    {
      label: "Total Test Volume",
      value: String(stats.total).padStart(2, "0"),
      sub: `${stats.demoCount} flagged as demonstration data`,
    },
    {
      label: "Presumptive Positive Rate",
      value: `${(stats.presumptivePositiveRate * 100).toFixed(1)}%`,
      sub: "consistent with reagent positive",
    },
    {
      label: "Awaiting Review",
      value: `${(stats.openReviewRate * 100).toFixed(1)}%`,
      sub: `${stats.closedCount} of ${stats.total} closed`,
    },
    {
      label: "Median Review Latency",
      value:
        stats.medianReviewLatencyHours >= 1
          ? `${stats.medianReviewLatencyHours.toFixed(1)} h`
          : `${Math.round(stats.medianReviewLatencyHours * 60)} min`,
      sub: "first capture to last record",
    },
    {
      label: "No GPS Fix",
      value: String(stats.noGpsCount).padStart(2, "0"),
      sub: "not plotted on capture map",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Regional Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Regional load, outcome mix and submission trends across the central jurisdiction.
        </p>
      </div>

      <PresumptiveBanner compact />

      {stats.isDemoOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-2xs">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
          <span>
            <strong>Demonstration Corpus.</strong> All {stats.total} records are seeded sample data, not real seizures.
            Aggregates below are for functional demonstration only and must not be cited in judicial proceedings.
          </span>
        </div>
      )}

      {/* Headline metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => (
          <Card key={m.label} className="hover:border-slate-300 transition-colors">
            <CardContent className="pt-5">
              <div className="text-2xl font-extrabold tabular-nums text-slate-900">{m.value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                {m.label}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">{m.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Geographic Seizure Map</CardTitle>
            <CardDescription>Spatial distribution of presumptive field assays across districts</CardDescription>
          </CardHeader>
          <CardContent>
            <MapWrapper points={stats.mapPoints} center={MAP_CENTER} zoom={5} height={420} />
            <p className="mt-2 text-[11px] text-slate-500">
              Emerald = consistent with reagent positive · Slate = consistent with reagent negative · Amber = inconclusive.
              Pins cluster by district — click a cluster to zoom in. Records without a valid GPS fix are intentionally excluded from the spatial map.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcome Distribution</CardTitle>
            <CardDescription>CIE L*a*b* trilevel outcome ratios</CardDescription>
          </CardHeader>
          <CardContent>
            <OutcomePie data={outcomeData} />
            <div className="mt-2 text-center text-xs font-medium text-slate-500">
              {stats.total} total recorded assays
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cases by District (Top 8)</CardTitle>
            <CardDescription>Jurisdictional caseload volume</CardDescription>
          </CardHeader>
          <CardContent>
            <DistrictBar data={stats.topDistricts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submissions Over Time (14 Days)</CardTitle>
            <CardDescription>Daily assay ingest volume</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={stats.last14Days} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <SimsPlaceholder />
        </CardContent>
      </Card>

      <StatutoryFootnote />
    </div>
  );
}
