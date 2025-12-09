-- Reset tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS accompaniments CASCADE;
DROP TABLE IF EXISTS ministries CASCADE;
-- Also drop the dependency attempting to block us, if we want a full reset
DROP TABLE IF EXISTS ministry_members CASCADE;

-- Ministries Table
CREATE TABLE ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    leader TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- Accompaniments Table
CREATE TABLE accompaniments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    observacoes TEXT,
    last_contact_date DATE
);

-- RLS Policies
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accompaniments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for ministries" ON ministries FOR ALL USING (true);
CREATE POLICY "Enable all access for accompaniments" ON accompaniments FOR ALL USING (true);
