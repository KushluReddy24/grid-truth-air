-- Demo Accounts Setup Script for Supabase
-- This script assigns roles to demo accounts using their user IDs

-- Assign roles to demo accounts
-- Replace the user IDs below with the actual user IDs from your Supabase instance
INSERT INTO public.user_roles (user_id, role) 
VALUES 
  ('MU012026', 'contributor'),
  ('pcb012026', 'verifier')
ON CONFLICT (user_id, role) DO NOTHING;

-- Query 2: Verify roles were assigned
-- SELECT ur.user_id, ur.role 
-- FROM public.user_roles ur
-- WHERE ur.user_id IN ('MU012026', 'pcb012026');

-- Query 3: Clean up demo accounts (if needed)
-- DELETE FROM public.user_roles 
-- WHERE user_id IN ('MU012026', 'pcb012026');
