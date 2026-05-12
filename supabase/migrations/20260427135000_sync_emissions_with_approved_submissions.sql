ALTER TABLE public.emissions
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_emissions_submission_id
ON public.emissions(submission_id)
WHERE submission_id IS NOT NULL;

DROP POLICY IF EXISTS "Verifiers insert emissions" ON public.emissions;
CREATE POLICY "Verifiers insert emissions" ON public.emissions
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'verifier')
    AND EXISTS (
      SELECT 1
      FROM public.submissions s
      WHERE s.id = submission_id
        AND s.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Verifiers update emissions" ON public.emissions;
CREATE POLICY "Verifiers update emissions" ON public.emissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'verifier'))
  WITH CHECK (public.has_role(auth.uid(), 'verifier'));

DROP POLICY IF EXISTS "Verifiers delete emissions" ON public.emissions;
CREATE POLICY "Verifiers delete emissions" ON public.emissions
  FOR DELETE
  USING (public.has_role(auth.uid(), 'verifier'));

INSERT INTO public.emissions (submission_id, grid_id, source_type, industry_name, pollutant, value_kg_per_day, confidence_score)
SELECT
  s.id,
  s.grid_id,
  s.source_type,
  s.industry_name,
  s.pollutant,
  s.value_kg_per_day,
  s.confidence_score
FROM public.submissions s
WHERE s.status = 'approved'
ON CONFLICT (submission_id) DO UPDATE
SET
  grid_id = EXCLUDED.grid_id,
  source_type = EXCLUDED.source_type,
  industry_name = EXCLUDED.industry_name,
  pollutant = EXCLUDED.pollutant,
  value_kg_per_day = EXCLUDED.value_kg_per_day,
  confidence_score = EXCLUDED.confidence_score,
  updated_at = now();

DELETE FROM public.emissions e
WHERE e.submission_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.submissions s
    WHERE s.id = e.submission_id
      AND s.status <> 'approved'
  );
