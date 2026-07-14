
ALTER TABLE public.areas ADD COLUMN cell_size_deg DOUBLE PRECISION NOT NULL DEFAULT 0.0045;
UPDATE public.areas SET cell_size_deg = 0.0045 WHERE slug = 'jeedimetla';
