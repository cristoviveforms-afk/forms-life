const https = require('https');

const PROJECT_ID = 'kbtpayhzcgivgimvbyqe';
const TOKEN = 'sbp_9aeb7e2abc5d2f962c7277b74b98f857593d6d3c';

const QUERY = `
-- Allow NULL values for optional fields in 'people' table

ALTER TABLE public.people ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN civil_status DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN spouse_name DROP NOT NULL;

ALTER TABLE public.people ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN how_met DROP NOT NULL;

ALTER TABLE public.people ALTER COLUMN baptism_date DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN natural_skills DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN spiritual_gifts DROP NOT NULL;

ALTER TABLE public.people ALTER COLUMN visitor_religion DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN visitor_prayer_request DROP NOT NULL;

ALTER TABLE public.people ALTER COLUMN conversion_date DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN convert_needs DROP NOT NULL;

ALTER TABLE public.people ALTER COLUMN integration_date DROP NOT NULL;
ALTER TABLE public.people ALTER COLUMN member_prev_ministry DROP NOT NULL;

-- Not altering Booleans as they usually default to false, which is fine.
-- Not altering Arrays as they usually default to '{}', which is fine.

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
`;

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${PROJECT_ID}/sql`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    }
};

console.log('Executing SQL to remove NOT NULL constraints...');

const req = https.request(options, (res) => {
    console.log(`StatusCode: ${res.statusCode}`);

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
