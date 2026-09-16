import { DistrictBar, OutcomePie, TrendChart } from "@/components/charts";
import { MapWrapper } from "@/components/map-wrapper";
import { SimsPlaceholder } from "@/components/sims-placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeStats } from "@/lib/stats";

// Rajasthan centroid for the district overview map.
const MAP_CENTER: [number, number] = [26.6, 74.3];

export default async function AnalyticsPage() {
  const stats = computeStats();
  const outcomeData = Object.entries(stats.byOutcome).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Regional load, outcome mix and submission trends across the corpus.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Capture map — cases by location</CardTitle>
          </CardHeader>
          <CardContent>
            <MapWrapper points={stats.mapPoints} center={MAP_CENTER} zoom={5} height={420} />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Red = positive · Green = negative · Amber = inconclusive. Tiles: MapLibre demo
              (no API key). In production, swap the style for a MeitY/OSM vector basemap.
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
