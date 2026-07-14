import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Area } from "@/hooks/useAreas";
import { MapPin } from "lucide-react";

export function AreaSwitcher({
  areas,
  value,
  onChange,
  label = "Industrial area",
}: {
  areas: Area[];
  value: string | null;
  onChange: (id: string) => void;
  label?: string;
}) {
  if (areas.length <= 1) return null;
  return (
    <div className="max-w-xs">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
        <MapPin className="h-3 w-3" /> {label}
      </Label>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select area…" />
        </SelectTrigger>
        <SelectContent>
          {areas.map((a) => (
            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}