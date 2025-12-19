import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Space, Reservation, Message, BookingStatus, UserRole, AppNotification, AppEvent } from '../types';
import { api } from '../data/api';
import { initStorage } from '../services/storage';
import { supabase } from '../services/supabaseClient';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { encodeReservationPayload } from '../utils/qrPayload';

interface AppContextType {
  user: User | null;
  spaces: Space[];
  events: AppEvent[];
  reservations: Reservation[];
  messages: Message[];
  notifications: AppNotification[];
  loading: boolean;
  theme: 'light' | 'dark';
  uiTheme: { brandBg: string; brandAccent: string; youtubeUrl?: string; instagramUrl?: string; tiktokUrl?: string };
  login: (email: string, password: string) => Promise<string | null>; // returns error string or null
  register: (user: User) => Promise<string | null>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateUserProfile: (user: User) => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  validateReservation: (id: string) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  moveReservation: (id: string, newDate: string) => Promise<void>;
  checkInReservation: (id: string) => Promise<void>;
  updateSpace: (space: Space) => Promise<void>;
  addEvent: (event: AppEvent) => Promise<void>;
  updateEvent: (event: AppEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  sendMessage: (msg: Omit<Message, 'id' | 'date' | 'read'>) => Promise<void>;
  editMessage: (id: string, newContent: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  hardDeleteMessage: (id: string) => Promise<void>;
  pinMessage: (id: string, pinned: boolean) => Promise<void>;
  reactToMessage: (id: string, reaction: string) => Promise<void>;
  markAsRead: (email: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshData: (silent?: boolean, overrideUser?: User | null, opts?: { inbox?: boolean }) => Promise<void>;
  toggleTheme: () => void;
  updateUiTheme: (t: Partial<{ brandBg: string; brandAccent: string; youtubeUrl: string; instagramUrl: string; tiktokUrl: string }>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [uiTheme, setUiTheme] = useState<{ brandBg: string; brandAccent: string; youtubeUrl?: string; instagramUrl?: string; tiktokUrl?: string }>(() => {
    try {
      const raw = localStorage.getItem('mess_ui_theme');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.brandBg === 'string' && typeof parsed.brandAccent === 'string') return parsed;
      }
    } catch {}
    return { brandBg: '#1e3a8a', brandAccent: '#facc15', youtubeUrl: '', instagramUrl: '', tiktokUrl: '' };
  });

  // Initialize data & theme with cache-first, SWR refresh
  useEffect(() => {
    const init = async () => {
      initStorage();

      // Session first to determine access scope
      const sessionRaw = localStorage.getItem('mess_active_user');
      if (sessionRaw) {
        try {
          const parsedUser = JSON.parse(sessionRaw);
          setUser(parsedUser);
        } catch (e) {
          console.error('Failed to parse session user:', e);
          localStorage.removeItem('mess_active_user');
        }
      }

      // Hydrate from caches for instant paint
      try {
        const cs = localStorage.getItem('mess_cache_spaces');
        const ce = localStorage.getItem('mess_cache_events');
        const cr = localStorage.getItem('mess_cache_reservations');
        const cm = localStorage.getItem('mess_cache_messages');
        const cn = localStorage.getItem('mess_cache_notifications');
        if (cs) setSpaces(JSON.parse(cs));
        if (ce) setEvents(JSON.parse(ce));
        if (cr) setReservations(JSON.parse(cr));
        if (cm) setMessages(JSON.parse(cm));
        if (cn) setNotifications(JSON.parse(cn));
      } catch {}

      // Silent background refresh (no global loader)
      await refreshData(true, undefined, { inbox: false });

      // Load UI theme settings
      try {
        const s = await api.settings.get();
        setUiTheme(prev => ({ ...prev, ...s }));
      } catch {}

      // Ensure loader hidden after first pass
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const channel = (supabase as any)?.channel?.('app-realtime');
    if (!channel) return;

    const handleRealtimeEvent = (payload: any) => {
      // Realtime event handler
      const { table, eventType, new: newRecord, old: oldRecord } = payload;

      if (table === 'reservations') {
        if (eventType === 'INSERT') setReservations(prev => [...prev, newRecord]);
        else if (eventType === 'UPDATE') setReservations(prev => prev.map(r => r.id === newRecord.id ? { ...r, ...newRecord } : r));
        else if (eventType === 'DELETE') setReservations(prev => prev.filter(r => r.id !== oldRecord.id));
      } else if (table === 'messages') {
        if (eventType === 'INSERT') setMessages(prev => [...prev, newRecord]);
        else if (eventType === 'UPDATE') setMessages(prev => prev.map(m => m.id === newRecord.id ? { ...m, ...newRecord } : m));
        else if (eventType === 'DELETE') setMessages(prev => prev.filter(m => m.id !== oldRecord.id));
      } else if (table === 'notifications') {
        if (eventType === 'INSERT') setNotifications(prev => [...prev, newRecord]);
        else if (eventType === 'UPDATE') setNotifications(prev => prev.map(n => n.id === newRecord.id ? { ...n, ...newRecord } : n));
        else if (eventType === 'DELETE') setNotifications(prev => prev.filter(n => n.id !== oldRecord.id));
      }
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, handleRealtimeEvent)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handleRealtimeEvent)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, handleRealtimeEvent)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === 'INSERT') setEvents(prev => [...prev, newRecord]);
        else if (eventType === 'UPDATE') setEvents(prev => prev.map(e => e.id === newRecord.id ? { ...e, ...newRecord } : e));
        else if (eventType === 'DELETE') setEvents(prev => prev.filter(e => e.id !== oldRecord.id));
      })
      .subscribe();

    return () => { (supabase as any)?.removeChannel?.(channel); };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--brand-bg', uiTheme.brandBg);
    root.style.setProperty('--brand-accent', uiTheme.brandAccent);
    try {
      localStorage.setItem('mess_ui_theme', JSON.stringify(uiTheme));
    } catch {}
  }, [uiTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const updateUiTheme = (t: Partial<{ brandBg: string; brandAccent: string; youtubeUrl: string; instagramUrl: string; tiktokUrl: string }>) => {
    setUiTheme(prev => ({ ...prev, ...t }));
  };

  const refreshData = async (silent = false, overrideUser?: User | null, opts?: { inbox?: boolean }) => {
    if (!silent) setLoading(true);
    try {
      const includeInbox = opts?.inbox !== false;
      if (silent) {
        try {
          const tsRaw = localStorage.getItem('mess_cache_ts_all');
          const ts = tsRaw ? parseInt(tsRaw, 10) : 0;
          const freshWindow = 8000;
          if (Date.now() - ts < freshWindow) {
            const cs = localStorage.getItem('mess_cache_spaces');
            const ce = localStorage.getItem('mess_cache_events');
            const cr = localStorage.getItem('mess_cache_reservations');
            const cm = localStorage.getItem('mess_cache_messages');
            const cn = localStorage.getItem('mess_cache_notifications');
            if (cs) setSpaces(JSON.parse(cs));
            if (ce) setEvents(JSON.parse(ce));
            if (cr) setReservations(JSON.parse(cr));
            if (cm && includeInbox) setMessages(JSON.parse(cm));
            if (cn && includeInbox) setNotifications(JSON.parse(cn));
            return;
          }
        } catch {}
      }
      // Determine effective user (current state or override)
      const effectiveUser = overrideUser !== undefined ? overrideUser : user;
      const isAdmin = effectiveUser?.role === 'ADMIN';
      const isAccueil = effectiveUser?.role === UserRole.ACCUEIL;
      const reservationsPromise = effectiveUser
        ? api.reservations.getAll(true)
        : api.reservations.getAll(false)

      const messagesPromise = includeInbox && !isAccueil ? api.messages.getAll() : Promise.resolve(messages);
      const notificationsPromise = includeInbox && !isAccueil ? api.notifications.getAll() : Promise.resolve(notifications);

      const [currentSpaces, currentEvents, fetchedReservations, currentMessages, currentNotifications] = await Promise.all([
        api.spaces.getAll(),
        api.events.getAll(),
        reservationsPromise,
        messagesPromise,
        notificationsPromise
      ]);
      const currentReservations = (isAdmin || !effectiveUser)
        ? fetchedReservations
        : fetchedReservations.filter(r => r.userId === effectiveUser.id);
      setSpaces([...currentSpaces]);
      setEvents([...currentEvents]);
      setReservations([...currentReservations]);
      setMessages([...currentMessages]);
      setNotifications([...currentNotifications]);

      // Cache for instant next load
      try {
        localStorage.setItem('mess_cache_spaces', JSON.stringify(currentSpaces));
        localStorage.setItem('mess_cache_events', JSON.stringify(currentEvents));
        localStorage.setItem('mess_cache_reservations', JSON.stringify(currentReservations));
        localStorage.setItem('mess_cache_messages', JSON.stringify(currentMessages));
        localStorage.setItem('mess_cache_notifications', JSON.stringify(currentNotifications));
        localStorage.setItem('mess_cache_ts_all', String(Date.now()));
      } catch {}
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- Notification Helper ---
  const createNotification = (userId: string, title: string, message: string, type: AppNotification['type'], link?: string) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      userId,
      title,
      message,
      date: new Date().toISOString(),
      read: false,
      type,
      link
    };
    api.notifications.add(newNotif);
    // We don't await refreshData inside here to avoid loops, context updates usually handle it
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    // Removed artificial delay

    const foundUser = await api.users.getByEmail(email);
    if (!foundUser) return "Email ou mot de passe incorrect.";

    // Helper to hash password
    const hashPassword = async (pwd: string) => {
      const msgBuffer = new TextEncoder().encode(pwd);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const inputHash = await hashPassword(password);

    // Check 1: Match Hash
    if (foundUser.password === inputHash) {
      setUser(foundUser);
      localStorage.setItem('mess_active_user', JSON.stringify(foundUser));
      await refreshData(false, foundUser);
      return null;
    }

    // Check 2: Match Plain Text (Legacy Fallback)
    if (foundUser.password === password) {
      // Auto-migrate to hash
      try {
        await api.users.update({ ...foundUser, password: inputHash }); // api.update handles hashing logic too, but we pass hash here
        // Note: api.users.update might re-hash if we are not careful, but our logic there checks length.
        // Actually, let's just pass the plain text to api.users.update and let it hash it.
        // Wait, if we pass plain text, it will hash it.
        // Let's just update the local user object and let the user re-login or update profile later?
        // Better: Update the user in DB with the new hash.
        // The api.users.update logic I wrote checks if length < 64. 
        // If I pass the HASH (length 64), it won't re-hash. Perfect.
        await api.users.update({ ...foundUser, password: inputHash });

        const updatedUser = { ...foundUser, password: inputHash };
        setUser(updatedUser);
        localStorage.setItem('mess_active_user', JSON.stringify(updatedUser));
        await refreshData(false, updatedUser);
        return null;
      } catch (e) {
        console.error("Auto-migration failed", e);
        // Allow login anyway
        setUser(foundUser);
        localStorage.setItem('mess_active_user', JSON.stringify(foundUser));
        await refreshData(false, foundUser);
        return null;
      }
    }

    return "Email ou mot de passe incorrect.";
  };

  const register = async (newUser: User): Promise<string | null> => {
    // Removed artificial delay

    if (await api.users.getByEmail(newUser.email)) {
      return "Cet email est déjà utilisé.";
    }

    await api.users.create(newUser);
    // Auto login after register
    setUser(newUser);
    localStorage.setItem('mess_active_user', JSON.stringify(newUser));
    await refreshData(false, newUser);
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mess_active_user');
    refreshData(false, null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      await api.users.delete(user.id);
      localStorage.removeItem('mess_active_user');
      setUser(null);
      // No need to refreshData() as user is logged out and data is cleared/irrelevant
      setReservations([]);
      setMessages([]);
      setNotifications([]);
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Une erreur est survenue lors de la suppression du compte.");
    }
  };

  const updateUserProfile = async (updatedUser: User) => {
    const result = await api.users.update(updatedUser);
    setUser(result);
    localStorage.setItem('mess_active_user', JSON.stringify(result));
  };

  const addReservation = async (resData: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => {

    // Check auto-approve status of the space
    const space = spaces.find(s => s.id === resData.spaceId);
    let initialStatus = BookingStatus.PENDING;

    // If space has autoApprove ON AND it is NOT a Quote request (which always requires negotiation)
    if (space && space.autoApprove && !resData.isQuoteRequest) {
      initialStatus = BookingStatus.CONFIRMED;
    }

    const newRes: Reservation = {
      ...resData,
      id: 'r-' + Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      status: initialStatus
    };
    await api.reservations.add(newRes);

    // Trigger Notification if auto-approved
    if (initialStatus === BookingStatus.CONFIRMED) {
      createNotification(
        newRes.userId,
        "Réservation Confirmée",
        `Votre réservation pour ${space?.name} a été validée automatiquement.`,
        "success",
        "/profile?tab=bookings"
      );
    } else {
      createNotification(
        newRes.userId,
        "Demande reçue",
        `Votre demande pour ${space?.name} est en attente de validation par l'équipe.`,
        "info",
        "/profile?tab=bookings"
      );
    }

    await refreshData(true);
  };

  const validateReservation = async (id: string) => {
    await api.reservations.updateStatus(id, BookingStatus.CONFIRMED);
    const res = reservations.find(r => r.id === id);
    if (res) {
      const space = spaces.find(s => s.id === res.spaceId);
      createNotification(
        res.userId,
        "Réservation Validée",
        `Bonne nouvelle ! Votre réservation pour ${space?.name} le ${res.date} a été confirmée par l'administration.`,
        "success",
        "/profile?tab=bookings"
      );
      try {
        let recipientEmail: string | undefined;
        let fname = '';
        let lname = '';
        try {
          const { data: udata }: any = await supabase.from('users').select('*').eq('id', res.userId).single();
          recipientEmail = udata?.email;
          fname = udata?.firstname || udata?.firstName || '';
          lname = udata?.lastname || udata?.lastName || '';
        } catch {}
        if (!recipientEmail) {
          try {
            const all = await api.users.getAll(true);
            const u = all.find(x => x.id === res.userId);
            recipientEmail = u?.email;
            fname = u?.firstName || '';
            lname = u?.lastName || '';
          } catch {}
        }
        if (recipientEmail) {
          const payload = encodeReservationPayload(res.id);
          const qrUrl = await generateQrDataUrl(payload, 260);
          const adminApiBase = (import.meta as any).env?.VITE_ADMIN_API_BASE || '';
          const adminToken = (import.meta as any).env?.VITE_ADMIN_TOKEN || '';
          const appBase = ((import.meta as any).env?.VITE_ADMIN_API_BASE as string | undefined)?.replace(':8080', ':5173') || 'http://localhost:5173';
          const dateLabel = res.endDate && res.endDate !== res.date ? `${res.date} → ${res.endDate}` : res.date;
          const slotLabel = res.customTimeLabel || res.slot;
          const subject = `Votre pass de réservation – ${space?.name || 'Espace'}`;
          const content = `
            <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#0b1220;color:#e5e7eb;border-radius:16px">
              <div style="text-align:center;margin-bottom:16px">
                <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.5px">Réservation Confirmée</h2>
                <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">Votre pass est prêt à être scanné le jour J</p>
              </div>
              <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:20px;margin-bottom:16px;text-align:center">
                <img src="${qrUrl}" alt="QR Code" style="width:240px;height:240px;border-radius:12px;border:8px solid #fff;background:#fff" />
                <div style="margin-top:10px;font-size:10px;color:#9ca3af;font-family:monospace">ID: ${res.id}</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
                <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:12px">
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Espace</div>
                  <div style="font-size:14px;font-weight:700;color:#fff">${space?.name || 'Espace'}</div>
                </div>
                <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:12px">
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Dates</div>
                  <div style="font-size:14px;font-weight:700;color:#fff">${dateLabel}</div>
                </div>
                <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:12px">
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Créneau</div>
                  <div style="font-size:14px;font-weight:700;color:#fff">${slotLabel}</div>
                </div>
                <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:12px">
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Nom</div>
                  <div style="font-size:14px;font-weight:700;color:#fff">${[fname, lname].filter(Boolean).join(' ') || 'Client'}</div>
                </div>
              </div>
              <div style="text-align:center;margin:18px 0">
                <a href="${appBase}/#/profile?tab=bookings" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:800;font-size:12px;letter-spacing:0.6px">Voir mes réservations</a>
              </div>
              <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:8px">Présentez ce QR lors de votre arrivée pour valider votre accès.</p>
            </div>
          `;
          await fetch(`${adminApiBase}/api/admin/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ recipients: [recipientEmail], subject, content })
          });
        }
      } catch {}
    }
    await refreshData(true);
  };

  const cancelReservation = async (id: string) => {
    // 1. API Update
    await api.reservations.updateStatus(id, BookingStatus.CANCELLED);

    // Notification Logic
    const res = reservations.find(r => r.id === id);
    if (res) {
      const space = spaces.find(s => s.id === res.spaceId);
      createNotification(
        res.userId,
        "Réservation Annulée/Refusée",
        `La réservation pour ${space?.name} le ${res.date} a été annulée ou refusée.`,
        "error",
        "/profile?tab=history"
      );
    }

    // 2. Force Refresh
    await refreshData(true);
  };

  const moveReservation = async (id: string, newDate: string) => {
    await api.reservations.updateDate(id, newDate);
    await refreshData(true);
  };

  const checkInReservation = async (id: string) => {
    // 1. API Update
    await api.reservations.checkIn(id);

    const res = reservations.find(r => r.id === id);
    if (res) {
      const space = spaces.find(s => s.id === res.spaceId);
      createNotification(
        res.userId,
        "Bienvenue !",
        `Votre arrivée à l'espace ${space?.name} a été enregistrée. Bon travail !`,
        "success",
        "/profile?tab=pass"
      );
    }

    // 2. Force Refresh
    await refreshData(true);
  };

  const updateSpace = async (updatedSpace: Space) => {
    await api.spaces.update(updatedSpace);
    setSpaces(prev => prev.map(s => s.id === updatedSpace.id ? { ...s, ...updatedSpace } : s));
    await refreshData(true);
  };

  const addEvent = async (event: AppEvent) => {
    await api.events.add(event);
    await refreshData(true);
  };

  const updateEvent = async (event: AppEvent) => {
    await api.events.update(event);
    await refreshData(true);
  };

  const deleteEvent = async (id: string) => {
    await api.events.delete(id);
    await refreshData(true);
  };

  const sendMessage = async (msgData: Omit<Message, 'id' | 'date' | 'read'>) => {
    const toBlob = (dataUrl: string) => {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8 = new Uint8Array(n);
      while (n--) u8[n] = bstr.charCodeAt(n);
      return new Blob([u8], { type: mime });
    };
    const isImageData = (src?: string) => !!src && src.startsWith('data:image');
    const compressImage = async (dataUrl: string) => {
      return new Promise<Blob>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const max = 1600;
          const ratio = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const type = 'image/jpeg';
          canvas.toBlob((b) => resolve(b || new Blob()), type, 0.8);
        };
        img.src = dataUrl;
      });
    };
    const ensureBucket = async (name: string) => {
      try {
        const g = await (supabase as any).storage?.getBucket?.(name);
        if (!(g as any)?.data) {
          await (supabase as any).storage?.createBucket?.(name, { public: true });
        }
      } catch { }
    };
    let attachmentUrl = msgData.attachment;
    if (attachmentUrl && attachmentUrl.startsWith('data:')) {
      try {
        const bucket = 'attachments';
        await ensureBucket(bucket);
        let ext = (msgData.attachmentName || '').split('.').pop() || '';
        let blob = toBlob(attachmentUrl);
        if (isImageData(attachmentUrl)) {
          blob = await compressImage(attachmentUrl);
          ext = 'jpg';
        }
        const key = `${msgData.email}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || 'bin'}`;
        const res = await (supabase as any).storage?.from(bucket)?.upload(key, blob, { contentType: blob.type, upsert: false });
        const err = (res as any)?.error;
        if (!err) {
          const pub = (supabase as any).storage.from(bucket).getPublicUrl(key);
          attachmentUrl = pub?.data?.publicUrl || attachmentUrl;
          if (!attachmentUrl) {
            const signed = await (supabase as any).storage?.createSignedUrl?.(bucket, key, 60 * 60 * 24 * 7);
            attachmentUrl = (signed as any)?.data?.signedUrl || attachmentUrl;
          }
        }
      } catch { }
    }
    const newMsg: Message = {
      ...msgData,
      attachment: attachmentUrl,
      attachmentName: attachmentUrl && !attachmentUrl.startsWith('data:') ? (msgData.attachmentName || attachmentUrl.split('/').pop() || 'pièce-jointe') : msgData.attachmentName,
      id: 'm-' + Date.now(),
      date: new Date().toISOString(),
      read: false
    };
    await api.messages.add(newMsg);

    // If Admin sends message, notify user
    if (msgData.senderRole === UserRole.ADMIN) {
      const targetUser = await api.users.getByEmail(msgData.email);
      if (targetUser) {
        createNotification(
          targetUser.id,
          "Nouveau Message",
          "Vous avez reçu une réponse de l'administration.",
          "info",
          "/profile?tab=messages"
        );
      }
    }

    // Mock state update
    setMessages(prev => [...prev, newMsg]);
    await refreshData(true);
  };

  // New advanced message features
  const editMessage = async (id: string, newContent: string) => {
    const editedAt = new Date().toISOString()
    await api.messages.update(id, { content: newContent, editedAt })
    const updatedMessages = messages.map(m => {
      if (m.id === id) {
        return { ...m, content: newContent, editedAt };
      }
      return m;
    });
    setMessages(updatedMessages);
    await refreshData(true);
  };

  const deleteMessage = async (id: string) => {
    await api.messages.update(id, { isDeleted: true, content: 'Message supprimé' })
    const updatedMessages = messages.map(m => {
      if (m.id === id) {
        return { ...m, isDeleted: true, content: 'Message supprimé' };
      }
      return m;
    });
    setMessages(updatedMessages);
    await refreshData(true);
  };

  const hardDeleteMessage = async (id: string) => {
    await api.messages.delete(id)
    setMessages(prev => prev.filter(m => m.id !== id))
    await refreshData(true)
  }

  const pinMessage = async (id: string, pinned: boolean) => {
    await api.messages.update(id, { pinned })
    const updatedMessages = messages.map(m => {
      if (m.id === id) return { ...m, pinned };
      return m;
    });
    setMessages(updatedMessages);
    await refreshData(true);
  };

  const reactToMessage = async (id: string, reaction: string) => {
    if (!user) return;
    const updatedMessages = messages.map(m => {
      if (m.id === id) {
        const currentReactions = m.reactions || {};
        // Toggle reaction
        if (currentReactions[user.id] === reaction) {
          delete currentReactions[user.id];
        } else {
          currentReactions[user.id] = reaction;
        }
        return { ...m, reactions: { ...currentReactions } };
      }
      return m;
    });
    setMessages(updatedMessages);
    const target = updatedMessages.find(m => m.id === id)
    await api.messages.update(id, { reactions: target?.reactions })
    await refreshData(true);
  };

  const markAsRead = async (email: string) => {
    await api.messages.markReadByEmail(email)
    const updatedMessages = messages.map(m => {
      if (m.email === email && !m.read && m.senderRole === UserRole.USER) {
        return { ...m, read: true, readAt: new Date().toISOString() };
      }
      return m;
    });
    setMessages(updatedMessages);
    await refreshData(true);
  };

  const markNotificationAsRead = async (id: string) => {
    await api.notifications.markAsRead(id);
    await refreshData();
  };

  const markAllNotificationsAsRead = async () => {
    if (user) {
      await api.notifications.markAllAsRead(user.id);
      await refreshData(true);
    }
  };

  const deleteNotification = async (id: string) => {
    await api.notifications.delete(id);
    await refreshData(true);
  };

  return (
    <AppContext.Provider value={{
      user,
      spaces,
      events,
      reservations,
      messages,
      notifications,
      loading,
      theme,
      uiTheme,
      login,
      register,
      logout,
      deleteAccount,
      updateUserProfile,
      addReservation,
      validateReservation,
      cancelReservation,
      moveReservation,
      checkInReservation,
      updateSpace,
      addEvent,
      updateEvent,
      deleteEvent,
      sendMessage,
      editMessage,
      deleteMessage,
      hardDeleteMessage,
      pinMessage,
      reactToMessage,
      markAsRead,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      refreshData,
      toggleTheme,
      updateUiTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
