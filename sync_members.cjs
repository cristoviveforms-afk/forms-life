const https = require('https');

const PROJECT_ID = 'fqgepoacypohelxltzlb';
const TOKEN = 'sbp_20132f0306554f481da84923e728e2d68bc1f5c4';

const QUERY = `
ALTER TABLE people ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS member_role TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES people(id);
ALTER TABLE people ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Sync existing phone numbers to whatsapp if whatsapp is null
UPDATE people SET whatsapp = phone WHERE (whatsapp IS NULL OR whatsapp = '') AND phone IS NOT NULL;

NOTIFY pgrst, 'reload schema';
`;

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${PROJECT_ID}/query`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    }
};

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
