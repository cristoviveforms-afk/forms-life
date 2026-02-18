const https = require('https');

const PROJECT_ID = 'fqgepoacypohelxltzlb';
const TOKEN = 'sbp_20132f0306554f481da84923e728e2d68bc1f5c4';

const QUERY = `
UPDATE people 
SET integration_date = COALESCE(integration_date, created_at::date)
WHERE type = 'membro' AND (integration_date IS NULL OR integration_date = '');

-- Also ensure conversion_date is set for converts if missing
UPDATE people
SET conversion_date = COALESCE(conversion_date, created_at::date)
WHERE type = 'convertido' AND (conversion_date IS NULL OR conversion_date = '');

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
