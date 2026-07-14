import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { emissionColor, emissionLabel, type Pollutant } from "@/lib/emissions";
import { GridDetailDialog } from "./GridDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BOUNDARY, SURVEY_GRIDS } from "@/data/surveyArea";
import { useAuth } from "@/contexts/AuthContext";
import type { Area } from "@/hooks/useAreas";
import { cellPolygonFromCenter } from "@/lib/geo";
import { AddIndustryDialog } from "./AddIndustryDialog";

export interface Grid {
  id: string;
  grid_code: string;
  lat: number;
  lng: number;
  area_name: string | null;
}

export interface EmissionRow {
  id: string;
  grid_id: string;
  submission_id?: string | null;
  source_type: string;
  industry_name: string | null;
  pollutant: string;
  value_kg_per_day: number;
  confidence_score: number | null;
}

export interface IndustryPoint {
  id: string;
  category: string;
  lat: number;
  lng: number;
  grid_id: string | null;
  name?: string | null;
  is_verified?: boolean;
}

function FitBounds({ boundary }: { boundary: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!boundary.length) return;
    const lats = boundary.map((c) => c[0]);
    const lngs = boundary.map((c) => c[1]);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [24, 24] }
    );
  }, [map, boundary]);
  return null;
}

export function EmissionMap({
  refreshToken = 0,
  selectedPollutant = "PM10",
  area,
  onIndustryAdded,
}: {
  refreshToken?: number;
  selectedPollutant?: Pollutant;
  area?: Area | null;
  onIndustryAdded?: () => void;
}) {
  const { role, user } = useAuth();
  const isVerifier = role === "verifier";
  const isContributor = role === "contributor";
  const isJeedimetla = !area || area.slug === "jeedimetla";
  const boundary = isJeedimetla ? BOUNDARY : (area!.boundary as [number, number][]);
  const mapKey = area?.id ?? "jeedimetla";

  const [grids, setGrids] = useState<Grid[]>([]);
  const [emissions, setEmissions] = useState<EmissionRow[]>([]);
  const [industries, setIndustries] = useState<IndustryPoint[]>([]);
  const [selected, setSelected] = useState<Grid | null>(null);
  const [addingIndustryGrid, setAddingIndustryGrid] = useState<Grid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async () => {
      const gridQuery = area
        ? supabase.from("grids").select("*").eq("area_id", area.id)
        : supabase.from("grids").select("*");
      const industryQuery = area
        ? supabase.from("industries").select("id, category, lat, lng, grid_id, name, is_verified").eq("area_id", area.id)
        : supabase.from("industries").select("id, category, lat, lng, grid_id, name, is_verified");
      const [gRes, eRes, iRes] = await Promise.all([
        gridQuery,
        supabase.from("emissions").select("*"),
        industryQuery,
      ]);
      setGrids((gRes.data as Grid[]) ?? []);
      setEmissions((eRes.data as EmissionRow[]) ?? []);
      setIndustries(((iRes.data as unknown as IndustryPoint[]) ?? []));
      setLoading(false);
    };

    void loadMapData();

    const channel = supabase
      .channel(`emissions-map-${mapKey}-${role ?? "public"}-${refreshToken}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emissions" },
        () => {
          void loadMapData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "industries" },
        () => { void loadMapData(); }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isVerifier, refreshToken, role, area?.id, mapKey, area]);

  const filteredEmissions = useMemo(
    () => emissions.filter((e) => e.pollutant === selectedPollutant),
    [emissions, selectedPollutant]
  );

  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filteredEmissions) {
      m.set(e.grid_id, (m.get(e.grid_id) ?? 0) + Number(e.value_kg_per_day));
    }
    return m;
  }, [filteredEmissions]);

  const industriesByGrid = useMemo(() => {
    const m = new Map<string, IndustryPoint[]>();
    for (const ind of industries) {
      if (!ind.grid_id) continue;
      const arr = m.get(ind.grid_id) ?? [];
      arr.push(ind);
      m.set(ind.grid_id, arr);
    }
    return m;
  }, [industries]);

  const gridByCode = useMemo(() => {
    const m = new Map<string, Grid>();
    for (const g of grids) m.set(g.grid_code, g);
    return m;
  }, [grids]);

  if (loading) return <Skeleton className="h-[500px] w-full rounded-xl" />;

  return (
    <>
      <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-border shadow-elegant">
        <MapContainer
          key={mapKey}
          center={[area?.center_lat ?? 17.521, area?.center_lng ?? 78.452]}
          zoom={area?.default_zoom ?? 14}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds boundary={boundary} />

          <Polyline
            positions={boundary}
            pathOptions={{ color: "#22d3ee", weight: 3, opacity: 0.9, dashArray: "6 4" }}
          />

          {(isJeedimetla
            ? SURVEY_GRIDS.map((sg) => {
                const dbGrid = gridByCode.get(sg.code);
                return { key: sg.code, coords: sg.coords, dbGrid };
              })
            : grids.map((g) => ({
                key: g.grid_code,
                coords: cellPolygonFromCenter(g.lat, g.lng, area!.cell_size_deg),
                dbGrid: g,
              }))
          ).map(({ key, coords, dbGrid }) => {
            const total = dbGrid ? totals.get(dbGrid.id) ?? 0 : 0;
            const indCount = dbGrid ? industriesByGrid.get(dbGrid.id)?.length ?? 0 : 0;
            const color = emissionColor(total);
            const baseOpacity = total > 0 ? 0.45 : 0.18;
            return (
              <Polygon
                key={key}
                positions={coords}
                pathOptions={{
                  color,
                  weight: 2,
                  fillColor: color,
                  fillOpacity: baseOpacity,
                }}
                eventHandlers={{
                  click: () => {
                    if (!dbGrid) return;
                    if (isContributor && user) setAddingIndustryGrid(dbGrid);
                    else setSelected(dbGrid);
                  },
                  mouseover: (ev) => ev.target.setStyle({ fillOpacity: 0.7 }),
                  mouseout: (ev) => ev.target.setStyle({ fillOpacity: baseOpacity }),
                }}
              >
                <Tooltip direction="top" opacity={0.95} sticky>
                  <div className="text-xs">
                    <div className="font-semibold">Grid {key}</div>
                    <div>
                      {total.toFixed(1)} kg/day - {emissionLabel(total)}
                    </div>
                    <div className="text-muted-foreground">{selectedPollutant} - {indCount} industries</div>
                    {isContributor && <div className="text-primary font-semibold mt-1">Click to add industry</div>}
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

          {industries.map((ind) => {
            const isRed = ind.category === "red";
            const unverified = ind.is_verified === false;
            return (
              <CircleMarker
                key={ind.id}
                center={[ind.lat, ind.lng]}
                radius={isRed ? 5 : 3}
                pathOptions={{
                  color: isRed ? "#ef4444" : "#94a3b8",
                  fillColor: isRed ? "#ef4444" : "#cbd5e1",
                  fillOpacity: unverified ? 0.4 : 0.9,
                  weight: 1,
                  dashArray: unverified ? "3 3" : undefined,
                }}
              >
                <Tooltip direction="top" opacity={0.95}>
                  <div className="text-[11px]">
                    <span className="font-semibold">
                      {isRed ? "Red category" : "Industry"}
                      {unverified ? " · pending" : ""}
                    </span>
                    {(isVerifier || isContributor) && ind.name && (
                      <div className="text-muted-foreground">{ind.name}</div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-4 right-4 z-[400] rounded-lg bg-card/95 backdrop-blur p-3 shadow-elegant border border-border">
          <div className="text-xs font-semibold mb-2">{selectedPollutant} (kg/day)</div>
          <div className="h-2 w-32 rounded bg-gradient-emission mb-1" />
          <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
            <span>Low</span>
            <span>Severe</span>
          </div>
          <div className="text-[10px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[#ef4444]" />
              Red-category industry
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[#94a3b8]" />
              Other industry
            </div>
          </div>
        </div>
      </div>

      <GridDetailDialog
        grid={selected}
        emissions={filteredEmissions.filter((e) => e.grid_id === selected?.id)}
        selectedPollutant={selectedPollutant}
        industryCount={
          selected ? industriesByGrid.get(selected.id)?.length ?? 0 : 0
        }
        redIndustryCount={
          selected
            ? industriesByGrid.get(selected.id)?.filter((i) => i.category === "red").length ?? 0
            : 0
        }
        industryNames={
          selected && isVerifier
            ? (industriesByGrid.get(selected.id) ?? [])
                .map((i) => i.name)
                .filter((n): n is string => !!n)
            : []
        }
        onClose={() => setSelected(null)}
      />

      <AddIndustryDialog
        grid={addingIndustryGrid}
        area={area ?? null}
        onClose={() => setAddingIndustryGrid(null)}
        onCreated={() => { setAddingIndustryGrid(null); onIndustryAdded?.(); }}
      />
    </>
  );
}
