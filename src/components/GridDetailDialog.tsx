import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { SOURCE_LABELS, emissionLabel, emissionColor } from "@/lib/emissions";
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
  onClose,
}: {
  grid: Grid | null;
  emissions: EmissionRow[];
  onClose: () => void;
}) {
  const { role } = useAuth();
  const canSeeIndustry = role === "verifier";

  if (!grid) return null;

  const total = emissions.reduce((a, e) => a + Number(e.value_kg_per_day), 0);
  const color = emissionColor(total);

  // Aggregate by source for non-verifiers
  const aggregated = canSeeIndustry
    ? emissions
    : Object.values(
        emissions.reduce<Record<string, EmissionRow>>((acc, e) => {
          const k = e.source_type;
          if (!acc[k]) acc[k] = { ...e, industry_name: null };
          else acc[k] = { ...acc[k], value_kg_per_day: Number(acc[k].value_kg_per_day) + Number(e.value_kg_per_day) };
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
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total PM10</div>
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

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Source breakdown
          </div>
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
                        <span className="text-muted-foreground font-normal"> · {e.industry_name}</span>
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

        {!canSeeIndustry && (
          <p className="text-xs text-muted-foreground mt-2">
            Industry-level breakdown is restricted. Verifiers can view per-industry attribution.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}