import { EmissionMap } from "@/components/EmissionMap";
import { JeedimetlaLayoutMap } from "@/components/JeedimetlaLayoutMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Grid3x3, Wind } from "lucide-react";

export function PublicDashboard() {
  const [stats, setStats] = useState({ grids: 0, total: 0, sources: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: gc }, { data: e }] = await Promise.all([
        supabase.from("grids").select("*", { count: "exact", head: true }),
        supabase.from("emissions").select("source_type,value_kg_per_day"),
      ]);
      const total = (e ?? []).reduce((a, r) => a + Number(r.value_kg_per_day), 0);
      const sources = new Set((e ?? []).map((r) => r.source_type)).size;
      setStats({ grids: gc ?? 0, total, sources });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Jeedimetla Emission Grid</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Click any cell to see total PM10 and source breakdown.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Grid3x3} label="Grid cells" value={stats.grids.toString()} />
        <StatCard icon={Activity} label="Total PM10" value={`${stats.total.toFixed(0)} kg/day`} />
        <StatCard icon={Wind} label="Source types" value={stats.sources.toString()} />
      </div>

      <Tabs defaultValue="layout" className="w-full">
        <TabsList>
          <TabsTrigger value="layout">Survey layout</TabsTrigger>
          <TabsTrigger value="geo">Geographic map</TabsTrigger>
        </TabsList>
        <TabsContent value="layout" className="mt-4">
          <JeedimetlaLayoutMap />
        </TabsContent>
        <TabsContent value="geo" className="mt-4">
          <EmissionMap />
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