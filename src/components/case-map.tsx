"use client";

// Capture-pin map — MapLibre GL via react-map-gl with Esri World Street Map tiles.
// Dynamically imported (client-only) from pages that need it.

import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { AttributionControl, Marker, NavigationControl, Map } from "react-map-gl/maplibre";

/**
 * Esri's public World Street Map MapServer exposes raster tiles without an
 * API key. Keep attribution enabled because the service includes Esri and
 * OpenStreetMap data providers.
 */
const ESRI_WORLD_STREET_STYLE = {
  version: 8 as const,
  sources: {
    esri: {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        '© Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community',
    },
  },
  layers: [
    {
      id: "esri-world-street",
      type: "raster" as const,
      source: "esri",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  return (
    <div className="relative overflow-hidden rounded-lg bg-muted" style={{ height }}>
      <Map
        initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={ESRI_WORLD_STREET_STYLE}
        attributionControl={false}
        reuseMaps
        onLoad={() => setIsLoading(false)}
        onError={(event) => {
          setIsLoading(false);
          setMapError(event.error?.message || "The basemap could not be loaded.");
        }}
      >
        <NavigationControl position="top-right" />
        <AttributionControl position="bottom-right" compact />
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

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/70 text-sm text-muted-foreground">
          Loading Esri basemap…
        </div>
      )}

      {mapError && (
        <div className="absolute inset-x-3 top-3 rounded-md border border-red-200 bg-white/95 p-3 text-xs text-red-700 shadow-sm" role="alert">
          <strong>Map unavailable.</strong> {mapError} Check that this device can reach
          server.arcgisonline.com, then refresh the page.
        </div>
      )}
    </div>
  );
}
