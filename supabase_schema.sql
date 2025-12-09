-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if requested (ZERO DATABASE)
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS people;

-- Create People Table
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('membro', 'visitante', 'convertido')),
    
    -- Personal
    name TEXT NOT NULL,
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
    has_cell BOOLEAN DEFAULT FALSE,
    cell_name TEXT,
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
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES people(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public access for now as per "functional" requirement, usually would be authenticated)
-- For simplicity in this dev phase:
CREATE POLICY "Enable all access for all users" ON people FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON children FOR ALL USING (true);

-- Create storage bucket if not exists (optional, for future photo upload)
-- INSERT INTO storage.buckets (id, name) VALUES ('photos', 'photos') ON CONFLICT DO NOTHING;
