import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAreas, type Area } from "@/hooks/useAreas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { parseBoundaryFile, generateGridCells, type ParsedBoundary } from "@/lib/geo";
import { Plus, MapPin, Trash2, Upload } from "lucide-react";

export function AreaManager() {
  const { areas, reload } = useAreas();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Industrial areas</h2>
          <p className="text-xs text-muted-foreground">Add a new cluster by uploading its GeoJSON or KML boundary. Grid cells are generated automatically.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="shadow-elegant">
          <Plus className="h-4 w-4 mr-2" /> New area
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {areas.map((a) => <AreaCard key={a.id} area={a} onChange={reload} />)}
        {areas.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No areas yet. Create your first cluster.
          </div>
        )}
      </div>

      <NewAreaDialog open={open} onOpenChange={setOpen} onCreated={reload} />
    </div>
  );
}

function AreaCard({ area, onChange }: { area: Area; onChange: () => void }) {
  const [gridCount, setGridCount] = useState<number | null>(null);

  const remove = async () => {
    if (!confirm(`Delete area "${area.name}"? All grids, industries and emissions in it will be removed.`)) return;
    const { error } = await supabase.from("areas").delete().eq("id", area.id);
    if (error) toast.error(error.message);
    else { toast.success("Area deleted"); onChange(); }
  };

  const loadGridCount = async () => {
    const { count } = await supabase.from("grids").select("id", { count: "exact", head: true }).eq("area_id", area.id);
    setGridCount(count ?? 0);
  };

  return (
    <div className="rounded-xl border border-border bg-gradient-card p-4 shadow-sm" onMouseEnter={loadGridCount}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" /> {area.name}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{area.slug}</div>
        </div>
        {area.slug !== "jeedimetla" && (
          <Button size="icon" variant="ghost" onClick={remove} aria-label="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      {area.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{area.description}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div><span className="text-muted-foreground">Center:</span> {area.center_lat.toFixed(3)}, {area.center_lng.toFixed(3)}</div>
        <div><span className="text-muted-foreground">Cell:</span> ~{(area.cell_size_deg * 111).toFixed(2)} km</div>
        <div className="col-span-2"><span className="text-muted-foreground">Grid cells:</span> {gridCount ?? "—"}</div>
      </div>
    </div>
  );
}

function NewAreaDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [cellSize, setCellSize] = useState("0.0045");
  const [parsed, setParsed] = useState<ParsedBoundary | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (f: File) => {
    try {
      const text = await f.text();
      const b = parseBoundaryFile(f.name, text);
      setParsed(b);
      setFileName(f.name);
      toast.success(`Boundary loaded (${b.coords.length} points)`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const create = async () => {
    if (!user) return toast.error("Sign in first");
    if (!name.trim() || !slug.trim() || !parsed) return toast.error("Name, slug and boundary file are required");
    const cellSizeDeg = Number(cellSize);
    if (!(cellSizeDeg > 0 && cellSizeDeg < 1)) return toast.error("Cell size must be a small positive degree value");

    setBusy(true);
    // 1. insert area
    const { data: area, error } = await supabase.from("areas").insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim() || null,
      boundary: parsed.coords as unknown as never,
      center_lat: parsed.centerLat,
      center_lng: parsed.centerLng,
      cell_size_deg: cellSizeDeg,
      created_by: user.id,
    }).select("*").single();
    if (error || !area) { setBusy(false); toast.error(error?.message ?? "Insert failed"); return; }

    // 2. generate grids
    const cells = generateGridCells(parsed.coords, cellSizeDeg, area.slug);
    if (cells.length === 0) { setBusy(false); toast.error("Boundary produced 0 cells — try a smaller cell size"); return; }
    if (cells.length > 2000) { setBusy(false); toast.error(`Boundary produced ${cells.length} cells — increase cell size`); return; }

    const gridRows = cells.map((c) => ({
      grid_code: c.code,
      lat: c.lat,
      lng: c.lng,
      area_id: area.id,
      area_name: area.name,
    }));
    const { error: gErr } = await supabase.from("grids").insert(gridRows);
    if (gErr) { setBusy(false); toast.error(`Area created, but grid generation failed: ${gErr.message}`); return; }

    setBusy(false);
    toast.success(`Created "${area.name}" with ${cells.length} grid cells`);
    setName(""); setSlug(""); setDescription(""); setParsed(null); setFileName("");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New industrial area</DialogTitle>
          <DialogDescription>Upload a GeoJSON or KML polygon. A regular grid is generated inside the boundary.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="Balanagar" />
          </div>
          <div>
            <Label>Slug (URL-safe identifier)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="balanagar" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </div>
          <div>
            <Label>Cell size (degrees) — ~{(Number(cellSize) * 111).toFixed(2)} km</Label>
            <Input type="number" step="0.001" min="0.001" max="0.1" value={cellSize} onChange={(e) => setCellSize(e.target.value)} />
          </div>
          <div>
            <Label>Boundary file (.geojson / .json / .kml)</Label>
            <label className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 cursor-pointer hover:bg-secondary/40 text-sm">
              <Upload className="h-4 w-4" />
              <span className="truncate">{fileName || "Click to upload…"}</span>
              <input
                type="file"
                accept=".geojson,.json,.kml,application/json,application/vnd.google-earth.kml+xml"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
            {parsed && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {parsed.coords.length} vertices · center {parsed.centerLat.toFixed(4)}, {parsed.centerLng.toFixed(4)}
              </p>
            )}
          </div>
          <Button className="w-full" disabled={busy} onClick={create}>
            {busy ? "Creating…" : "Create area & generate grid"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}