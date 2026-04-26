
-- App role enum
CREATE TYPE public.app_role AS ENUM ('public_user', 'contributor', 'verifier');

-- Source type enum
CREATE TYPE public.source_type AS ENUM ('industry', 'transport', 'domestic', 'road_dust', 'other');

-- Submission status
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Grids table (Jeedimetla area grid cells)
CREATE TABLE public.grids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_code TEXT NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  area_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emissions table (aggregated per grid + source)
CREATE TABLE public.emissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_id UUID NOT NULL REFERENCES public.grids(id) ON DELETE CASCADE,
  source_type public.source_type NOT NULL,
  industry_name TEXT,
  pollutant TEXT NOT NULL DEFAULT 'PM10',
  value_kg_per_day NUMERIC NOT NULL DEFAULT 0,
  confidence_score NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grid_id UUID NOT NULL REFERENCES public.grids(id) ON DELETE CASCADE,
  source_type public.source_type NOT NULL,
  industry_name TEXT,
  pollutant TEXT NOT NULL DEFAULT 'PM10',
  value_kg_per_day NUMERIC NOT NULL,
  parameters JSONB,
  notes TEXT,
  status public.submission_status NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES auth.users(id),
  review_comment TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Verification logs (audit trail)
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  action public.submission_status NOT NULL,
  comment TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Security definer to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger to create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, name, email, organization)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'organization'
  );

  -- Role from signup metadata, default to public_user
  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'public_user');
  EXCEPTION WHEN OTHERS THEN
    _role := 'public_user';
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can view & update their own
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_roles: users can view their own roles; verifiers can view all
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Grids: public readable
CREATE POLICY "Anyone can view grids" ON public.grids
  FOR SELECT USING (true);

-- Emissions: public can view aggregated; industry_name only visible to verifiers (handled in app via two queries / view)
CREATE POLICY "Anyone can view emissions" ON public.emissions
  FOR SELECT USING (true);

-- Submissions: contributors see their own, verifiers see all
CREATE POLICY "Contributors view own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = contributor_id);
CREATE POLICY "Verifiers view all submissions" ON public.submissions
  FOR SELECT USING (public.has_role(auth.uid(), 'verifier'));
CREATE POLICY "Contributors create submissions" ON public.submissions
  FOR INSERT WITH CHECK (
    auth.uid() = contributor_id AND
    (public.has_role(auth.uid(), 'contributor') OR public.has_role(auth.uid(), 'verifier'))
  );
CREATE POLICY "Verifiers update submissions" ON public.submissions
  FOR UPDATE USING (public.has_role(auth.uid(), 'verifier'));

-- Verification logs: verifiers only
CREATE POLICY "Verifiers view logs" ON public.verification_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'verifier'));
CREATE POLICY "Verifiers create logs" ON public.verification_logs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'verifier') AND auth.uid() = reviewer_id);

-- Seed Jeedimetla grid cells (approx coordinates around Jeedimetla, Hyderabad: 17.51°N, 78.45°E)
INSERT INTO public.grids (grid_code, lat, lng, area_name) VALUES
('JDM-A1', 17.5180, 78.4400, 'Jeedimetla Industrial Area North'),
('JDM-A2', 17.5180, 78.4500, 'Jeedimetla Phase II'),
('JDM-A3', 17.5180, 78.4600, 'Jeedimetla East'),
('JDM-B1', 17.5100, 78.4400, 'Jeedimetla Central West'),
('JDM-B2', 17.5100, 78.4500, 'Jeedimetla Central'),
('JDM-B3', 17.5100, 78.4600, 'Jeedimetla Central East'),
('JDM-C1', 17.5020, 78.4400, 'Suraram'),
('JDM-C2', 17.5020, 78.4500, 'Jeedimetla South'),
('JDM-C3', 17.5020, 78.4600, 'Gajularamaram');

-- Seed sample emissions per grid
INSERT INTO public.emissions (grid_id, source_type, industry_name, pollutant, value_kg_per_day, confidence_score)
SELECT g.id, s.source_type, s.industry_name, 'PM10', s.val, 0.85
FROM public.grids g
CROSS JOIN (VALUES
  ('industry'::public.source_type, 'Pharma Unit Alpha', 42.5),
  ('industry'::public.source_type, 'Chemical Works Beta', 31.2),
  ('transport'::public.source_type, NULL, 18.7),
  ('domestic'::public.source_type, NULL, 9.4),
  ('road_dust'::public.source_type, NULL, 14.8)
) AS s(source_type, industry_name, val);
