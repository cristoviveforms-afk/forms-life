-- Add 'civil_status' and other potentially missing columns to the 'people' table
-- This script is safe to run multiple times (idempotent) due to IF NOT EXISTS checks.

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

-- IMPORTANT: Reload the schema cache so the API knows about the new columns
NOTIFY pgrst, 'reload schema';
