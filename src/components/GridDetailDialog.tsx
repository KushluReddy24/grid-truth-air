import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { SOURCE_LABELS, emissionLabel, emissionColor, type Pollutant } from "@/lib/emissions";
import type { Grid, EmissionRow } from "./EmissionMap";
import { Factory, Car, Home, Wind } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  industry: Factory,
  transport: Car,
  domestic: Home,
  road_dust: Wind,
  other: Wind,
};

export function GridDetailDialog({
  grid,
  emissions,
  selectedPollutant,
  industryCount,
  redIndustryCount,
  industryNames,
  onClose,
}: {
  grid: Grid | null;
  emissions: EmissionRow[];
  selectedPollutant: Pollutant;
  industryCount: number;
  redIndustryCount: number;
  industryNames: string[];
  onClose: () => void;
}) {
  const { role } = useAuth();
  const canSeeIndustry = role === "verifier";

  if (!grid) return null;

  const total = emissions.reduce((a, e) => a + Number(e.value_kg_per_day), 0);
  const color = emissionColor(total);

  const aggregated = canSeeIndustry
    ? emissions
    : Object.values(
        emissions.reduce<Record<string, EmissionRow>>((acc, e) => {
          const key = `${e.source_type}-${e.pollutant}`;
          if (!acc[key]) acc[key] = { ...e, industry_name: null };
          else acc[key] = { ...acc[key], value_kg_per_day: Number(acc[key].value_kg_per_day) + Number(e.value_kg_per_day) };
          return acc;
        }, {})
      );

  return (
    <Dialog open={!!grid} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
            />
            Grid {grid.grid_code}
          </DialogTitle>
          <DialogDescription>{grid.area_name}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-gradient-card border border-border p-4 mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total {selectedPollutant}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-3xl font-bold">{total.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">kg/day</div>
            <span
              className="ml-auto px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ backgroundColor: `${color}33`, color }}
            >
              {emissionLabel(total)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="rounded-lg border border-border p-3 bg-card">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Industries</div>
            <div className="text-xl font-semibold">{industryCount}</div>
          </div>
          <div className="rounded-lg border border-border p-3 bg-card">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Red category</div>
            <div className="text-xl font-semibold text-[hsl(var(--emiq-extreme))]">{redIndustryCount}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Source breakdown
          </div>
          {emissions.length === 0 && (
            <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3">
              No verified {selectedPollutant} emissions recorded for this grid yet.
            </div>
          )}
          {aggregated.map((e) => {
            const Icon = ICONS[e.source_type] ?? Wind;
            const pct = total > 0 ? (Number(e.value_kg_per_day) / total) * 100 : 0;
            return (
              <div key={e.id + (e.industry_name ?? "")} className="rounded-lg border border-border p-3 bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {SOURCE_LABELS[e.source_type] ?? e.source_type}
                      {canSeeIndustry && e.industry_name && (
                        <span className="text-muted-foreground font-normal"> - {e.industry_name}</span>
                      )}
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded bg-secondary overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{Number(e.value_kg_per_day).toFixed(1)}</div>
                    <div className="text-[10px] text-muted-foreground">kg/day</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {canSeeIndustry && industryNames.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Industries in this grid
            </div>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-card p-2 text-xs space-y-0.5">
              {industryNames.map((n, i) => (
                <div key={i} className="truncate text-foreground/90">{n}</div>
              ))}
            </div>
          </div>
        )}

        {!canSeeIndustry && industryCount > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {industryCount} industries surveyed in this grid. Verifiers can see industry-level names and attribution.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
