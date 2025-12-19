import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// --- CONFIGURATION ---
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080
const ADMIN_TOKEN = process.env.VITE_ADMIN_TOKEN || process.env.ADMIN_TOKEN || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// --- INITIALISATION ---
// Supabase est gardé pour l'auth user si besoin, mais on priorise le local pour les data
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const app = express()

// Middleware de base
app.use(cors({ origin: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Configuration des fichiers
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONTENT_FILE = path.join(__dirname, '../public/galerie/content.json')
const GALLERY_DIR = path.join(__dirname, '../public/galerie')

// Création du dossier galerie s'il n'existe pas
if (!fs.existsSync(GALLERY_DIR)) {
  fs.mkdirSync(GALLERY_DIR, { recursive: true })
}

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, GALLERY_DIR)
  },
  filename: function (req, file, cb) {
    // On garde le nom d'origine pour éviter les doublons si le fichier est le même
    // On nettoie juste le nom pour éviter les problèmes de chemin
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    cb(null, safeName)
  }
})
const upload = multer({ storage: storage })

// --- FONCTIONS UTILITAIRES ---

const toCamelCase = (obj) => {
  if (!obj) return obj
  const newObj = {}
  for (const key in obj) {
    let newKey = key
    if (key === 'spaceid') newKey = 'spaceId'
    else if (key === 'userid') newKey = 'userId'
    else if (key === 'enddate') newKey = 'endDate'
    else if (key === 'eventname') newKey = 'eventName'
    else if (key === 'eventdescription') newKey = 'eventDescription'
    else if (key === 'eventimage') newKey = 'eventImage'
    else if (key === 'customtimelabel') newKey = 'customTimeLabel'
    else if (key === 'isglobalclosure') newKey = 'isGlobalClosure'
    else if (key === 'isquoterequest') newKey = 'isQuoteRequest'
    else if (key === 'recurringgroupid') newKey = 'recurringGroupId'
    else if (key === 'checkedinat') newKey = 'checkedInAt'
    else if (key === 'autoapprove') newKey = 'autoApprove'
    else if (key === 'brochureurl') newKey = 'brochureUrl'
    else if (key === 'brochuretype') newKey = 'brochureType'
    else if (key === 'brochurename') newKey = 'brochureName'
    else if (key === 'availableslots') newKey = 'availableSlots'
    else if (key === 'showincalendar') newKey = 'showInCalendar'
    else if (key === 'minduration') newKey = 'minDuration'
    else if (key === 'maxduration') newKey = 'maxDuration'
    newObj[newKey] = obj[key]
  }
  return newObj
}

const toLowerCaseKeys = (obj) => {
  if (!obj) return obj
  const newObj = {}
  for (const key in obj) {
    newObj[key.toLowerCase()] = obj[key]
  }
  return newObj
}

/**
 * Lit le contenu du fichier JSON
 * @returns {Object} Les données (spaces, events, reservations)
 */
const readContent = () => {
  try {
    if (!fs.existsSync(CONTENT_FILE)) {
      // Si le fichier n'existe pas, on essaie de le générer depuis Supabase
      console.warn(`Fichier de contenu introuvable: ${CONTENT_FILE}. Tentative de synchronisation...`)
      syncContent().catch(err => console.error("Echec de la synchro initiale:", err))
      return { spaces: [], events: [], reservations: [] }
    }
    const data = fs.readFileSync(CONTENT_FILE, 'utf8')
    const parsed = JSON.parse(data)
    // Garantir la structure minimale
    if (!parsed.spaces) parsed.spaces = []
    if (!parsed.events) parsed.events = []
    if (!parsed.reservations) parsed.reservations = []
    if (!parsed.settings) parsed.settings = { brandBg: '#1e3a8a', brandAccent: '#facc15', youtubeUrl: '', instagramUrl: '', tiktokUrl: '' }
    return parsed
  } catch (e) {
    console.error('Erreur lors de la lecture de content.json:', e)
    return { spaces: [], events: [], reservations: [], settings: { brandBg: '#1e3a8a', brandAccent: '#facc15', youtubeUrl: '', instagramUrl: '', tiktokUrl: '' } }
  }
}

/**
 * Écrit les données dans le fichier JSON
 * @param {Object} data Les données à écrire
 * @returns {boolean} Succès ou échec
 */
const writeContent = (data) => {
  try {
    // Créer le dossier parent si nécessaire
    const dir = path.dirname(CONTENT_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (e) {
    console.error('Erreur lors de l\'écriture de content.json:', e)
    return false
  }
}

/**
 * Synchronise les données depuis Supabase vers le fichier JSON local (Cache Public)
 * Anonymise les réservations.
 */
const syncContent = async () => {
  console.log('🔄 Synchronisation Supabase -> JSON...')

  let spaces = []
  let events = []
  let reservations = []

  try {
    const spacesRes = await supabase.from('spaces').select('*')
    if (spacesRes.error) console.error('❌ Erreur sync spaces:', spacesRes.error)
    else spaces = spacesRes.data || []
  } catch (e) { console.error('❌ Exception sync spaces:', e) }

  try {
    const eventsRes = await supabase.from('events').select('*')
    if (eventsRes.error) console.error('❌ Erreur sync events:', eventsRes.error)
    else events = eventsRes.data || []
  } catch (e) { console.error('❌ Exception sync events:', e) }

  try {
    const reservationsRes = await supabase.from('reservations').select('*')
    if (reservationsRes.error) {
      console.error('❌ Erreur sync reservations:', JSON.stringify(reservationsRes.error, null, 2))
    } else {
      reservations = reservationsRes.data || []
      console.log(`✅ Reservations synced: ${reservations.length} items`)
    }
  } catch (e) { console.error('❌ Exception sync reservations:', e) }

  try {
    // Anonymisation des réservations pour le public
    // Note: reservations contains raw DB data (lowercase keys)
    // We map to camelCase first
    const mappedReservations = reservations.map(toCamelCase)

    const publicReservations = mappedReservations.map(r => ({
      id: r.id,
      spaceId: r.spaceId,
      date: r.date,
      endDate: r.endDate,
      slot: r.slot,
      status: r.status,
      createdAt: r.createdAt,
      isGlobalClosure: r.isGlobalClosure,
      customTimeLabel: r.customTimeLabel
    }))

    const processedSpaces = spaces.map(toCamelCase).map(space => {
      if (space.id === 'salle-focus') {
        return { ...space, image: '/galerie/studio.jpg' };
      }
      return space;
    });

    const existing = readContent()
    const publicData = {
      spaces: processedSpaces,
      events: events.map(toCamelCase),
      reservations: publicReservations,
      settings: existing.settings || { brandBg: '#1e3a8a', brandAccent: '#facc15', youtubeUrl: '', instagramUrl: '', tiktokUrl: '' }
    }

    writeContent(publicData)
    console.log('✅ Synchronisation terminée (Partielle si erreurs ci-dessus).')
  } catch (e) {
    console.error('❌ Erreur lors de l\'écriture du contenu:', e)
  }
}

// --- REALTIME SUBSCRIPTION ---
// Écoute les changements sur les tables pour mettre à jour le JSON local
supabase.channel('public-sync')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, syncContent)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, syncContent)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, syncContent)
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('📡 Connecté à Supabase Realtime (Sync activé)')
      // Synchro initiale au démarrage
      syncContent()
    }
  })

// --- ROUTES PUBLIQUES (Sans Authentification) ---

// Récupérer tout le contenu
app.get('/api/public/content', (req, res) => {
  try {
    const data = readContent()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur lors de la lecture du contenu" })
  }
})

// Récupérer les paramètres globaux (ex: thème)
app.get('/api/public/settings', (req, res) => {
  try {
    const data = readContent()
    res.json(data.settings || { brandBg: '#1e3a8a', brandAccent: '#facc15' })
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur lors de la lecture des paramètres" })
  }
})

// Récupérer uniquement les espaces
app.get('/api/public/spaces', (req, res) => {
  try {
    const data = readContent()
    res.json(data.spaces)
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur lors de la lecture des espaces" })
  }
})

// Récupérer uniquement les événements
app.get('/api/public/events', (req, res) => {
  try {
    const data = readContent()
    res.json(data.events)
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur lors de la lecture des événements" })
  }
})

// Récupérer uniquement les réservations (pour le calendrier public par exemple)
app.get('/api/public/reservations', (req, res) => {
  try {
    const data = readContent()
    res.json(data.reservations)
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur lors de la lecture des réservations" })
  }
})

// --- ADMIN: Paramètres globaux ---
app.patch('/api/admin/settings', (req, res) => {
  try {
    const token = req.headers['x-admin-token']
    if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const { brandBg, brandAccent, youtubeUrl, instagramUrl, tiktokUrl } = req.body || {}
    const data = readContent()
    const next = { ...data, settings: { 
      brandBg: typeof brandBg === 'string' ? brandBg : (data.settings?.brandBg || '#1e3a8a'),
      brandAccent: typeof brandAccent === 'string' ? brandAccent : (data.settings?.brandAccent || '#facc15'),
      youtubeUrl: typeof youtubeUrl === 'string' ? youtubeUrl : (data.settings?.youtubeUrl || ''),
      instagramUrl: typeof instagramUrl === 'string' ? instagramUrl : (data.settings?.instagramUrl || ''),
      tiktokUrl: typeof tiktokUrl === 'string' ? tiktokUrl : (data.settings?.tiktokUrl || '')
    } }
    writeContent(next)
    res.json(next.settings)
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour des paramètres" })
  }
})

// --- AUTHENTIFICATION (Forgot Password) ---
import crypto from 'crypto'

// POST demande de réinitialisation
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: "Email requis" })

  try {
    const { data: user, error } = await supabase.from('users').select('id').eq('email', email).single()

    if (error || !user) {
      return res.json({ success: true, message: "Si cet email existe, un lien a été envoyé." })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000).toISOString() // 1 heure

    const { error: insertError } = await supabase.from('password_resets').insert({
      email,
      token,
      expires_at: expiresAt
    })

    if (insertError) throw insertError

    if (mailtrapClient) {
      const resetLink = `${process.env.VITE_ADMIN_API_BASE?.replace(':8080', ':5173') || 'http://localhost:5173'}/#/reset-password?token=${token}`

      const sender = {
        email: MAILTRAP_SENDER_EMAIL,
        name: "Maison de l'ESS",
      }

      await mailtrapClient.send({
        from: sender,
        to: [{ email }],
        subject: "Réinitialisation de votre mot de passe",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Mot de passe oublié ?</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour en définir un nouveau :</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Réinitialiser mon mot de passe</a>
            <p>Ce lien est valide pendant 1 heure.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>
        `,
        category: "Password Reset",
      })
    }

    res.json({ success: true, message: "Si cet email existe, un lien a été envoyé." })

  } catch (e) {
    console.error("Erreur forgot password:", e)
    res.status(500).json({ error: "Une erreur est survenue" })
  }
})

// POST nouveau mot de passe
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: "Token et mot de passe requis" })

  try {
    const { data: resetRequest, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !resetRequest) {
      return res.status(400).json({ error: "Lien invalide ou expiré" })
    }

    const { data: user } = await supabase.from('users').select('id').eq('email', resetRequest.email).single()

    if (!user) {
      return res.status(400).json({ error: "Utilisateur introuvable" })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    )

    if (updateError) throw updateError

    await supabase.from('password_resets').delete().eq('email', resetRequest.email)

    res.json({ success: true, message: "Mot de passe mis à jour avec succès" })

  } catch (e) {
    console.error("Erreur reset password:", e)
    res.status(500).json({ error: "Erreur lors de la mise à jour du mot de passe" })
  }
})

// --- MIDDLEWARE D'AUTHENTIFICATION ---
app.use((req, res, next) => {
  const token = req.header('x-admin-token')
  if (!ADMIN_TOKEN) {
    console.warn('Token admin non configuré, accès autorisé (DEV MODE)')
    return next()
  }
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Token invalide' })
  }
  next()
})

// --- ROUTES ADMIN (Authentifiées) ---

// Upload d'image
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier envoyé' })
  }
  // Retourne le chemin relatif accessible publiquement
  // On utilise /gallery/ car c'est là qu'on stocke maintenant
  const publicPath = `/galerie/${req.file.filename}`
  res.json({ url: publicPath })
})

// --- GESTION DES ESPACES ---

// GET espaces (Admin)
// GET espaces (Admin - Direct Supabase)
app.get('/api/admin/spaces', async (req, res) => {
  try {
    const { data, error } = await supabase.from('spaces').select('*')
    if (error) throw error
    res.json(data.map(toCamelCase))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT mettre à jour un espace
// PUT mettre à jour un espace
app.put('/api/admin/spaces/:id', async (req, res) => {
  const id = req.params.id
  const body = req.body || {}
  try {
    const dbBody = toLowerCaseKeys(body)
    const { data, error } = await supabase.from('spaces').update(dbBody).eq('id', id).select().single()
    if (error) throw error
    res.json(toCamelCase(data))
    // La synchro Realtime mettra à jour le JSON
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST créer un espace
// POST créer un espace
app.post('/api/admin/spaces', async (req, res) => {
  const body = req.body
  if (!body.id || !body.name) {
    return res.status(400).json({ error: "ID et Nom requis" })
  }
  try {
    const dbBody = toLowerCaseKeys(body)
    const { data, error } = await supabase.from('spaces').insert(dbBody).select().single()
    if (error) throw error
    res.json(toCamelCase(data))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE supprimer un espace
// DELETE supprimer un espace
app.delete('/api/admin/spaces/:id', async (req, res) => {
  const id = req.params.id
  try {
    const { error } = await supabase.from('spaces').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- GESTION DES ÉVÉNEMENTS ---

// GET événements (Admin)
// GET événements (Admin - Direct Supabase)
app.get('/api/admin/events', async (req, res) => {
  try {
    const { data, error } = await supabase.from('events').select('*')
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.use('/api/admin/events', async (req, res, next) => {
  if (req.method !== 'POST') return next()
  const body = req.body
  const name = body.eventname || body.eventName || body.title
  if (!body.date) {
    return res.status(400).json({ error: "Date requise" })
  }
  try {
    const payload = { ...body }
    if (!payload.id) {
      payload.id = Date.now().toString()
    }
    if (!payload.eventname) {
      payload.eventname = name || 'Sans titre'
    }
    const lower = toLowerCaseKeys(payload)
    const allowed = ['id','eventname','date','enddate','customtimelabel','eventimage','eventdescription','location','spaceid']
    const dbBody = Object.fromEntries(Object.entries(lower).filter(([k]) => allowed.includes(k)))
    const { data, error } = await supabase.from('events').insert(dbBody).select().single()
    if (error) throw error
    const toYMD = (iso) => {
      if (!iso) return null
      const d = new Date(iso)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    const startYMD = toYMD(payload.date)
    const endYMD = toYMD(payload.enddate) || startYMD
    const spaceIdsRaw = Array.isArray(payload.spaceids) ? payload.spaceids : (payload.spaceid ? [payload.spaceid] : [])
    let sysUserId = null
    try {
      const { data: users } = await supabase.from('users').select('id').limit(1)
      sysUserId = users && users.length ? users[0].id : null
    } catch (e) {}
    for (const s of spaceIdsRaw) {
      const closureId = `r_evt_${payload.id}_${s}`
      try {
        await supabase.from('reservations').insert({
          id: closureId,
          spaceid: s,
          userid: sysUserId,
          date: startYMD,
          enddate: endYMD,
          slot: 'Journée Entière',
          status: 'CONFIRMED',
          isglobalclosure: true,
          createdat: new Date().toISOString()
        })
      } catch (e) {}
    }
    const createdEvent = toCamelCase(data)
    const content = readContent()
    const existingEvents = Array.isArray(content.events) ? content.events : []
    const nextEvents = [...existingEvents.filter(e => e.id !== createdEvent.id), createdEvent]
    writeContent({ ...content, events: nextEvents })
    await syncContent()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST créer un événement
// POST créer un événement
app.post('/api/admin/events', async (req, res) => {
  const body = req.body
  const name = body.eventname || body.eventName || body.title
  console.log('POST /api/admin/events payload', body)
  console.log('Resolved name/date', name, body.date)
  if (!body.date) {
    return res.status(400).json({ error: "Date requise" })
  }

  try {
    const payload = { ...body }
    if (!payload.id) {
      payload.id = Date.now().toString()
    }
    if (!payload.eventname) {
      payload.eventname = name || 'Sans titre'
    }
    const lower = toLowerCaseKeys(payload)
    const allowed = ['id','eventname','date','enddate','customtimelabel','eventimage','eventdescription','location','spaceid']
    const dbBody = Object.fromEntries(Object.entries(lower).filter(([k]) => allowed.includes(k)))
    const { data, error } = await supabase.from('events').insert(dbBody).select().single()
    if (error) throw error
    // Create closure reservations for selected spaces
    const toYMD = (iso) => {
      if (!iso) return null
      const d = new Date(iso)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    const startYMD = toYMD(payload.date)
    const endYMD = toYMD(payload.enddate) || startYMD
    const spaceIdsRaw = Array.isArray(payload.spaceids) ? payload.spaceids : (payload.spaceid ? [payload.spaceid] : [])
    // Resolve a valid user id for closure records (FK safety)
    let sysUserId = null
    try {
      const { data: users } = await supabase.from('users').select('id').limit(1)
      sysUserId = users && users.length ? users[0].id : null
    } catch (e) { console.error('Failed to resolve system user for closures', e) }
    for (const s of spaceIdsRaw) {
      const closureId = `r_evt_${payload.id}_${s}`
      try {
        await supabase.from('reservations').insert({
          id: closureId,
          spaceid: s,
          userid: sysUserId,
          date: startYMD,
          enddate: endYMD,
          slot: 'Journée Entière',
          status: 'CONFIRMED',
          isglobalclosure: true,
          createdat: new Date().toISOString()
        })
      } catch (e) { console.error('Failed to create closure reservation', e) }
    }
    // Immediate local cache update for events
    const createdEvent = toCamelCase(data)
    const content = readContent()
    const existingEvents = Array.isArray(content.events) ? content.events : []
    const nextEvents = [...existingEvents.filter(e => e.id !== createdEvent.id), createdEvent]
    writeContent({ ...content, events: nextEvents })
    await syncContent()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT mettre à jour un événement
// PUT mettre à jour un événement
app.put('/api/admin/events/:id', async (req, res) => {
  const id = req.params.id
  const body = req.body
  try {
    const lower = toLowerCaseKeys(body)
    const allowed = ['eventname','date','enddate','customtimelabel','eventimage','eventdescription','location','spaceid']
    const dbBody = Object.fromEntries(Object.entries(lower).filter(([k]) => allowed.includes(k)))
    const { data, error } = await supabase.from('events').update(dbBody).eq('id', id).select().single()
    if (error) throw error
    // Recreate closure reservations according to latest payload
    try {
      await supabase.from('reservations').delete().like('id', `r_evt_${id}_%`)
    } catch (e) { console.error('Failed to cleanup old closures', e) }

    const toYMD = (iso) => {
      if (!iso) return null
      const d = new Date(iso)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    const startYMD = toYMD(body.date)
    const endYMD = toYMD(body.enddate) || startYMD
    const spaceIdsRaw = Array.isArray(body.spaceids) ? body.spaceids : (body.spaceid ? [body.spaceid] : [])
    // Resolve a valid user id for closure records (FK safety)
    let sysUserId = null
    try {
      const { data: users } = await supabase.from('users').select('id').limit(1)
      sysUserId = users && users.length ? users[0].id : null
    } catch (e) { console.error('Failed to resolve system user for closures', e) }
    for (const s of spaceIdsRaw) {
      const closureId = `r_evt_${id}_${s}`
      try {
        await supabase.from('reservations').insert({
          id: closureId,
          spaceid: s,
          userid: sysUserId,
          date: startYMD,
          enddate: endYMD,
          slot: 'Journée Entière',
          status: 'CONFIRMED',
          isglobalclosure: true,
          createdat: new Date().toISOString()
        })
      } catch (e) { console.error('Failed to create closure reservation', e) }
    }

    // Update local cache for events
    const existing = readContent()
    const updatedEvent = toCamelCase(data)
    const mergedEvents = (existing.events || []).map(e => e.id === id ? updatedEvent : e)
    writeContent({ ...existing, events: mergedEvents })
    await syncContent()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE supprimer un événement
// DELETE supprimer un événement
app.delete('/api/admin/events/:id', async (req, res) => {
  const id = req.params.id
  try {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw error
    // Remove closure reservations and update local JSON
    try {
      await supabase.from('reservations').delete().like('id', `r_evt_${id}_%`)
    } catch (e) { console.error('Failed to delete closures for event', e) }
    const content = readContent()
    const nextEvents = (content.events || []).filter(e => e.id !== id)
    writeContent({ ...content, events: nextEvents })
    await syncContent()
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- GESTION DES RÉSERVATIONS (LOCALE) ---

// GET réservations (Admin)
// GET réservations (Admin - Direct Supabase)
app.get('/api/admin/reservations', async (req, res) => {
  try {
    const { data, error } = await supabase.from('reservations').select('*')
    if (error) throw error
    res.json(data.map(toCamelCase))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST créer une réservation
// POST créer une réservation
app.post('/api/admin/reservations', async (req, res) => {
  const body = req.body
  try {
    if (!body.id) {
      body.id = 'r' + Date.now().toString()
    }
    // Ajout de timestamp si manquant
    if (!body.createdAt) {
      body.createdAt = new Date().toISOString()
    }

    const dbBody = toLowerCaseKeys(body)
    const { data, error } = await supabase.from('reservations').insert(dbBody).select().single()
    if (error) throw error
    res.json(toCamelCase(data))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH/PUT mettre à jour une réservation
// PATCH/PUT mettre à jour une réservation
app.patch('/api/admin/reservations/:id', async (req, res) => {
  const id = req.params.id
  const patch = req.body || {}
  try {
    const dbPatch = toLowerCaseKeys(patch)
    const { data, error } = await supabase.from('reservations').update(dbPatch).eq('id', id).select().single()
    if (error) throw error

    const willSendPass = typeof dbPatch.status === 'string' && dbPatch.status.toUpperCase() === 'CONFIRMED'
    if (willSendPass && mailtrapClient) {
      try {
        const { data: userRow } = await supabase.from('users').select('email, firstname, lastname').eq('id', data.userid).single()
        const { data: spaceRow } = await supabase.from('spaces').select('name').eq('id', data.spaceid).single()
        const email = userRow?.email
        if (email) {
          const payload = JSON.stringify({ t: 'reservation', id, v: 1 })
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`
          const date = data.date
          const timeLabel = data.customtimelabel || data.slot
          const sender = { email: MAILTRAP_SENDER_EMAIL, name: "Maison de l'ESS" }
          const subject = "Votre pass de réservation - Maison de l'ESS"
          const html = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="margin:0 0 12px;">Votre pass de réservation</h2>
              <p>Bonjour ${userRow?.firstname || ''} ${userRow?.lastname || ''},</p>
              <p>Votre réservation pour <strong>${spaceRow?.name || ''}</strong> le <strong>${date}</strong> (${timeLabel || 'Créneau'}) a été confirmée.</p>
              <p>Présentez ce QR code à l'accueil le jour de votre réservation :</p>
              <div style="text-align:center;margin:16px 0;">
                <img src="${qrUrl}" alt="QR Pass" style="width:220px;height:220px;" />
              </div>
              <p style="font-size:12px;color:#64748b;">ID: ${id}</p>
            </div>
          `
          const text = `Votre pass de réservation\nEspace: ${spaceRow?.name || ''}\nDate: ${date}\nCréneau: ${timeLabel || ''}\nID: ${id}\nQR: ${qrUrl}`
          await mailtrapClient.send({
            from: sender,
            to: [{ email }],
            subject,
            html,
            text,
            category: "Reservation Pass"
          })
        }
      } catch (e) {
        console.error('Erreur envoi pass:', e)
      }
    }

    res.json({ ok: true, reservation: toCamelCase(data) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE supprimer une réservation
// DELETE supprimer une réservation
app.delete('/api/admin/reservations/:id', async (req, res) => {
  const id = req.params.id
  try {
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- GESTION DES EMAILS (Mailtrap) ---
import { MailtrapClient } from 'mailtrap'

const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN
const MAILTRAP_SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL || 'contactmaisoness@gmail.com'

let mailtrapClient = null
if (MAILTRAP_TOKEN) {
  mailtrapClient = new MailtrapClient({ token: MAILTRAP_TOKEN })
} else {
  console.warn('⚠️ MAILTRAP_TOKEN manquant. Le système d\'email ne fonctionnera pas.')
}

// POST envoyer un email
app.post('/api/admin/send-email', async (req, res) => {
  const { recipients, subject, content } = req.body

  if (!mailtrapClient) {
    return res.status(500).json({ error: "Configuration Mailtrap manquante (MAILTRAP_TOKEN)" })
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "Destinataires requis" })
  }

  if (!subject || !content) {
    return res.status(400).json({ error: "Sujet et contenu requis" })
  }

  try {
    const sender = {
      email: MAILTRAP_SENDER_EMAIL,
      name: "Maison de l'ESS Admin",
    }

    // Récupérer les infos utilisateurs depuis Auth Admin pour la substitution
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

    const userMap = new Map()
    if (!authError && authUsers) {
      authUsers.forEach(u => {
        userMap.set(u.email, {
          first_name: u.user_metadata?.first_name || u.user_metadata?.firstname || '',
          last_name: u.user_metadata?.last_name || u.user_metadata?.lastname || '',
          company_name: u.user_metadata?.company_name || u.user_metadata?.companyname || ''
        })
      })
    }

    // Envoi individuel pour permettre la personnalisation
    const sendPromises = recipients.map(async (email) => {
      const user = userMap.get(email) || {}
      const vars = {
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        companyName: user.company_name || '',
        email: email
      }

      let personalizedSubject = subject
      let personalizedContent = content

      // Remplacement des variables {firstName}, {lastName}, etc.
      for (const [key, val] of Object.entries(vars)) {
        const regex = new RegExp(`{${key}}`, 'g')
        personalizedSubject = personalizedSubject.replace(regex, val)
        personalizedContent = personalizedContent.replace(regex, val)
      }

      return mailtrapClient.send({
        from: sender,
        to: [{ email }],
        subject: personalizedSubject,
        text: personalizedContent.replace(/<[^>]*>?/gm, ''),
        html: personalizedContent,
        category: "Admin Notification",
      })
    })

    await Promise.all(sendPromises)

    // Log global (simplifié pour l'historique)
    try {
      await supabase.from('admin_emails').insert({
        recipients,
        subject, // On log le sujet original (template)
        content, // On log le contenu original
        status: 'sent',
        sent_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error("Erreur log email:", logError)
    }

    res.json({ success: true, count: recipients.length })
  } catch (e) {
    console.error("Erreur envoi email:", e)

    // Log l'échec
    try {
      await supabase.from('admin_emails').insert({
        recipients,
        subject,
        content,
        status: 'failed',
        error: e.message,
        sent_at: new Date().toISOString()
      })
    } catch (logError) { }

    res.status(500).json({ error: "Erreur lors de l'envoi: " + e.message })
  }
})

// GET historique des emails
app.get('/api/admin/emails', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_emails')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100)

    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- GESTION DES TEMPLATES & USERS ---

// GET utilisateurs (pour le sélecteur)
// GET utilisateurs (pour le sélecteur)
app.get('/api/admin/users', async (req, res) => {
  try {
    // On récupère depuis Auth Admin pour être sûr d'avoir tout le monde
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) throw error

    const mappedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.user_metadata?.first_name || u.user_metadata?.firstname || '',
      lastName: u.user_metadata?.last_name || u.user_metadata?.lastname || '',
      role: u.user_metadata?.role || 'USER',
      companyName: u.user_metadata?.company_name || u.user_metadata?.companyname || ''
    }))

    res.json(mappedUsers)
  } catch (e) {
    console.error("Erreur fetch users auth:", e)
    res.status(500).json({ error: e.message })
  }
})

// GET templates
app.get('/api/admin/templates', async (req, res) => {
  try {
    const { data, error } = await supabase.from('admin_email_templates').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST create template
app.post('/api/admin/templates', async (req, res) => {
  const { name, subject, content } = req.body
  try {
    const { data, error } = await supabase.from('admin_email_templates').insert({ name, subject, content }).select().single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE template
app.delete('/api/admin/templates/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('admin_email_templates').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Admin API en écoute sur http://localhost:${PORT}`)
})
