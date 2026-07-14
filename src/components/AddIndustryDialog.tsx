import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Area } from "@/hooks/useAreas";

interface Grid {
  id: string;
  grid_code: string;
  lat: number;
  lng: number;
  area_name: string | null;
}

export function AddIndustryDialog({
  grid,
  area,
  onClose,
  onCreated,
}: {
  grid: Grid | null;
  area: Area | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user, role } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"red" | "orange" | "green" | "general">("general");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (grid) {
      setName("");
      setCategory("general");
      setLat(grid.lat.toFixed(6));
      setLng(grid.lng.toFixed(6));
    }
  }, [grid]);

  if (!grid) return null;

  const submit = async () => {
    if (!user) return toast.error("Sign in as a contributor first");
    if (!name.trim()) return toast.error("Industry name required");
    const latN = Number(lat), lngN = Number(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return toast.error("Invalid coordinates");

    setBusy(true);
    const { error } = await supabase.from("industries").insert({
      name: name.trim(),
      category,
      lat: latN,
      lng: lngN,
      grid_id: grid.id,
      area_id: area?.id ?? null,
      submitted_by: user.id,
      is_verified: role === "verifier",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(role === "verifier" ? "Industry added" : "Industry submitted — pending verification");
    onCreated();
  };

  return (
    <Dialog open={!!grid} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add industry to grid {grid.grid_code}</DialogTitle>
          <DialogDescription>
            {role === "verifier"
              ? "This industry will be immediately visible on the public map."
              : "Your submission will appear as pending until a verifier approves it."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Industry name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} placeholder="e.g. Acme Chemicals" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="red">Red (highly polluting)</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="general">General / unclassified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Latitude</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" disabled={busy} onClick={submit}>
            {busy ? "Submitting…" : role === "verifier" ? "Add industry" : "Submit for verification"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}