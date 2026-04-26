import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Rectangle, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { emissionColor, emissionLabel } from "@/lib/emissions";
import { GridDetailDialog } from "./GridDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";

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
  source_type: string;
  industry_name: string | null;
  pollutant: string;
  value_kg_per_day: number;
  confidence_score: number | null;
}

const CELL = 0.01; // ~1km cell half-size approximation

function FitBounds({ grids }: { grids: Grid[] }) {
  const map = useMap();
  useEffect(() => {
    if (!grids.length) return;
    const lats = grids.map((g) => g.lat);
    const lngs = grids.map((g) => g.lng);
    map.fitBounds([
      [Math.min(...lats) - CELL, Math.min(...lngs) - CELL],
      [Math.max(...lats) + CELL, Math.max(...lngs) + CELL],
    ], { padding: [20, 20] });
  }, [grids, map]);
  return null;
}

export function EmissionMap() {
  const [grids, setGrids] = useState<Grid[]>([]);
  const [emissions, setEmissions] = useState<EmissionRow[]>([]);
  const [selected, setSelected] = useState<Grid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: g }, { data: e }] = await Promise.all([
        supabase.from("grids").select("*"),
        supabase.from("emissions").select("*"),
      ]);
      setGrids(g ?? []);
      setEmissions(e ?? []);
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of emissions) {
      m.set(e.grid_id, (m.get(e.grid_id) ?? 0) + Number(e.value_kg_per_day));
    }
    return m;
  }, [emissions]);

  if (loading) return <Skeleton className="h-[500px] w-full rounded-xl" />;

  return (
    <>
      <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-border shadow-elegant">
        <MapContainer
          center={[17.51, 78.45]}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds grids={grids} />
          {grids.map((g) => {
            const total = totals.get(g.id) ?? 0;
            const color = emissionColor(total);
            const bounds: [[number, number], [number, number]] = [
              [g.lat - CELL, g.lng - CELL],
              [g.lat + CELL, g.lng + CELL],
            ];
            return (
              <Rectangle
                key={g.id}
                bounds={bounds}
                pathOptions={{
                  color,
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.45,
                }}
                eventHandlers={{
                  click: () => setSelected(g),
                  mouseover: (ev) => ev.target.setStyle({ fillOpacity: 0.7 }),
                  mouseout: (ev) => ev.target.setStyle({ fillOpacity: 0.45 }),
                }}
              >
                <Tooltip direction="top" opacity={0.95}>
                  <div className="text-xs">
                    <div className="font-semibold">{g.grid_code}</div>
                    <div>{total.toFixed(1)} kg/day · {emissionLabel(total)}</div>
                  </div>
                </Tooltip>
              </Rectangle>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[400] rounded-lg bg-card/95 backdrop-blur p-3 shadow-elegant border border-border">
          <div className="text-xs font-semibold mb-2">PM10 (kg/day)</div>
          <div className="h-2 w-32 rounded bg-gradient-emission mb-1" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Low</span><span>Severe</span>
          </div>
        </div>
      </div>

      <GridDetailDialog
        grid={selected}
        emissions={emissions.filter((e) => e.grid_id === selected?.id)}
        onClose={() => setSelected(null)}
      />
    </>
  );
}