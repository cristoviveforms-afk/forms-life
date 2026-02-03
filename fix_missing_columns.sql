-- Add all missing columns identified in Cadastro.tsx

-- 1. Ministries Link
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS has_ministry BOOLEAN DEFAULT false;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS ministries TEXT[];

-- 2. Visitor Details
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS visitor_religion TEXT;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS visitor_prayer_request TEXT;

-- 3. Ensure family_id exists (just in case)
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS family_id UUID;
CREATE INDEX IF NOT EXISTS idx_people_family_id ON public.people(family_id);

-- 4. Reload Schema Cache (CRITICAL)
NOTIFY pgrst, 'reload schema';
