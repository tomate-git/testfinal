import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const base = process.env.VITE_ADMIN_API_BASE || 'http://localhost:8080'
const token = process.env.VITE_ADMIN_TOKEN || process.env.ADMIN_TOKEN || ''
const url = process.env.VITE_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = (url && serviceKey) ? createClient(url, serviceKey) : null

const run = async () => {
  // Test space update
  const id = 'communaute'
  const patch = { description: 'Route Admin OK', autoapprove: true }
  const resp = await fetch(`${base}/api/admin/spaces/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token
    },
    body: JSON.stringify(patch)
  })
  console.log('Status', resp.status)
  const text = await resp.text()
  console.log('Body', text)

  // Test reservation endpoints if supabase available
  if (!supabase) {
    console.log('Skip reservation tests: Supabase credentials missing')
    return
  }
  const { data: list } = await supabase.from('reservations').select('id,date,enddate,status').limit(1)
  const r = list && list[0]
  if (!r) { console.log('No reservations found'); return }
  console.log('Reservation Before', r)

  // Status update
  const respStatus = await fetch(`${base}/api/admin/reservations/${r.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ status: 'CONFIRMED' })
  })
  console.log('Status status', respStatus.status)

  // Date update
  const newDate = new Date().toISOString().split('T')[0]
  const respDate = await fetch(`${base}/api/admin/reservations/${r.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ date: newDate })
  })
  console.log('Status date', respDate.status)

  // Check-in update
  const respCheck = await fetch(`${base}/api/admin/reservations/${r.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ checkedinat: new Date().toISOString() })
  })
  console.log('Status checkin', respCheck.status)

  const { data: after } = await supabase.from('reservations').select('id,date,enddate,status,checkedinat').eq('id', r.id).limit(1)
  console.log('Reservation After', after && after[0])
}

run().catch(e => { console.error(e && e.message ? e.message : e); process.exit(1) })
