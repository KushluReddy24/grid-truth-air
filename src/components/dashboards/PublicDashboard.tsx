import { EmissionMap } from "@/components/EmissionMap";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Grid3x3, Wind } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POLLUTANTS, type Pollutant } from "@/lib/emissions";

interface EmissionStatRow {
  source_type: string;
  value_kg_per_day: number;
  pollutant: string;
}

export function PublicDashboard() {
  const [gridCount, setGridCount] = useState(0);
  const [emissions, setEmissions] = useState<EmissionStatRow[]>([]);
  const [selectedPollutant, setSelectedPollutant] = useState<Pollutant>("PM10");

  useEffect(() => {
    const loadStats = async () => {
      const [{ count }, { data }] = await Promise.all([
        supabase.from("grids").select("*", { count: "exact", head: true }),
        supabase.from("emissions").select("source_type,value_kg_per_day,pollutant"),
      ]);
      setGridCount(count ?? 0);
      setEmissions((data ?? []) as EmissionStatRow[]);
    };

    void loadStats();

    const channel = supabase
      .channel("public-dashboard-emissions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emissions" },
        () => {
          void loadStats();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const filtered = emissions.filter((row) => row.pollutant === selectedPollutant);
    const total = filtered.reduce((sum, row) => sum + Number(row.value_kg_per_day), 0);
    const sources = new Set(filtered.map((row) => row.source_type)).size;
    return { total, sources };
  }, [emissions, selectedPollutant]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Jeedimetla Emission Grid</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click any cell to see verified totals and source breakdown for the selected pollutant.
          </p>
        </div>
        <div className="w-full max-w-[220px]">
          <Label htmlFor="public-pollutant" className="mb-2 block">Pollutant</Label>
          <Select value={selectedPollutant} onValueChange={(value) => setSelectedPollutant(value as Pollutant)}>
            <SelectTrigger id="public-pollutant"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POLLUTANTS.map((pollutant) => (
                <SelectItem key={pollutant} value={pollutant}>
                  {pollutant}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Grid3x3} label="Grid cells" value={gridCount.toString()} />
        <StatCard icon={Activity} label={`Total ${selectedPollutant}`} value={`${stats.total.toFixed(0)} kg/day`} />
        <StatCard icon={Wind} label="Source types" value={stats.sources.toString()} />
      </div>

      <EmissionMap selectedPollutant={selectedPollutant} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
