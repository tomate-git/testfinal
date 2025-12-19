import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.VITE_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!url || !serviceKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const run = async () => {
  const { data: list, error: readErr } = await supabase
    .from('spaces')
    .select('id,name,description,autoapprove')
    .order('id')
    .limit(1)
  if (readErr) throw readErr
  const s = list && list[0]
  if (!s) throw new Error('No spaces found')
  console.log('Before', s)
  const patch = { description: `${s.description} [TEST]`, autoapprove: true }
  const { error: updErr } = await supabase
    .from('spaces')
    .update(patch)
    .eq('id', s.id)
  if (updErr) throw updErr
  const { data: after, error: afterErr } = await supabase
    .from('spaces')
    .select('id,name,description,autoapprove')
    .eq('id', s.id)
    .limit(1)
  if (afterErr) throw afterErr
  console.log('After', after && after[0])
}

run().catch(e => { console.error(e && e.message ? e.message : e); process.exit(1) })
