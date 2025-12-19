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

async function testSync() {
    const testId = 'TEST-SYNC-' + Date.now()
    console.log(`Creating test reservation: ${testId}`)

    // Get a valid user
    const { data: users } = await supabase.from('users').select('id').limit(1)
    if (!users || users.length === 0) {
        console.error('❌ No users found to test with.')
        process.exit(1)
    }
    const validUserId = users[0].id
    console.log(`Using user ID: ${validUserId}`)

    // Use lowercase keys for direct Supabase insert
    const newRes = {
        id: testId,
        spaceid: 'communaute', // Must use valid space ID from DB
        userid: validUserId,
        date: '2025-12-31',
        slot: 'Matin',
        status: 'CONFIRMED',
        createdat: new Date().toISOString()
    }

    const { error } = await supabase.from('reservations').insert(newRes)

    if (error) {
        console.error('❌ Error inserting reservation:', error)
        process.exit(1)
    }

    console.log('✅ Reservation inserted in Supabase.')
    console.log('Waiting for sync (5s)...')

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Check file
    try {
        const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'))
        const found = data.reservations.find(r => r.id === testId)

        if (found) {
            console.log('✅ Found test reservation in content.json!')
            console.log(found)
            // Verify camelCase keys
            if (found.spaceId && !found.spaceid) {
                console.log('✅ Keys are camelCase (spaceId found)')
            } else {
                console.log('❌ Keys are NOT camelCase:', Object.keys(found))
            }
        } else {
            console.error('❌ Test reservation NOT found in content.json.')
        }
    } catch (e) {
        console.error('❌ Error reading content.json:', e)
    }

    // Cleanup
    console.log('Cleaning up skipped for inspection...')
    // await supabase.from('reservations').delete().eq('id', testId)
}

testSync()
