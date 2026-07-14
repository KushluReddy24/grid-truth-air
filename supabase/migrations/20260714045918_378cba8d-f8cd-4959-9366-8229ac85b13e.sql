
-- 1. Areas table
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  boundary JSONB NOT NULL,  -- GeoJSON polygon: array of [lat,lng] pairs
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  default_zoom INTEGER NOT NULL DEFAULT 14,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT ALL ON public.areas TO service_role;

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Verifiers manage areas insert" ON public.areas FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'verifier'::app_role));
CREATE POLICY "Verifiers manage areas update" ON public.areas FOR UPDATE
  USING (public.has_role(auth.uid(), 'verifier'::app_role));
CREATE POLICY "Verifiers manage areas delete" ON public.areas FOR DELETE
  USING (public.has_role(auth.uid(), 'verifier'::app_role));

-- 2. Add area_id to grids & industries
ALTER TABLE public.grids ADD COLUMN area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE;
ALTER TABLE public.industries ADD COLUMN area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE;
ALTER TABLE public.industries ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.industries ADD COLUMN submitted_by UUID REFERENCES auth.users(id);

CREATE INDEX idx_grids_area ON public.grids(area_id);
CREATE INDEX idx_industries_area ON public.industries(area_id);

-- 3. Backfill Jeedimetla as default area
INSERT INTO public.areas (name, slug, description, boundary, center_lat, center_lng, default_zoom)
VALUES (
  'Jeedimetla',
  'jeedimetla',
  'Jeedimetla Industrial Development Area, Hyderabad',
  '[[17.5155,78.4380],[17.5155,78.4640],[17.5290,78.4640],[17.5290,78.4380]]'::jsonb,
  17.521, 78.452, 14
);

UPDATE public.grids SET area_id = (SELECT id FROM public.areas WHERE slug='jeedimetla') WHERE area_id IS NULL;
UPDATE public.industries SET area_id = (SELECT id FROM public.areas WHERE slug='jeedimetla'), is_verified = true WHERE area_id IS NULL;

-- 4. Now enforce NOT NULL on area_id for grids
ALTER TABLE public.grids ALTER COLUMN area_id SET NOT NULL;

-- 5. Contributors can insert industries (unverified); verifiers manage everything
CREATE POLICY "Contributors add industries" ON public.industries FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by
    AND (public.has_role(auth.uid(), 'contributor'::app_role) OR public.has_role(auth.uid(), 'verifier'::app_role))
    AND (is_verified = false OR public.has_role(auth.uid(), 'verifier'::app_role))
  );

CREATE POLICY "Verifiers update industries" ON public.industries FOR UPDATE
  USING (public.has_role(auth.uid(), 'verifier'::app_role));

CREATE POLICY "Verifiers delete industries" ON public.industries FOR DELETE
  USING (public.has_role(auth.uid(), 'verifier'::app_role));

GRANT INSERT ON public.industries TO authenticated;
GRANT UPDATE, DELETE ON public.industries TO authenticated;

-- 6. updated_at trigger for areas
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER areas_set_updated_at BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
