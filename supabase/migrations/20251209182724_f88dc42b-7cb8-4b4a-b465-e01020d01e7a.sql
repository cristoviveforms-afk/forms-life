-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create People Table
CREATE TABLE public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('membro', 'visitante', 'convertido')),
    
    -- Personal
    full_name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    civil_status TEXT,
    spouse_name TEXT,
    
    -- Contact
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    how_met TEXT,
    
    -- Spiritual
    baptized_water BOOLEAN DEFAULT FALSE,
    baptism_date DATE,
    baptized_spirit BOOLEAN DEFAULT FALSE,
    has_ministry BOOLEAN DEFAULT FALSE,
    ministries TEXT[] DEFAULT '{}',
    natural_skills TEXT,
    spiritual_gifts TEXT,
    
    -- Visitor Specific
    visitor_first_time BOOLEAN DEFAULT FALSE,
    visitor_wants_contact BOOLEAN DEFAULT FALSE,
    visitor_wants_discipleship BOOLEAN DEFAULT FALSE,
    
    -- Convert Specific
    conversion_date DATE,
    convert_wants_accompaniment BOOLEAN DEFAULT FALSE,
    convert_needs TEXT,
    
    -- Member Specific
    integration_date DATE,
    member_has_served BOOLEAN DEFAULT FALSE,
    member_prev_ministry TEXT
);

-- Create Children Table
CREATE TABLE public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age TEXT
);

-- Create Ministries Table
CREATE TABLE public.ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    leader TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- Create Accompaniments Table
CREATE TABLE public.accompaniments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    observacoes TEXT,
    last_contact_date DATE
);

-- Enable Row Level Security
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accompaniments ENABLE ROW LEVEL SECURITY;

-- Create Policies (public access for now)
CREATE POLICY "Enable all access for people" ON public.people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for children" ON public.children FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for ministries" ON public.ministries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for accompaniments" ON public.accompaniments FOR ALL USING (true) WITH CHECK (true);

-- Insert default ministries
INSERT INTO public.ministries (name, active) VALUES
    ('Cordão de 3 Dobras', true),
    ('Coc Teens', true),
    ('Coc Jovens', true),
    ('Voluntário', true),
    ('Dança', true),
    ('Louvor', true),
    ('Diácono', true),
    ('Pastor', true),
    ('Mestre CFB', true),
    ('Missão', true);