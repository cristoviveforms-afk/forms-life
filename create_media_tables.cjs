const https = require('https');

const PROJECT_ID = 'kbtpayhzcgivgimvbyqe';
const TOKEN = 'sbp_9aeb7e2abc5d2f962c7277b74b98f857593d6d3c';

const QUERY = `
CREATE TABLE IF NOT EXISTS public.media_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_date DATE NOT NULL,
    title TEXT NOT NULL,
    verse TEXT,
    cta TEXT,
    target_audience TEXT,
    responsible_name TEXT,
    responsible_contact TEXT,
    media_needs TEXT[] DEFAULT '{}',
    central_message TEXT,
    tone TEXT,
    strategy TEXT CHECK (strategy IN ('pequeno', 'grande'))
);

CREATE TABLE IF NOT EXISTS public.media_demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_id UUID REFERENCES public.media_events(id) ON DELETE CASCADE,
    assignee TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'fazendo', 'concluido')),
    media_url TEXT
);

ALTER TABLE public.media_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_demands ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all access for media_events') THEN
        CREATE POLICY "Enable all access for media_events" ON public.media_events FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all access for media_demands') THEN
        CREATE POLICY "Enable all access for media_demands" ON public.media_demands FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
`;

const options = {
    hostname: 'api.supabase.com',
    path: '/v1/projects/' + PROJECT_ID + '/sql',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
    }
};

const req = https.request(options, (res) => {
    console.log('StatusCode: ' + res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(JSON.stringify({ query: QUERY }));
req.end();
