import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function checkColumns() {
    console.log('Selecting one space...')
    const { data, error } = await supabase.from('spaces').select('*').limit(1)

    if (error) {
        console.log('❌ Error:', error)
    } else {
        console.log('✅ Data:', data)
        if (data.length > 0) {
            console.log('Keys:', Object.keys(data[0]))
        }
    }
}

checkColumns()
