import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function listTables() {
    // There is no direct listTables method in supabase-js client usually, 
    // but we can try to select from known tables or use a rpc if available.
    // Or we can try to select from information_schema if we have permissions.

    console.log('Checking tables...')

    const tables = ['users', 'spaces', 'events', 'reservations', 'messages', 'notifications']

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
        if (error) {
            console.log(`❌ Table '${table}': Error - ${error.message}`)
        } else {
            console.log(`✅ Table '${table}': Exists (Rows: ${count})`)
        }
    }
}

listTables()
