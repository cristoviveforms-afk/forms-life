const https = require('https');

const PROJECT_ID = 'kbtpayhzcgivgimvbyqe'; // NEW Project
const TOKEN = 'sbp_9aeb7e2abc5d2f962c7277b74b98f857593d6d3c'; // NEW Owner Token

// Query to Create Column if missing + Index + Reload Schema
const QUERY = `
ALTER TABLE people ADD COLUMN IF NOT EXISTS family_id UUID;
CREATE INDEX IF NOT EXISTS idx_people_family_id ON people(family_id);
NOTIFY pgrst, 'reload schema';
`;

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${PROJECT_ID}/sql`, // Correct Management API endpoint
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
