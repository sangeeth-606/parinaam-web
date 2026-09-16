"use client";

// Capture-pin map — MapLibre GL via react-map-gl (free, no API key).
// Dynamically imported (client-only) from pages that need it.

import "maplibre-gl/dist/maplibre-gl.css";
import { Marker, NavigationControl, Map } from "react-map-gl/maplibre";

const OUTCOME_COLORS: Record<string, string> = {
  positive: "#dc2626",
  negative: "#059669",
  inconclusive: "#d97706",
};

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  outcome: string;
  positive?: boolean;
}

export function CaseMap({
  points,
  center,
  zoom = 5,
  height = 420,
}: {
  points: MapPoint[];
  center: [number, number];
  zoom?: number;
  height?: number;
}) {
  return (
    <Map
      initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
      style={{ width: "100%", height }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      attributionControl={false}
    >
      <NavigationControl position="top-right" />
      {points.map((p) => (
        <Marker key={p.id} longitude={p.lon} latitude={p.lat} anchor="bottom">
          <span
            title={`${p.id} — ${p.outcome}`}
            className="block h-3 w-3 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: OUTCOME_COLORS[p.outcome] ?? "#64748b" }}
          />
        </Marker>
      ))}
    </Map>
  );
}
