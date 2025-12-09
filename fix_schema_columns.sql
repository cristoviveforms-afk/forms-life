-- Comprehensive fix for 'people' table columns
-- This script ensures ALL columns used in the application exist in the database.
-- It is safe to run multiple times (idempotent).

-- Core Columns
ALTER TABLE people ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS address text;

-- Personal
ALTER TABLE people ADD COLUMN IF NOT EXISTS civil_status text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spouse_name text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE people ADD COLUMN IF NOT EXISTS how_met text;

-- Spiritual info
ALTER TABLE people ADD COLUMN IF NOT EXISTS baptized_water boolean DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS baptism_date date;
ALTER TABLE people ADD COLUMN IF NOT EXISTS baptized_spirit boolean DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS has_cell boolean DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS cell_name text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS natural_skills text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS spiritual_gifts text;

-- Visitor info
ALTER TABLE people ADD COLUMN IF NOT EXISTS visitor_first_time boolean DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS visitor_wants_contact boolean DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS visitor_wants_discipleship boolean DEFAULT false;

-- Convert info
ALTER TABLE people ADD COLUMN IF NOT EXISTS conversion_date date;
ALTER TABLE people ADD COLUMN IF NOT EXISTS convert_wants_accompaniment boolean DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS convert_needs text;

-- Member info
ALTER TABLE people ADD COLUMN IF NOT EXISTS integration_date date;
ALTER TABLE people ADD COLUMN IF NOT EXISTS member_has_served boolean DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS member_prev_ministry text;

-- Ensure RLS is enabled (just in case)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Ensure Policy exists (simplified for debugging/dev)
-- DO allows any operation for now to rule out permission issues
DROP POLICY IF EXISTS "Enable all access for all users" ON people;
CREATE POLICY "Enable all access for all users" ON people FOR ALL USING (true);

-- IMPORTANT: Reload the schema cache so the API knows about the new columns
NOTIFY pgrst, 'reload schema';
