-- Add journey tracking columns to 'people' table

-- Create ENUM for journey stages if it doesn't represent string text
-- Using TEXT check constraint for simplicity in Supabase SQL editor often works better than custom types if generic
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS journey_stage TEXT CHECK (journey_stage IN ('fase1_porta', 'fase1_conexao', 'fase2_impacto', 'fase3_retorno', 'fase4_membresia', 'concluido')) DEFAULT 'fase1_porta';

ALTER TABLE public.people ADD COLUMN IF NOT EXISTS accepted_jesus BOOLEAN DEFAULT FALSE;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS feedback_first_contact TEXT;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS attendance_count INTEGER DEFAULT 1;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMPTZ DEFAULT NOW();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
