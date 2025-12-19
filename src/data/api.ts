import { User, Space, Reservation, Message, BookingStatus, AppNotification, BookingSlot, AppEvent } from '../types'
import { supabase } from '../services/supabaseClient'
import { logger } from '../services/logger'
import { validateUser, validateSpace, validateReservation, validateMessage, validateNotification } from '../services/validation'
import { usersData } from './users'
import { reservationsData } from './reservations'
import { messagesData } from './messages'

import { spacesData } from './spaces'

// --- HELPERS ---

const getAdminApiBase = (): string => {
  const base = (import.meta as any).env?.VITE_ADMIN_API_BASE as string | undefined
  return base && typeof base === 'string' && base.length ? base : 'http://localhost:8080'
}

const getAdminToken = (): string | undefined => {
  return (import.meta as any).env?.VITE_ADMIN_TOKEN as string | undefined
}

const formatError = (error: unknown): string => {
  if (!error) return 'unknown_error'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message)
  }
  try { return JSON.stringify(error) } catch { return String(error) }
}

// Helper for password hashing
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const api = {
  users: {
    getAll: async (isAdmin: boolean = false): Promise<User[]> => {
      if (isAdmin) {
        const adminApiBase = getAdminApiBase() || ''
        const adminToken = getAdminToken()
        try {
          const res = await fetch(`${adminApiBase}/api/admin/users`, {
            headers: { 'x-admin-token': adminToken || '' }
          })
          if (res.ok) {
            const data = await res.json()
            return data
          }
        } catch (e) {
          logger.warn('api.users.getAll', 'admin_fetch_failed', e)
        }
      }

      const { data } = await supabase.from('users').select('*')
      const rows = (data && data.length ? data : usersData) as any[]
      return rows.map(user => ({
        ...user,
        firstName: user.firstName || user.firstname,
        lastName: user.lastName || user.lastname,
        companyName: user.companyName || user.companyname
      }))
    },
    getByEmail: async (email: string): Promise<User | null> => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1)
        const row = (!error && data && data.length) ? data[0] : usersData.find((u: any) => u.email === email)
        if (!row) return null
        return {
          ...row,
          firstName: row.firstName || row.firstname,
          lastName: row.lastName || row.lastname,
          companyName: row.companyName || row.companyname
        }
      } catch (error) {
        logger.error('api.users.getByEmail', 'failed', error)
        const fallback = usersData.find((u: any) => u.email === email)
        if (!fallback) return null
        return {
          ...fallback,
          firstName: fallback.firstName || fallback.firstname,
          lastName: fallback.lastName || fallback.lastname,
          companyName: fallback.companyName || fallback.companyname
        }
      }
    },
    create: async (user: User): Promise<User> => {
      const v = validateUser(user)
      if (v) throw new Error(v)
      try {
        const hashedPassword = await hashPassword(user.password || '');
        const dbUser = {
          id: user.id,
          email: user.email,
          password: hashedPassword,
          role: user.role || 'USER',
          type: user.type || 'INDIVIDUAL',
          firstname: user.firstName,
          lastname: user.lastName,
          phone: user.phone,
          companyname: user.companyName,
          siret: user.siret
        }
        const { error } = await supabase.from('users').insert(dbUser)
        if (error) {
          console.error('Error creating user:', error)
          throw new Error(`Failed to create user: ${error.message || error}`)
        }
        return { ...user, password: hashedPassword }
      } catch (error) {
        logger.error('api.users.create', 'failed', error)
        throw error
      }
    },
    update: async (user: User): Promise<User> => {
      const v = validateUser(user)
      if (v) throw new Error(v)

      // Check if password needs hashing (if it's not already a hash)
      // Simple heuristic: SHA-256 hex is 64 chars. If < 64, it's likely plain text.
      let finalPassword = user.password;
      if (user.password && user.password.length < 64) {
        finalPassword = await hashPassword(user.password);
      }

      const dbUser = {
        email: user.email,
        password: finalPassword,
        role: user.role,
        type: user.type,
        firstname: user.firstName,
        lastname: user.lastName,
        phone: user.phone,
        companyname: user.companyName,
        siret: user.siret
      }
      const { error } = await supabase.from('users').update(dbUser).eq('id', user.id)
      if (error) throw new Error(formatError(error))
      return { ...user, password: finalPassword }
    },
    delete: async (id: string): Promise<void> => {
      try {
        // 1. Get email for message deletion (messages are linked by email, not ID)
        const { data: udata } = await supabase.from('users').select('email').eq('id', id).single()
        const email = udata?.email

        // 2. Delete messages (No FK constraint usually for email based links)
        if (email) {
          const { error: msgError } = await supabase.from('messages').delete().eq('email', email)
          if (msgError) logger.warn('api.users.delete', 'failed_delete_messages', msgError)
        }

        // 3. Delete User -> CASCADE will handle reservations, notifications, etc.
        const { error } = await supabase.from('users').delete().eq('id', id)
        if (error) throw new Error(formatError(error))
      } catch (error) {
        logger.error('api.users.delete', 'failed', error)
        throw error
      }
    }
  },
  spaces: {
    getAll: async (): Promise<Space[]> => {
      const adminApiBase = getAdminApiBase() || ''

      // Try API first (Local Admin Server)
      try {
        const resp = await fetch(`${adminApiBase}/api/public/spaces`)
        if (resp.ok) {
          const data = await resp.json()
          return data || []
        }
      } catch (e) {
        logger.warn('api.spaces.getAll', 'fetch_failed', e)
      }

      try {
        const resp = await fetch('/galerie/content.json')
        if (resp.ok) {
          const data = await resp.json()
          if (Array.isArray(data?.spaces)) return data.spaces
        }
      } catch (e) {
        logger.warn('api.spaces.getAll', 'content_json_failed', e)
      }

      return spacesData
    },
    update: async (space: Space): Promise<void> => {
      const v = validateSpace(space)
      if (v) throw new Error(v)

      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()

      // We prioritize the local admin server now
      try {
        const resp = await fetch(`${adminApiBase}/api/admin/spaces/${space.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify(space)
        })
        if (resp.ok) return
        logger.warn('api.spaces.update', 'api_failed', resp.status)
      } catch (e) {
        logger.warn('api.spaces.update', 'api_error', e)
      }
    }
  },
  events: {
    getAll: async (): Promise<AppEvent[]> => {
      const adminApiBase = getAdminApiBase() || ''
      try {
        const resp = await fetch(`${adminApiBase}/api/public/events`)
        if (resp.ok) {
          const data = await resp.json()
          return (data || []).map((e: any) => ({
            ...e,
            eventName: e.eventName || e.eventname,
            eventImage: e.eventImage || e.eventimage,
            eventDescription: e.eventDescription || e.eventdescription,
            customTimeLabel: e.customTimeLabel || e.customtimelabel,
            spaceId: e.spaceId || e.spaceid,
            endDate: e.endDate || e.enddate
          }))
        }
      } catch (e) { logger.warn('api.events.getAll', 'fetch_failed', e) }

      try {
        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
        if (error) throw error
        return (data || []).map((e: any) => ({
          ...e,
          eventName: e.eventname,
          eventImage: e.eventimage,
          eventDescription: e.eventdescription,
          customTimeLabel: e.customtimelabel,
          spaceId: e.spaceid,
          endDate: e.enddate
        }))
      } catch (e) {
        logger.warn('api.events.getAll', 'supabase_failed', e)
        return []
      }
    },
    add: async (event: AppEvent): Promise<void> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()
      const dbEvent = {
        id: event.id,
        eventname: event.eventName,
        date: event.date,
        enddate: event.endDate,
        customtimelabel: event.customTimeLabel,
        eventimage: event.eventImage,
        eventdescription: event.eventDescription,
        location: event.location,
        spaceid: event.spaceId,
        spaceids: event.spaceIds
      }
      const resp = await fetch(`${adminApiBase}/api/admin/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify(dbEvent)
      })
      if (!resp.ok) throw new Error(`add_failed_${resp.status}`)
    },
    update: async (event: AppEvent): Promise<void> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()
      const dbEvent = {
        eventname: event.eventName,
        date: event.date,
        enddate: event.endDate,
        customtimelabel: event.customTimeLabel,
        eventimage: event.eventImage,
        eventdescription: event.eventDescription,
        location: event.location,
        spaceid: event.spaceId,
        spaceids: event.spaceIds
      }
      const resp = await fetch(`${adminApiBase}/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify(dbEvent)
      })
      if (!resp.ok) throw new Error(`update_failed_${resp.status}`)
    },
    delete: async (id: string): Promise<void> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()
      const resp = await fetch(`${adminApiBase}/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken || '' }
      })
      if (!resp.ok) throw new Error(`delete_failed_${resp.status}`)
    }
  },
  reservations: {
    getAll: async (isAdmin: boolean = false): Promise<Reservation[]> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()

      try {
        const endpoint = isAdmin ? `${adminApiBase}/api/admin/reservations` : `${adminApiBase}/api/public/reservations`
        const headers: HeadersInit = isAdmin ? { 'x-admin-token': adminToken || '' } : {}

        const resp = await fetch(endpoint, { headers })
        if (resp.ok) {
          const data = await resp.json()
          // Map data to ensure userId exists for public data (which is anonymized)
          return (data || []).map((r: any) => ({
            id: r.id,
            spaceId: r.spaceId,
            userId: r.userId || 'anonymous', // Fallback for public data
            date: r.date,
            endDate: r.endDate,
            slot: (r.slot as BookingSlot),
            status: r.status,
            createdAt: r.createdAt,
            eventName: r.eventName,
            eventDescription: r.eventDescription,
            eventImage: r.eventImage,
            customTimeLabel: r.customTimeLabel,
            isGlobalClosure: r.isGlobalClosure,
            isQuoteRequest: r.isQuoteRequest,
            recurringGroupId: r.recurringGroupId,
            checkedInAt: r.checkedInAt
          }))
        }
      } catch (e) {
        logger.warn('api.reservations.getAll', 'fetch_failed', e)
      }

      try {
        const resp = await fetch('/galerie/content.json')
        if (resp.ok) {
          const data = await resp.json()
          if (Array.isArray(data?.reservations)) {
            return (data.reservations || []).map((r: any) => ({
              id: r.id,
              spaceId: r.spaceId,
              userId: 'anonymous',
              date: r.date,
              endDate: r.endDate,
              slot: (r.slot as BookingSlot),
              status: r.status,
              createdAt: r.createdAt,
              eventName: r.eventName,
              eventDescription: r.eventDescription,
              eventImage: r.eventImage,
              customTimeLabel: r.customTimeLabel,
              isGlobalClosure: r.isGlobalClosure,
              isQuoteRequest: r.isQuoteRequest,
              recurringGroupId: r.recurringGroupId,
              checkedInAt: r.checkedInAt
            }))
          }
        }
      } catch (e) {
        logger.warn('api.reservations.getAll', 'content_json_failed', e)
      }
      return reservationsData.map(item => ({
        id: item.id,
        spaceId: item.spaceId,
        userId: item.userId,
        date: item.date,
        endDate: item.endDate,
        slot: (item.slot as BookingSlot),
        status: item.status,
        createdAt: item.createdAt,
        eventName: item.eventName,
        eventDescription: item.eventDescription,
        eventImage: item.eventImage,
        customTimeLabel: item.customTimeLabel,
        isGlobalClosure: item.isGlobalClosure,
        isQuoteRequest: item.isQuoteRequest,
        recurringGroupId: item.recurringGroupId,
        checkedInAt: item.checkedInAt
      }))
    },
    getByUser: async (userId: string): Promise<Reservation[]> => {
      try {
        const { data, error } = await supabase.from('reservations').select('*').eq('userid', userId)
        if (error) throw error
        return (data || []).map((r: any) => ({
          id: r.id,
          spaceId: r.spaceid,
          userId: r.userid,
          date: r.date,
          endDate: r.enddate,
          slot: (r.slot as BookingSlot),
          status: r.status,
          createdAt: r.createdat,
          eventName: r.eventname,
          eventDescription: r.eventdescription,
          eventImage: r.eventimage,
          customTimeLabel: r.customtimelabel,
          isGlobalClosure: r.isglobalclosure,
          isQuoteRequest: r.isquoterequest,
          recurringGroupId: r.recurringgroupid,
          checkedInAt: r.checkedinat
        }))
      } catch (e) {
        logger.warn('api.reservations.getByUser', 'failed', e)
        return []
      }
    },
    add: async (res: Reservation): Promise<void> => {
      const v = validateReservation(res)
      if (v) throw new Error(v)

      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()

      try {
        const resp = await fetch(`${adminApiBase}/api/admin/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
          body: JSON.stringify(res)
        })
        if (!resp.ok) throw new Error(`add_failed_${resp.status}`)
      } catch (e) {
        // Fallback to local array if server fails (dev mode)
        reservationsData.push(res)
        throw e // Rethrow to notify user, or swallow if we want full offline?
      }
    },
    updateStatus: async (id: string, status: BookingStatus): Promise<void> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()

      const resp = await fetch(`${adminApiBase}/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify({ status })
      })
      if (!resp.ok) throw new Error(`update_failed_${resp.status}`)
    },
    updateDate: async (id: string, newDate: string): Promise<void> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()

      const resp = await fetch(`${adminApiBase}/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify({ date: newDate })
      })
      if (!resp.ok) throw new Error(`update_failed_${resp.status}`)
    },
    checkIn: async (id: string): Promise<void> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()
      const now = new Date().toISOString()

      const resp = await fetch(`${adminApiBase}/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify({ checkedInAt: now, status: 'DONE' })
      })
      if (!resp.ok) throw new Error(`update_failed_${resp.status}`)
    }
  },
  messages: {
    getAll: async (): Promise<Message[]> => {
      try {
        const { data, error } = await supabase.from('messages').select('*')
        if (!error && data && data.length) {
          return (data || []).map(message => ({
            ...message,
            senderRole: message.senderRole || message.senderrole,
            attachmentName: message.attachmentName || message.attachmentname,
            editedAt: message.editedAt || message.editedat,
            isDeleted: message.isDeleted || message.isdeleted
          }))
        }
      } catch (e) { logger.warn('api.messages.getAll', 'fallback', e) }
      return messagesData.map((message: any) => ({
        ...message,
        senderRole: message.senderRole || message.senderrole,
        attachmentName: message.attachmentName || message.attachmentname,
        editedAt: message.editedAt || message.editedat,
        isDeleted: message.isDeleted || message.isdeleted
      }))
    },
    add: async (msg: Message): Promise<void> => {
      const v = validateMessage(msg)
      if (v) throw new Error(v)
      const dbMessage = {
        id: msg.id,
        name: msg.name,
        email: msg.email,
        subject: msg.subject,
        content: msg.content,
        date: msg.date,
        read: msg.read,
        readat: msg.readAt,
        senderrole: msg.senderRole,
        attachment: msg.attachment,
        attachmentname: msg.attachmentName,
        pinned: msg.pinned,
        reactions: msg.reactions,
        editedat: msg.editedAt,
        isdeleted: msg.isDeleted
      }
      const { error } = await supabase.from('messages').insert(dbMessage)
      if (error) {
        if (error === 'supabase_not_configured') {
          messagesData.push({ ...msg })
          return
        }
        throw new Error(formatError(error))
      }
    },
    update: async (id: string, patch: Partial<Message>): Promise<void> => {
      const { error } = await supabase.from('messages').update({
        content: patch.content,
        editedat: patch.editedAt,
        pinned: patch.pinned,
        reactions: patch.reactions,
        read: patch.read,
        readat: patch.readAt,
        isdeleted: patch.isDeleted,
        attachment: patch.attachment,
        attachmentname: patch.attachmentName
      }).eq('id', id)
      if (error) {
        if (error === 'supabase_not_configured') {
          const idx = messagesData.findIndex((m: any) => m.id === id)
          if (idx >= 0) messagesData[idx] = { ...messagesData[idx], ...patch }
          return
        }
        throw new Error(formatError(error))
      }
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('messages').delete().eq('id', id)
      if (error) throw new Error(formatError(error))
    },
    markReadByEmail: async (email: string): Promise<void> => {
      const { error } = await supabase.from('messages').update({ read: true, readat: new Date().toISOString() }).eq('email', email).eq('senderrole', 'USER')
      if (error) {
        if (error === 'supabase_not_configured') {
          const now = new Date().toISOString()
          for (let i = 0; i < messagesData.length; i++) {
            const m: any = messagesData[i]
            const role = m.senderRole || m.senderrole
            if (m.email === email && role === 'USER') {
              messagesData[i] = { ...m, read: true, readAt: now, readat: now }
            }
          }
          return
        }
        throw new Error(formatError(error))
      }
    }
  },
  notifications: {
    getAll: async (): Promise<AppNotification[]> => {
      const { data } = await supabase.from('notifications').select('*')
      return (data || []).map(notification => ({
        ...notification,
        userId: notification.userId || notification.userid
      }))
    },
    add: async (notif: AppNotification): Promise<void> => {
      const v = validateNotification(notif)
      if (v) throw new Error(v)
      const dbNotification = {
        id: notif.id,
        userid: notif.userId,
        title: notif.title,
        message: notif.message,
        date: notif.date,
        read: notif.read,
        type: notif.type,
        link: notif.link
      }
      const { error } = await supabase.from('notifications').insert(dbNotification)
      if (error) throw new Error(formatError(error))
    },
    markAsRead: async (id: string): Promise<void> => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
      if (error) throw new Error(formatError(error))
    },
    markAllAsRead: async (userId: string): Promise<void> => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('userid', userId)
      if (error) throw new Error(formatError(error))
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('notifications').delete().eq('id', id)
      if (error) throw new Error(formatError(error))
    }
  }
  ,
  settings: {
    get: async (): Promise<{ brandBg: string; brandAccent: string; youtubeUrl?: string; instagramUrl?: string; tiktokUrl?: string }> => {
      const adminApiBase = getAdminApiBase() || ''
      try {
        const resp = await fetch(`${adminApiBase}/api/public/settings`)
        if (resp.ok) {
          const data = await resp.json()
          return {
            brandBg: typeof data?.brandBg === 'string' ? data.brandBg : '#1e3a8a',
            brandAccent: typeof data?.brandAccent === 'string' ? data.brandAccent : '#facc15',
            youtubeUrl: typeof data?.youtubeUrl === 'string' ? data.youtubeUrl : '',
            instagramUrl: typeof data?.instagramUrl === 'string' ? data.instagramUrl : '',
            tiktokUrl: typeof data?.tiktokUrl === 'string' ? data.tiktokUrl : ''
          }
        }
      } catch (e) {
        logger.warn('api.settings.get', 'fetch_failed', e)
      }
      try {
        const resp = await fetch('/galerie/content.json')
        if (resp.ok) {
          const data = await resp.json()
          const s = data?.settings || {}
          return {
            brandBg: typeof s?.brandBg === 'string' ? s.brandBg : '#1e3a8a',
            brandAccent: typeof s?.brandAccent === 'string' ? s.brandAccent : '#facc15',
            youtubeUrl: typeof s?.youtubeUrl === 'string' ? s.youtubeUrl : '',
            instagramUrl: typeof s?.instagramUrl === 'string' ? s.instagramUrl : '',
            tiktokUrl: typeof s?.tiktokUrl === 'string' ? s.tiktokUrl : ''
          }
        }
      } catch (e) {
        logger.warn('api.settings.get', 'content_json_failed', e)
      }
      return { brandBg: '#1e3a8a', brandAccent: '#facc15', youtubeUrl: '', instagramUrl: '', tiktokUrl: '' }
    },
    update: async (patch: Partial<{ brandBg: string; brandAccent: string; youtubeUrl: string; instagramUrl: string; tiktokUrl: string }>): Promise<{ brandBg: string; brandAccent: string; youtubeUrl?: string; instagramUrl?: string; tiktokUrl?: string } | null> => {
      const adminApiBase = getAdminApiBase() || ''
      const adminToken = getAdminToken()
      let attempts = 0
      while (attempts < 3) {
        try {
          const resp = await fetch(`${adminApiBase}/api/admin/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
            body: JSON.stringify(patch)
          })
          if (!resp.ok) throw new Error(`update_failed_${resp.status}`)
          const data = await resp.json()
          return {
            brandBg: typeof data?.brandBg === 'string' ? data.brandBg : '#1e3a8a',
            brandAccent: typeof data?.brandAccent === 'string' ? data.brandAccent : '#facc15',
            youtubeUrl: typeof data?.youtubeUrl === 'string' ? data.youtubeUrl : '',
            instagramUrl: typeof data?.instagramUrl === 'string' ? data.instagramUrl : '',
            tiktokUrl: typeof data?.tiktokUrl === 'string' ? data.tiktokUrl : ''
          }
        } catch (e) {
          attempts++
          if (attempts >= 3) {
            logger.warn('api.settings.update', 'failed_after_retries', e)
            return null
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      return null
    }
  }
}
