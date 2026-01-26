
-- Accompaniments Table for Ministry Follow-up
CREATE TABLE accompaniments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    leader_name TEXT,
    contact_date DATE DEFAULT CURRENT_DATE,
    feedback TEXT,
    type TEXT, -- 'Ligação', 'WhatsApp', etc.
    status TEXT DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluido'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy
ALTER TABLE accompaniments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON accompaniments FOR ALL USING (true);
