"use client";

// Client-only wrapper so MapLibre never runs during SSR.

import dynamic from "next/dynamic";

import type { MapPoint } from "./case-map";

const CaseMapInner = dynamic(() => import("./case-map").then((m) => m.CaseMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function MapWrapper({
  points,
  center,
  zoom,
  height,
}: {
  points: MapPoint[];
  center: [number, number];
  zoom?: number;
  height?: number;
}) {
  return <CaseMapInner points={points} center={center} zoom={zoom} height={height} />;
}
