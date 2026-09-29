import { DistrictBar, OutcomePie, TrendChart } from "@/components/charts";
import { PresumptiveBanner } from "@/components/presumptive-banner";
import { MapWrapper } from "@/components/map-wrapper";
import { SimsPlaceholder } from "@/components/sims-placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can, type Role } from "@/lib/roles";
import { getSession } from "@/lib/session";
import { computeStats } from "@/lib/stats";

// Rajasthan centroid for the district overview map.
const MAP_CENTER: [number, number] = [26.6, 74.3];

export default async function AnalyticsPage() {
  const session = (await getSession())!;

  // RBAC: unit-wide analytics requires `records.view_unit` — field officers
  // get an explicit restriction panel instead of silently-scoped numbers.
  if (!can(session.role as Role, "records.view_unit")) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Regional load, outcome mix and submission trends across the corpus.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Regional analytics aggregate <strong>unit-wide</strong> records,
              which your role (Investigating Officer) is not permitted to view.
            </p>
            <p>
              Your dashboard home and case log show statistics and records
              scoped to your own submissions — open the Case Log to review,
              export or recompute integrity on your own records.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = await computeStats(session);

  // Outcome mix uses the canonical trilevel vocabulary, never a bare
  // "positive"/"negative" that could be read as a confirmed substance identity.
  const outcomeData: { name: string; value: number }[] = [
    { name: "CONSISTENT_WITH_REAGENT_POSITIVE", value: stats.byOutcome.positive ?? 0 },
    { name: "CONSISTENT_WITH_REAGENT_NEGATIVE", value: stats.byOutcome.negative ?? 0 },
    { name: "INCONCLUSIVE", value: stats.byOutcome.inconclusive ?? 0 },
  ];

  const metrics = [
    {
      label: "Test volume",
      value: String(stats.total),
      sub: `${stats.demoCount} flagged as demonstration data`,
    },
    {
      label: "Presumptive positive rate",
      value: `${(stats.presumptivePositiveRate * 100).toFixed(1)}%`,
      sub: "consistent with reagent positive",
    },
    {
      label: "Awaiting review",
      value: `${(stats.openReviewRate * 100).toFixed(1)}%`,
      sub: `${stats.closedCount} of ${stats.total} closed`,
    },
    {
      label: "Median review latency",
      value:
        stats.medianReviewLatencyHours >= 1
          ? `${stats.medianReviewLatencyHours.toFixed(1)} h`
          : `${Math.round(stats.medianReviewLatencyHours * 60)} min`,
      sub: "first capture to last record",
    },
    {
      label: "No GPS fix",
      value: String(stats.noGpsCount),
      sub: "not plotted on the map",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Regional load, outcome mix and submission trends across the corpus.
        </p>
      </div>

      <PresumptiveBanner compact />

      {stats.isDemoOnly && (
        <div className="rounded-lg border border-gold-deep/50 bg-gold/15 p-3 text-xs text-navy-deep">
          <strong>Demonstration corpus.</strong> All {stats.total} records are
          seeded sample data, not real seizures. Aggregates below are for
          functional demonstration only and must not be cited in any
          proceeding.
        </div>
      )}

      {/* Headline metrics — all derived from the live corpus. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-5">
              <div className="text-2xl font-semibold tabular-nums">{m.value}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {m.label}
              </div>
              <div className="text-[11px] text-muted-foreground/70">{m.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Capture map — cases by location</CardTitle>
          </CardHeader>
          <CardContent>
            <MapWrapper points={stats.mapPoints} center={MAP_CENTER} zoom={5} height={420} />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Red = consistent with reagent positive · Green = consistent with
              reagent negative · Amber = inconclusive. All are{" "}
              <strong>presumptive</strong> indicators, not confirmed identities.
              Pins cluster by district — click a cluster to zoom in. Records
              without a GPS fix are deliberately not plotted. Basemap: Esri World
              Street Map with OpenStreetMap data (no API key required).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcome mix</CardTitle>
          </CardHeader>
          <CardContent>
            <OutcomePie data={outcomeData} />
            <div className="mt-2 text-center text-xs text-muted-foreground">
              {stats.total} records
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cases by district (top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            <DistrictBar data={stats.topDistricts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submissions over time (14 days)</CardTitle>
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
    </div>
  );
}
