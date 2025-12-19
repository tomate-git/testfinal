import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const url = process.env.VITE_SUPABASE_URL || ''
const anon = process.env.VITE_SUPABASE_ANON_KEY || ''
if (!url || !anon) {
  console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant')
  process.exit(1)
}

const supabase = createClient(url, anon)

const main = async () => {
  const channel = supabase.channel('test-realtime')
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, (payload) => {
    console.log('spaces change', JSON.stringify(payload))
  })
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
    console.log('reservations change', JSON.stringify(payload))
  })
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
    console.log('messages change', JSON.stringify(payload))
  })
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
    console.log('notifications change', JSON.stringify(payload))
  })
  await channel.subscribe()
  console.log('Subscribed. Trigger changes to see events.')
  setTimeout(() => { console.log('Done'); process.exit(0) }, 10000)
}

main().catch((e) => { console.error(e); process.exit(1) })
