const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SOURCE_URL = process.env.VITE_SUPABASE_URL;
const SOURCE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEST_PROJECT_ID = 'qnbsefixwcudppkiljxq';
const DEST_URL = `https://${DEST_PROJECT_ID}.supabase.co`;

// Read destination keys from keys.json
let DEST_KEY = '';
try {
    const keysPath = path.resolve(__dirname, '../keys.json');
    // Handle potential encoding issues by reading as buffer and converting
    const keysContent = fs.readFileSync(keysPath).toString('utf8').replace(/^\uFEFF/, ''); // Remove BOM if present
    const keys = JSON.parse(keysContent);
    const serviceKeyObj = keys.find(k => k.name === 'service_role');
    if (serviceKeyObj) {
        DEST_KEY = serviceKeyObj.api_key;
    } else {
        console.error('Service role key not found in keys.json');
        process.exit(1);
    }
} catch (e) {
    console.error('Error reading keys.json:', e);
    process.exit(1);
}

if (!SOURCE_URL || !SOURCE_KEY || !DEST_URL || !DEST_KEY) {
    console.error('Missing credentials');
    console.log('SOURCE_URL:', SOURCE_URL);
    console.log('SOURCE_KEY:', SOURCE_KEY ? 'Found' : 'Missing');
    console.log('DEST_URL:', DEST_URL);
    console.log('DEST_KEY:', DEST_KEY ? 'Found' : 'Missing');
    process.exit(1);
}

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY);
const destClient = createClient(DEST_URL, DEST_KEY);

const tables = ['users', 'spaces', 'reservations', 'messages', 'notifications'];

async function transferTable(table) {
    console.log(`Reading ${table} from source...`);
    const { data, error } = await sourceClient.from(table).select('*');

    if (error) {
        console.error(`Error reading ${table}:`, error);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`No data in ${table}`);
        return;
    }

    console.log(`Transferring ${data.length} rows to ${table}...`);

    // Insert in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const { error: insertError } = await destClient.from(table).upsert(chunk);

        if (insertError) {
            console.error(`Error inserting into ${table}:`, insertError);
        } else {
            console.log(`Inserted chunk ${i / chunkSize + 1}`);
        }
    }
}

async function main() {
    for (const table of tables) {
        await transferTable(table);
    }
    console.log('Migration complete!');
}

main().catch(console.error);
