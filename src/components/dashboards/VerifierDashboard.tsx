import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { EmissionMap } from "@/components/EmissionMap";
import { JeedimetlaLayoutMap } from "@/components/JeedimetlaLayoutMap";
import { StatusBadge } from "./ContributorDashboard";
import { CheckCircle2, XCircle } from "lucide-react";

interface Submission {
  id: string; contributor_id: string; grid_id: string; source_type: string; industry_name: string | null;
  value_kg_per_day: number; notes: string | null; status: string; created_at: string;
  review_comment: string | null; confidence_score: number | null;
}
interface Grid { id: string; grid_code: string; area_name: string | null; }

export function VerifierDashboard() {
  const { user } = useAuth();
  const [grids, setGrids] = useState<Grid[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [active, setActive] = useState<Submission | null>(null);

  const load = async () => {
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from("grids").select("id,grid_code,area_name"),
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
    ]);
    setGrids(g ?? []);
    setSubs((s ?? []) as Submission[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? subs : subs.filter((s) => s.status === filter);
  const counts = {
    pending: subs.filter((s) => s.status === "pending").length,
    approved: subs.filter((s) => s.status === "approved").length,
    rejected: subs.filter((s) => s.status === "rejected").length,
  };

  const review = async (action: "approved" | "rejected", comment: string, confidence: number | null) => {
    if (!active || !user) return;
    const { error } = await supabase.from("submissions").update({
      status: action,
      review_comment: comment,
      confidence_score: confidence,
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", active.id);
    if (error) { toast.error(error.message); return; }

    await supabase.from("verification_logs").insert({
      submission_id: active.id,
      reviewer_id: user.id,
      action,
      comment,
      confidence_score: confidence,
    });

    // If approved, append to emissions
    if (action === "approved") {
      await supabase.from("emissions").insert({
        grid_id: active.grid_id,
        source_type: active.source_type as any,
        industry_name: active.industry_name,
        pollutant: "PM10",
        value_kg_per_day: active.value_kg_per_day,
        confidence_score: confidence,
      });
    }

    toast.success(`Submission ${action}`);
    setActive(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Verifier Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review contributor submissions and assign confidence scores.
        </p>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Review queue</TabsTrigger>
          <TabsTrigger value="layout">Survey layout</TabsTrigger>
          <TabsTrigger value="map">Industry map</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
                {f !== "all" && <span className="ml-2 opacity-70">{counts[f]}</span>}
              </Button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No submissions in this view.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Grid</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-right">kg/day</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const g = grids.find((x) => x.id === s.grid_id);
                    return (
                      <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{g?.grid_code ?? "—"}</td>
                        <td className="px-4 py-3 capitalize">
                          {s.source_type.replace("_", " ")}
                          {s.industry_name ? ` · ${s.industry_name}` : ""}
                        </td>
                        <td className="px-4 py-3 text-right">{Number(s.value_kg_per_day).toFixed(1)}</td>
                        <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setActive(s)}>
                            Review
                          </Button>
                        </td>
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

      <ReviewDialog active={active} grids={grids} onClose={() => setActive(null)} onReview={review} />
    </div>
  );
}

function ReviewDialog({
  active, grids, onClose, onReview,
}: {
  active: Submission | null;
  grids: Grid[];
  onClose: () => void;
  onReview: (action: "approved" | "rejected", comment: string, confidence: number | null) => void;
}) {
  const [comment, setComment] = useState("");
  const [confidence, setConfidence] = useState("0.8");

  useEffect(() => {
    if (active) {
      setComment(active.review_comment ?? "");
      setConfidence(active.confidence_score?.toString() ?? "0.8");
    }
  }, [active]);

  if (!active) return null;
  const g = grids.find((x) => x.id === active.grid_id);

  return (
    <Dialog open={!!active} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review submission · {g?.grid_code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source" value={active.source_type.replace("_", " ")} />
            <Field label="Industry" value={active.industry_name ?? "—"} />
            <Field label="PM10 value" value={`${Number(active.value_kg_per_day).toFixed(1)} kg/day`} />
            <Field label="Submitted" value={new Date(active.created_at).toLocaleDateString()} />
          </div>
          {active.notes && (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
              <p className="mt-1 rounded-md bg-secondary p-3 text-sm">{active.notes}</p>
            </div>
          )}
          <div>
            <Label htmlFor="conf">Confidence score (0–1)</Label>
            <Input id="conf" type="number" step="0.05" min="0" max="1" value={confidence} onChange={(e) => setConfidence(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cmt">Review comment</Label>
            <Textarea id="cmt" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => onReview("approved", comment, parseFloat(confidence) || null)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onReview("rejected", comment, parseFloat(confidence) || null)}
            >
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium capitalize">{value}</div>
    </div>
  );
}