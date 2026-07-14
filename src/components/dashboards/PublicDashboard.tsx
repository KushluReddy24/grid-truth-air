import { EmissionMap } from "@/components/EmissionMap";
import { JeedimetlaLayoutMap } from "@/components/JeedimetlaLayoutMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Grid3x3, Wind } from "lucide-react";
import { useAreas } from "@/hooks/useAreas";
import { AreaSwitcher } from "@/components/AreaSwitcher";

export function PublicDashboard() {
  const { areas } = useAreas();
  const [areaId, setAreaId] = useState<string | null>(null);
  const [stats, setStats] = useState({ grids: 0, total: 0, sources: 0 });

  useEffect(() => {
    if (!areaId && areas.length) {
      setAreaId(areas.find((a) => a.slug === "jeedimetla")?.id ?? areas[0].id);
    }
  }, [areas, areaId]);

  const area = useMemo(() => areas.find((a) => a.id === areaId) ?? null, [areas, areaId]);

  useEffect(() => {
    if (!areaId) return;
    (async () => {
      const [{ count: gc, data: gridsData }, { data: e }] = await Promise.all([
        supabase.from("grids").select("id", { count: "exact" }).eq("area_id", areaId),
        supabase.from("emissions").select("source_type,value_kg_per_day,grid_id"),
      ]);
      const gridIds = new Set((gridsData ?? []).map((g) => g.id));
      const rows = (e ?? []).filter((r) => gridIds.has(r.grid_id));
      const total = rows.reduce((a, r) => a + Number(r.value_kg_per_day), 0);
      const sources = new Set(rows.map((r) => r.source_type)).size;
      setStats({ grids: gc ?? 0, total, sources });
    })();
  }, [areaId]);

  const isJeedimetla = area?.slug === "jeedimetla";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{area?.name ?? "Emissions"} Emission Grid</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click any cell to see total PM10 and source breakdown. Public view — no sign-in required.
          </p>
        </div>
        <AreaSwitcher areas={areas} value={areaId} onChange={setAreaId} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Grid3x3} label="Grid cells" value={stats.grids.toString()} />
        <StatCard icon={Activity} label="Total PM10" value={`${stats.total.toFixed(0)} kg/day`} />
        <StatCard icon={Wind} label="Source types" value={stats.sources.toString()} />
      </div>

      <Tabs defaultValue={isJeedimetla ? "layout" : "geo"} className="w-full">
        <TabsList>
          {isJeedimetla && <TabsTrigger value="layout">Survey layout</TabsTrigger>}
          <TabsTrigger value="geo">Geographic map</TabsTrigger>
        </TabsList>
        {isJeedimetla && (
          <TabsContent value="layout" className="mt-4">
            <JeedimetlaLayoutMap />
          </TabsContent>
        )}
        <TabsContent value="geo" className="mt-4">
          <EmissionMap area={area} />
        </TabsContent>
      </Tabs>
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