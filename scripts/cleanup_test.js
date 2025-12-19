import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONTENT_FILE = path.join(__dirname, '../public/galerie/content.json')

async function cleanup() {
    console.log('Checking content.json for test reservations...')
    try {
        const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'))
        const testReservations = data.reservations.filter(r => r.id.startsWith('TEST-SYNC-'))

        if (testReservations.length > 0) {
            console.log(`✅ Found ${testReservations.length} test reservations in content.json`)
            testReservations.forEach(r => {
                console.log(`- ID: ${r.id}, SpaceID: ${r.spaceId} (CamelCase: ${!!r.spaceId})`)
            })

            console.log('Cleaning up from Supabase...')
            for (const r of testReservations) {
                await supabase.from('reservations').delete().eq('id', r.id)
                console.log(`Deleted ${r.id}`)
            }
        } else {
            console.log('❌ No test reservations found in content.json')
        }
    } catch (e) {
        console.error('❌ Error reading content.json:', e)
    }
}

cleanup()
