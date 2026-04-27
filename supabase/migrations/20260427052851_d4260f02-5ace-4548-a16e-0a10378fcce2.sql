CREATE TABLE IF NOT EXISTS public.industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  grid_id uuid REFERENCES public.grids(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifiers view industries"
  ON public.industries FOR SELECT
  USING (public.has_role(auth.uid(), 'verifier'::public.app_role));

CREATE OR REPLACE FUNCTION public.list_industries_public()
RETURNS TABLE(id uuid, category text, lat double precision, lng double precision, grid_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, category, lat, lng, grid_id FROM public.industries;
$$;

GRANT EXECUTE ON FUNCTION public.list_industries_public() TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_industries_grid_id ON public.industries(grid_id);
CREATE INDEX IF NOT EXISTS idx_industries_category ON public.industries(category);

-- Clear demo data and reseed grids with the 34 surveyed cells
DELETE FROM public.verification_logs;
DELETE FROM public.submissions;
DELETE FROM public.emissions;
DELETE FROM public.industries;
DELETE FROM public.grids;

INSERT INTO public.grids (grid_code, lat, lng, area_name) VALUES
  ('A5', 17.536539, 78.457040, 'Jeedimetla A5'),
  ('A6', 17.536599, 78.461747, 'Jeedimetla A6'),
  ('A7', 17.536660, 78.466453, 'Jeedimetla A7'),
  ('B1', 17.531781, 78.438279, 'Jeedimetla B1'),
  ('B2', 17.531842, 78.442985, 'Jeedimetla B2'),
  ('B3', 17.531903, 78.447691, 'Jeedimetla B3'),
  ('B4', 17.531963, 78.452397, 'Jeedimetla B4'),
  ('B5', 17.532024, 78.457103, 'Jeedimetla B5'),
  ('B6', 17.532084, 78.461809, 'Jeedimetla B6'),
  ('B7', 17.532145, 78.466516, 'Jeedimetla B7'),
  ('B8', 17.532205, 78.471222, 'Jeedimetla B8'),
  ('C1', 17.527266, 78.438342, 'Jeedimetla C1'),
  ('C2', 17.527327, 78.443048, 'Jeedimetla C2'),
  ('C4', 17.527448, 78.452460, 'Jeedimetla C4'),
  ('C5', 17.527509, 78.457166, 'Jeedimetla C5'),
  ('C6', 17.527569, 78.461872, 'Jeedimetla C6'),
  ('C7', 17.527629, 78.466578, 'Jeedimetla C7'),
  ('D3', 17.522873, 78.447817, 'Jeedimetla D3'),
  ('D4', 17.522933, 78.452523, 'Jeedimetla D4'),
  ('D5', 17.522994, 78.457229, 'Jeedimetla D5'),
  ('D6', 17.523054, 78.461935, 'Jeedimetla D6'),
  ('D7', 17.523114, 78.466641, 'Jeedimetla D7'),
  ('E2', 17.518297, 78.443175, 'Jeedimetla E2'),
  ('E3', 17.518358, 78.447880, 'Jeedimetla E3'),
  ('E4', 17.518418, 78.452586, 'Jeedimetla E4'),
  ('E5', 17.518479, 78.457292, 'Jeedimetla E5'),
  ('E6', 17.518539, 78.461998, 'Jeedimetla E6'),
  ('E7', 17.518599, 78.466704, 'Jeedimetla E7'),
  ('F3', 17.513843, 78.447944, 'Jeedimetla F3'),
  ('F5', 17.513964, 78.457355, 'Jeedimetla F5'),
  ('F6', 17.514024, 78.462061, 'Jeedimetla F6'),
  ('F7', 17.514084, 78.466766, 'Jeedimetla F7'),
  ('G3', 17.509328, 78.448007, 'Jeedimetla G3'),
  ('G4', 17.509388, 78.452712, 'Jeedimetla G4');