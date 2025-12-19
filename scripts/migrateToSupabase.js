import fs from 'fs'
import path from 'path'
import url from 'url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const __dirnameResolved = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.join(__dirnameResolved, '..')
const dataDir = path.join(root, 'data')

const urlEnv = process.env.VITE_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!urlEnv || !serviceKey) {
  console.error('VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env')
  process.exit(1)
}

const supabase = createClient(urlEnv, serviceKey)

const readJson = (name) => {
  const p = path.join(dataDir, name)
  if (!fs.existsSync(p)) return []
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

const mapUserFields = (user) => ({
  id: user.id,
  email: user.email,
  password: user.password,
  role: user.role,
  type: user.type,
  firstname: user.firstName,
  lastname: user.lastName,
  phone: user.phone,
  companyname: user.companyName,
  siret: user.siret
})

const mapSpaceFields = (space) => ({
  id: space.id,
  name: space.name,
  description: space.description,
  category: space.category,
  capacity: space.capacity,
  image: space.image,
  pricing: space.pricing,
  minduration: space.minDuration,
  maxduration: space.maxDuration,
  features: space.features,
  availableslots: space.availableSlots,
  showincalendar: space.showInCalendar,
  autoapprove: space.autoApprove,
  brochureurl: space.brochureUrl,
  brochuretype: space.brochureType,
  brochurename: space.brochureName
})

const mapReservationFields = (reservation) => ({
  id: reservation.id,
  spaceid: reservation.spaceId,
  userid: reservation.userId,
  date: reservation.date,
  enddate: reservation.endDate,
  slot: reservation.slot,
  status: reservation.status,
  createdat: reservation.createdAt,
  eventname: reservation.eventName,
  eventdescription: reservation.eventDescription,
  customtimelabel: reservation.customTimeLabel,
  isglobalclosure: reservation.isGlobalClosure,
  isquoterequest: reservation.isQuoteRequest,
  recurringgroupid: reservation.recurringGroupId,
  checkedinat: reservation.checkedInAt
})

const upsert = async (table, rows, key = 'id', mapper = null) => {
  if (!rows || !rows.length) return
  const chunks = []
  const size = 500
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size))
  for (const chunk of chunks) {
    const mappedChunk = mapper ? chunk.map(mapper) : chunk
    const { error } = await supabase.from(table).upsert(mappedChunk, { onConflict: key })
    if (error) throw error
    console.log(`[${table}] upsert ${chunk.length}`)
  }
}

const main = async () => {
  const users = readJson('users.json')
  const spaces = readJson('spaces.json')
  const reservations = readJson('reservations.json')
  const messages = readJson('messages.json')
  await upsert('users', users, 'id', mapUserFields)
  await upsert('spaces', spaces, 'id', mapSpaceFields)
  await upsert('reservations', reservations, 'id', mapReservationFields)
  await upsert('messages', messages, 'id')
  console.log('Migration terminée')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
