import { useMemo, useState, useRef, useEffect } from "react";
import layoutImg from "@/assets/jeedimetla-layout.jpg";
import { BOX_POSITIONS, BOX_EMISSIONS, type BoxData } from "@/data/jeedimetlaLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const POLLUTANTS: Array<{ key: keyof Omit<BoxData["totals"], "total">; label: string; color: string }> = [
  { key: "PM10", label: "PM10", color: "hsl(var(--emiq-extreme))" },
  { key: "PM2_5", label: "PM2.5", color: "hsl(var(--emiq-high))" },
  { key: "SO2", label: "SO₂", color: "hsl(var(--emiq-mid))" },
  { key: "NO2", label: "NO₂", color: "hsl(var(--primary))" },
  { key: "CO", label: "CO", color: "hsl(var(--emiq-low))" },
  { key: "VOC", label: "VOC", color: "hsl(var(--accent))" },
];

type PollutantKey = keyof Omit<BoxData["totals"], "total">;
type MapMetric = "total" | PollutantKey;

const METRIC_OPTIONS: Array<{ value: MapMetric; label: string }> = [
  { value: "PM2_5", label: "PM2.5" },
  { value: "PM10", label: "PM10" },
  { value: "SO2", label: "SO₂" },
  { value: "NO2", label: "NO₂" },
  { value: "CO", label: "CO" },
];

// Per-metric color thresholds (kg/day). "total" stays on the original scale.
const THRESHOLDS: Record<MapMetric, [number, number, number]> = {
  total: [1, 50, 200],
  PM10: [0.5, 5, 25],
  PM2_5: [0.2, 2, 10],
  SO2: [0.5, 5, 25],
  NO2: [0.5, 5, 25],
  CO: [1, 10, 50],
};

function intensityColor(value: number, metric: MapMetric) {
  if (value <= 0) return "transparent";
  const [a, b, c] = THRESHOLDS[metric];
  if (value < a) return "hsl(var(--emiq-low) / 0.45)";
  if (value < b) return "hsl(var(--emiq-mid) / 0.55)";
  if (value < c) return "hsl(var(--emiq-high) / 0.65)";
  return "hsl(var(--emiq-extreme) / 0.75)";
}

export function JeedimetlaLayoutMap() {
  const { role, user } = useAuth();
  const canSeeIndustries = !!user && (role === "contributor" || role === "verifier");

  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null);
  const [metric, setMetric] = useState<MapMetric>("PM2_5");
  const wrapRef = useRef<HTMLDivElement>(null);

  const boxes = useMemo(
    () => Object.entries(BOX_POSITIONS).map(([n, p]) => ({ n: Number(n), x: p[0], y: p[1], data: BOX_EMISSIONS[Number(n)] })),
    []
  );

  const metricLabel = METRIC_OPTIONS.find((o) => o.value === metric)?.label ?? "Total";

  const grandTotal = useMemo(
    () =>
      Object.values(BOX_EMISSIONS).reduce(
        (a, b) => a + Number((b.totals as Record<string, number>)?.[metric] ?? 0),
        0
      ),
    [metric]
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(1, z + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  const selectedData = selected != null ? BOX_EMISSIONS[selected] : null;

  return (
    <>
      <div className="rounded-xl border border-border bg-gradient-card overflow-hidden shadow-elegant">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60">
          <div>
            <div className="text-sm font-semibold">JEEDIMETLA IDA — Survey Layout</div>
            <div className="text-xs text-muted-foreground">
              {Object.keys(BOX_EMISSIONS).length} surveyed boxes · {metricLabel} total {grandTotal.toFixed(1)} kg/day
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={metric} onValueChange={(v) => setMetric(v as MapMetric)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Pollutant" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.3))}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-secondary"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-secondary"
              aria-label="Reset"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(5, z + 0.3))}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-secondary"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={wrapRef}
          className="relative w-full overflow-hidden bg-background select-none"
          style={{ aspectRatio: "3200 / 2263", cursor: dragging ? "grabbing" : zoom > 1 ? "grab" : "default" }}
          onWheel={onWheel}
          onMouseDown={(e) => zoom > 1 && setDragging({ x: e.clientX - pan.x, y: e.clientY - pan.y })}
          onMouseMove={(e) => dragging && setPan({ x: e.clientX - dragging.x, y: e.clientY - dragging.y })}
          onMouseUp={() => setDragging(null)}
          onMouseLeave={() => setDragging(null)}
        >
          <div
            className="absolute inset-0 origin-center transition-transform"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <img
              src={layoutImg}
              alt="Jeedimetla survey layout with 200+ numbered grid boxes"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
            {boxes.map(({ n, x, y, data }) => {
              const value = data ? Number((data.totals as Record<string, number>)?.[metric] ?? 0) : 0;
              const has = !!data;
              const size = has ? Math.min(3.2, 1.4 + Math.log10(1 + value) * 0.8) : 1.0;
              return (
                <button
                  key={n}
                  onClick={() => has && setSelected(n)}
                  disabled={!has}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform ${has ? "cursor-pointer hover:scale-125 hover:ring-2 hover:ring-primary" : "cursor-default opacity-40"}`}
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    width: `${size}%`,
                    height: `${size * (3200 / 2263)}%`,
                    backgroundColor: has ? intensityColor(value, metric) : "transparent",
                    border: has ? "1.5px solid hsl(var(--foreground) / 0.6)" : "1px dashed hsl(var(--muted-foreground) / 0.4)",
                  }}
                  title={has ? `Box ${n} · ${metricLabel} ${value.toFixed(2)} kg/day` : `Box ${n} · no data`}
                  aria-label={`Box ${n}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-card/95 backdrop-blur p-3 shadow-elegant border border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2">{metricLabel} (kg/day)</div>
            <div className="space-y-1 text-[10px]">
              {(() => {
                const [a, b, c] = THRESHOLDS[metric];
                return [
                  { c: "hsl(var(--emiq-low) / 0.7)", l: `< ${a}` },
                  { c: "hsl(var(--emiq-mid) / 0.7)", l: `${a} – ${b}` },
                  { c: "hsl(var(--emiq-high) / 0.7)", l: `${b} – ${c}` },
                  { c: "hsl(var(--emiq-extreme) / 0.8)", l: `> ${c}` },
                ];
              })().map((row) => (
                <div key={row.l} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border border-foreground/40" style={{ backgroundColor: row.c }} />
                  {row.l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={selected != null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Box {selected}</DialogTitle>
            <DialogDescription>
              {canSeeIndustries
                ? "Per-industry pollutant breakdown (kg/day)"
                : "Total pollutant breakdown for this grid (kg/day)"}
            </DialogDescription>
          </DialogHeader>

          {selectedData && (
            <>
              <div className="rounded-xl bg-gradient-card border border-border p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Total pollution</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-3xl font-bold">{selectedData.totals.total.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">kg/day</div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                  {POLLUTANTS.map((p) => (
                    <div key={p.key} className="rounded-md border border-border bg-card p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.label}</div>
                      <div className="text-sm font-semibold tabular-nums">
                        {Number(selectedData.totals[p.key] ?? 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canSeeIndustries ? (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Industries in this grid ({selectedData.industries.length})
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-secondary/60">
                          <tr>
                            <th className="text-left px-2 py-2 font-semibold">Industry</th>
                            {POLLUTANTS.map((p) => (
                              <th key={p.key} className="text-right px-2 py-2 font-semibold">{p.label}</th>
                            ))}
                            <th className="text-right px-2 py-2 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedData.industries.map((ind, i) => (
                            <tr key={i} className="odd:bg-card even:bg-card/60 border-t border-border">
                              <td className="px-2 py-1.5 font-medium">{ind.name}</td>
                              {POLLUTANTS.map((p) => (
                                <td key={p.key} className="px-2 py-1.5 text-right tabular-nums">
                                  {Number(ind[p.key] ?? 0).toFixed(2)}
                                </td>
                              ))}
                              <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                                {Number(ind.total ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-3">
                  {selectedData.industries.length} industries contribute to this box. Sign in as a contributor or verifier to see per-industry attribution.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}