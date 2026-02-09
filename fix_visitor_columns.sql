-- Add all missing columns identified in Cadastro.tsx

-- 1. Visitor Details (The source of the error)
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS visitor_religion TEXT;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS visitor_prayer_request TEXT;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS visitor_wants_contact BOOLEAN DEFAULT false;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS visitor_wants_discipleship BOOLEAN DEFAULT false;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS visitor_first_time BOOLEAN DEFAULT false;

-- 2. Ministries Link
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS has_ministry BOOLEAN DEFAULT false;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS ministries TEXT[];

-- 3. Ensure family_id exists
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS family_id UUID;
CREATE INDEX IF NOT EXISTS idx_people_family_id ON public.people(family_id);

-- 4. Reload Schema Cache (CRITICAL for the error "Could not find ... in the schema cache")
NOTIFY pgrst, 'reload schema';
