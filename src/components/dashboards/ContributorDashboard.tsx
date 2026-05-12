import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmissionMap } from "@/components/EmissionMap";
import { JeedimetlaLayoutMap } from "@/components/JeedimetlaLayoutMap";

const schema = z.object({
  grid_id: z.string().uuid("Select a grid"),
  source_type: z.enum(["industry", "transport", "domestic", "road_dust", "other"]),
  industry_name: z.string().max(150).optional(),
  value_kg_per_day: z.coerce.number().min(0).max(100000),
  notes: z.string().max(1000).optional(),
});

interface Grid { id: string; grid_code: string; area_name: string | null; }
interface Submission {
  id: string; grid_id: string; source_type: string; industry_name: string | null;
  value_kg_per_day: number; status: string; created_at: string; review_comment: string | null;
}

export function ContributorDashboard() {
  const { user } = useAuth();
  const [grids, setGrids] = useState<Grid[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from("grids").select("id,grid_code,area_name").order("grid_code"),
      supabase.from("submissions").select("*").eq("contributor_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setGrids(g ?? []);
    setSubs((s ?? []) as Submission[]);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      grid_id: fd.get("grid_id"),
      source_type: fd.get("source_type"),
      industry_name: fd.get("industry_name") || undefined,
      value_kg_per_day: fd.get("value_kg_per_day"),
      notes: fd.get("notes") || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("submissions").insert({
      contributor_id: user!.id,
      grid_id: parsed.data.grid_id,
      source_type: parsed.data.source_type,
      industry_name: parsed.data.industry_name,
      value_kg_per_day: parsed.data.value_kg_per_day,
      notes: parsed.data.notes,
      pollutant: "PM10",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Submission sent for review");
      (e.target as HTMLFormElement).reset();
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Contributor Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit field-survey emission data for verification.</p>
      </div>

      <Tabs defaultValue="submit">
        <TabsList>
          <TabsTrigger value="submit">New submission</TabsTrigger>
          <TabsTrigger value="mine">My submissions ({subs.length})</TabsTrigger>
          <TabsTrigger value="layout">Survey layout</TabsTrigger>
          <TabsTrigger value="map">Geographic map</TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="mt-4">
          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm grid sm:grid-cols-2 gap-4 max-w-3xl">
            <div>
              <Label htmlFor="grid_id">Grid cell</Label>
              <Select name="grid_id" required>
                <SelectTrigger id="grid_id"><SelectValue placeholder="Select grid…" /></SelectTrigger>
                <SelectContent>
                  {grids.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.grid_code} — {g.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source_type">Sector</Label>
              <Select name="source_type" required defaultValue="industry">
                <SelectTrigger id="source_type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">Industry</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="road_dust">Road dust</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="industry_name">Industry / source name (optional)</Label>
              <Input id="industry_name" name="industry_name" maxLength={150} />
            </div>
            <div>
              <Label htmlFor="value_kg_per_day">PM10 (kg/day)</Label>
              <Input id="value_kg_per_day" name="value_kg_per_day" type="number" step="0.1" min="0" required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes / methodology</Label>
              <Textarea id="notes" name="notes" rows={3} maxLength={1000} placeholder="Stack tests, fuel consumption, traffic counts…" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting} className="shadow-elegant">
                {submitting ? "Submitting…" : "Submit for verification"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {subs.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No submissions yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Grid</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-right">kg/day</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Reviewer note</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => {
                    const g = grids.find((x) => x.id === s.grid_id);
                    return (
                      <tr key={s.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{g?.grid_code ?? "—"}</td>
                        <td className="px-4 py-3 capitalize">{s.source_type.replace("_", " ")}{s.industry_name ? ` · ${s.industry_name}` : ""}</td>
                        <td className="px-4 py-3 text-right">{Number(s.value_kg_per_day).toFixed(1)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.review_comment ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="layout" className="mt-4">
          <JeedimetlaLayoutMap />
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <EmissionMap />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={`capitalize ${map[status] ?? ""}`}>{status}</Badge>
  );
}