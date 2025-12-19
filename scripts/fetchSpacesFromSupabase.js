import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const CONTENT_FILE = path.join(__dirname, '../public/content.json')

async function main() {
    console.log('Fetching spaces from Supabase...')
    const { data: spaces, error } = await supabase.from('spaces').select('*')

    if (error) {
        console.error('Error fetching spaces:', error)
        return
    }

    console.log(`Found ${spaces.length} spaces.`)

    // Read existing content.json to preserve structure
    let content = { spaces: [], events: [] }
    if (fs.existsSync(CONTENT_FILE)) {
        try {
            const raw = fs.readFileSync(CONTENT_FILE, 'utf8')
            content = JSON.parse(raw)
        } catch (e) {
            console.warn('Could not parse existing content.json, starting fresh.')
        }
    }

    // Update spaces
    content.spaces = spaces

    console.log('Fetching events from Supabase...')
    const { data: events, error: eventsError } = await supabase.from('events').select('*')

    if (eventsError) {
        console.warn('Error fetching events (maybe table does not exist):', eventsError.message)
    } else {
        console.log(`Found ${events.length} events.`)
        content.events = events
    }

    // Write back
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8')
    console.log(`Updated ${CONTENT_FILE} with ${spaces.length} spaces and ${content.events.length} events.`)
}

main()
