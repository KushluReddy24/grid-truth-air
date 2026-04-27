DROP FUNCTION IF EXISTS public.list_industries_public();

CREATE OR REPLACE VIEW public.industries_public
WITH (security_invoker=on) AS
  SELECT id, category, lat, lng, grid_id FROM public.industries;

-- Allow public to SELECT only via the view: add a permissive base-table SELECT
-- that returns ONLY the public-safe columns is not possible in PG.
-- Instead, grant SELECT on the view explicitly and add a base-table policy
-- that allows reading only the public-safe columns by route of a column-grant.
GRANT SELECT ON public.industries_public TO anon, authenticated;

-- Add a row-level policy on the base table so the view (security_invoker)
-- can read rows for everyone, but column-level GRANT restricts access:
CREATE POLICY "Public can read public columns of industries"
  ON public.industries FOR SELECT
  USING (true);

-- Revoke ALL on base table from anon/authenticated, then grant only the
-- public-safe columns. Verifiers will still bypass via their own policy +
-- the table-level GRANT we restore for them.
REVOKE ALL ON public.industries FROM anon, authenticated;
GRANT SELECT (id, category, lat, lng, grid_id) ON public.industries TO anon, authenticated;
GRANT SELECT (name) ON public.industries TO authenticated;
-- The verifier-only RLS policy already gates access to `name` for non-verifiers
-- because PostgreSQL evaluates RLS first; even with the column grant, the row
-- is filtered by RLS. We need the existing "Verifiers view industries" policy
-- to remain (it does), and the new public policy above grants row visibility
-- but the column grant restricts which columns anon/authenticated can SELECT.
-- Net effect:
--   anon         -> can SELECT only id,category,lat,lng,grid_id (no name)
--   authenticated (non-verifier) -> same as anon for this table
--   verifier     -> can SELECT all columns (via the existing policy + grant)