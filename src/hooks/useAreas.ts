import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Area {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  boundary: [number, number][]; // [lat,lng]
  center_lat: number;
  center_lng: number;
  default_zoom: number;
  cell_size_deg: number;
  is_active: boolean;
}

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("areas")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setAreas(((data ?? []) as unknown as Area[]));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { areas, loading, reload: load };
}