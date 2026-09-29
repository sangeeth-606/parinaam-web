"use client";

// Capture-pin map — MapLibre GL via react-map-gl with Esri World Street Map tiles.
// Dynamically imported (client-only) from pages that need it.

import { useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  Layer,
  NavigationControl,
  Popup,
  Source,
  Map,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";

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


/** Human label for a trilevel outcome, used in pin tooltips. */
function labelFor(outcome: string): string {
  switch (outcome?.toUpperCase?.() ?? "") {
    case "CONSISTENT_WITH_REAGENT_POSITIVE":
      return "Consistent with reagent positive (presumptive)";
    case "CONSISTENT_WITH_REAGENT_NEGATIVE":
      return "Consistent with reagent negative (presumptive)";
    case "INCONCLUSIVE":
      return "Inconclusive";
    default:
      return "Unrecognised outcome";
  }
}

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  outcome: string;
  positive?: boolean;
  /** Optional grouping key (district / station) for clustering. */
  cluster?: string;
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
  const [selected, setSelected] = useState<{
    lng: number;
    lat: number;
    text: string;
  } | null>(null);
  const mapRef = useRef<MapRef>(null);

  // GeoJSON feature collection, clustered by district on the map itself so
  // overlapping pins in a metro region aggregate instead of hiding each other.
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: points.map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
        properties: {
          id: p.id,
          outcome: p.outcome,
          district: p.cluster ?? "",
          label: labelFor(p.outcome),
        },
      })),
    }),
    [points]
  );

  // Clicking a cluster zooms into its members; clicking a single pin opens a
  // detail popup. Both read straight from the clustered source's features.
  const handleMapClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelected(null);
      return;
    }
    const geometry = feature.geometry;
    if (geometry.type !== "Point") return;
    const [lng, lat] = geometry.coordinates;
    const props = feature.properties as {
      cluster?: boolean;
      point_count?: number;
      cluster_id?: number;
      id?: string;
      label?: string;
      district?: string;
    };

    if (props?.cluster && typeof props.cluster_id === "number") {
      const source = mapRef.current?.getSource("case-pins") as
        | {
            getClusterExpansionZoom: (
              id: number,
              cb: (err: unknown, zoom: number) => void
            ) => void;
          }
        | undefined;
      source?.getClusterExpansionZoom(props.cluster_id, (err, zoom) => {
        if (!err && typeof zoom === "number") {
          mapRef.current?.easeTo({ center: [lng, lat], zoom });
        }
      });
      setSelected(null);
      return;
    }

    setSelected({
      lng,
      lat,
      text: `${props?.id ?? "Record"} — ${props?.label ?? "outcome"}`,
    });
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-muted" style={{ height }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={ESRI_WORLD_STREET_STYLE}
        attributionControl={false}
        reuseMaps
        onLoad={() => setIsLoading(false)}
        onClick={handleMapClick}
        onError={(event) => {
          setIsLoading(false);
          setMapError(event.error?.message || "The basemap could not be loaded.");
        }}
      >
        <NavigationControl position="top-right" />
        <AttributionControl position="bottom-right" compact />

        {points.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            No capture positions available. Records without a GPS fix are
            deliberately not plotted — an approximate coordinate would be false
            evidence.
          </div>
        ) : (
          <Source
            id="case-pins"
            type="geojson"
            data={geojson}
            cluster
            clusterMaxZoom={11}
            clusterRadius={48}
          >
            {/* Cluster bubbles — neutral navy, sized by member count. */}
            <Layer
              id="clusters"
              type="circle"
              filter={["has", "point_count"]}
              paint={{
                "circle-color": "#0d355e",
                "circle-radius": ["step", ["get", "point_count"], 16, 5, 21, 12, 27],
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
            <Layer
              id="cluster-count"
              type="symbol"
              filter={["has", "point_count"]}
              layout={{
                "text-field": ["get", "point_count_abbreviated"],
                "text-size": 12,
              }}
              paint={{ "text-color": "#ffffff" }}
            />
            {/* Unclustered pins, coloured by trilevel reagent outcome. */}
            <Layer
              id="unclustered-point"
              type="circle"
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-color": [
                  "match",
                  ["get", "outcome"],
                  "CONSISTENT_WITH_REAGENT_POSITIVE",
                  "#dc2626",
                  "CONSISTENT_WITH_REAGENT_NEGATIVE",
                  "#059669",
                  "INCONCLUSIVE",
                  "#d97706",
                  "#64748b",
                ],
                "circle-radius": 7,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>
        )}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            onClose={() => setSelected(null)}
            closeButton={false}
            closeOnClick={false}
            offset={12}
          >
            <div className="max-w-[220px] text-xs">
              <p className="font-semibold">{selected.text}</p>
              <p className="mt-1 text-[11px] text-slate-600">
                Presumptive indicator only — confirmatory laboratory analysis is
                required under Rule 10(2) NDPS Rules, 2022.
              </p>
            </div>
          </Popup>
        )}
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
