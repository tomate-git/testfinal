import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function checkEvents() {
    console.log('Selecting from events...')
    const { data, error } = await supabase.from('events').select('*')

    if (error) {
        console.log('❌ Error selecting events:', error)
    } else {
        console.log('✅ Events data:', data)
    }
}

checkEvents()
