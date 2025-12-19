
import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, Users, Calendar, DollarSign,
  Activity, Clock, MessageSquare, ShieldAlert,
  Check, MapPin, MoreHorizontal, ArrowRight,
  Zap, BarChart3, PieChart as PieChartIcon,
  ArrowUp, ArrowDown, Sparkles, Layout, Search,
  Lock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { api } from '../../data/api';
import { BookingSlot, BookingStatus, UserRole, Space, Reservation, Message } from '../../types';

// Vibrant Palette for Charts
const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#a855f7', '#ec4899', '#6366f1', '#14b8a6'];
const DARK_COLORS = ['#38bdf8', '#4ade80', '#facc15', '#fb923c', '#c084fc', '#f472b6', '#818cf8', '#2dd4bf'];

const cardClass = "bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800";

export const AdminOverview: React.FC<{ mode?: 'overview' | 'customisation' }> = ({ mode = 'overview' }) => {
  const app = useApp() as any;
  const { reservations, spaces, messages, theme } = app;
  const uiTheme = app?.uiTheme;
  const updateUiTheme = app?.updateUiTheme;
  const brandBg = uiTheme?.brandBg ?? '#1e3a8a';
  const brandAccent = uiTheme?.brandAccent ?? '#facc15';
  const [youtubeInput, setYoutubeInput] = useState<string>(uiTheme?.youtubeUrl ?? '');
  const [instagramInput, setInstagramInput] = useState<string>(uiTheme?.instagramUrl ?? '');
  const [tiktokInput, setTiktokInput] = useState<string>(uiTheme?.tiktokUrl ?? '');
  const settingsApi = (api as any).settings;
  const [usersById, setUsersById] = useState<Record<string, { firstName?: string; lastName?: string; companyName?: string; email?: string }>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'occupied'>('all');
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // --- CALCULATIONS ---
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = today.toISOString().split('T')[0];

  // Helper: Calculate price for a reservation
  const calculatePrice = (res: any, space: Space | undefined) => {
    if (!space || space.pricing.isQuote) return 0;
    if (!res.endDate || res.endDate === res.date) {
      // Single day
      return res.slot === BookingSlot.FULL_DAY ? (space.pricing.day || 0) : (space.pricing.halfDay || 0);
    } else {
      // Range
      const start = new Date(res.date);
      const end = new Date(res.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return (space.pricing.day || 0) * diffDays;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const users = await api.users.getAll(true);
        const map: Record<string, any> = {};
        users.forEach(u => { map[u.id] = u; });
        setUsersById(map);
      } catch { }
    })();
  }, []);

  // 1. KPIs
  const monthlyStats = useMemo(() => {
    let revenue = 0;
    let bookingsCount = 0;
    let activeUsers = new Set();

    reservations.forEach(r => {
      const rDate = new Date(r.date);
      if (r.status === BookingStatus.CONFIRMED && rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
        const space = spaces.find(s => s.id === r.spaceId);
        revenue += calculatePrice(r, space);
        bookingsCount++;
        activeUsers.add(r.userId);
      }
    });

    return { revenue, bookingsCount, activeUsers: activeUsers.size };
  }, [reservations, spaces, currentMonth, currentYear]);

  // 2. Charts Data
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    reservations.forEach(r => {
      if (r.status === BookingStatus.CONFIRMED) {
        const space = spaces.find(s => s.id === r.spaceId);
        if (space) {
          const name = space.name;
          counts[name] = (counts[name] || 0) + 1;
        }
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reservations, spaces]);

  // 3. Recent Events
  const recentEvents = useMemo(() => {
    const today = new Date(todayStr);
    return reservations
      .filter(r => r.status === BookingStatus.CONFIRMED)
      .filter(r => {
        const d = new Date(r.date);
        return d <= today || !!r.checkedInAt;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [reservations, todayStr]);

  const liveSummary = useMemo(() => {
    const total = spaces.length || 0;
    let occupied = 0;
    spaces.forEach(s => {
      const r = reservations.find(r => r.spaceId === s.id && r.date === todayStr && r.status === BookingStatus.CONFIRMED);
      if (r) occupied++;
    });
    const free = Math.max(total - occupied, 0);
    const pct = total ? Math.round((occupied / total) * 100) : 0;
    return { occupied, free, total, pct };
  }, [spaces, reservations, todayStr]);

  // 4. Live Status
  const getSpaceStatus = (spaceId: string) => {
    const r = reservations.find(r => r.spaceId === spaceId && r.date === todayStr && r.status === BookingStatus.CONFIRMED);
    if (!r) return { status: 'free', label: 'Libre' };
    return { status: 'occupied', label: 'Occupé', user: r.eventName || 'Client' };
  };

  const getNextReservation = (spaceId: string) => {
    const todayDate = new Date(todayStr).getTime();
    const list = reservations
      .filter(r => r.spaceId === spaceId && r.status === BookingStatus.CONFIRMED)
      .filter(r => new Date(r.date).getTime() >= todayDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return list[0];
  };

  const filteredSpaces = useMemo(() => {
    const items = spaces.filter(s => s.name.toLowerCase().includes(query.toLowerCase().trim()));
    const withStatus = items.filter(s => {
      const st = getSpaceStatus(s.id).status as 'free' | 'occupied';
      if (statusFilter === 'all') return true;
      return st === statusFilter;
    });
    return withStatus.sort((a, b) => {
      const sa = getSpaceStatus(a.id).status;
      const sb = getSpaceStatus(b.id).status;
      if (sa !== sb) return sa === 'occupied' ? 1 : -1;
      const na = getNextReservation(a.id);
      const nb = getNextReservation(b.id);
      const ta = na ? new Date(na.date).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = nb ? new Date(nb.date).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  }, [spaces, reservations, statusFilter, query, todayStr, tick]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (mode === 'customisation') {
      setYoutubeInput(uiTheme?.youtubeUrl ?? '');
      setInstagramInput(uiTheme?.instagramUrl ?? '');
      setTiktokInput(uiTheme?.tiktokUrl ?? '');
    }
  }, [uiTheme?.youtubeUrl, uiTheme?.instagramUrl, uiTheme?.tiktokUrl, mode]);

  const chartColors = theme === 'dark' ? DARK_COLORS : COLORS;

  return (
    <div className="space-y-8 animate-fade-in relative bg-grid-pattern min-h-screen pb-10">

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">{mode === 'customisation' ? "Personnalisation" : "Vue d'ensemble"}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{mode === 'customisation' ? "Paramètres d'apparence et réseaux sociaux." : "Synthèse claire des indicateurs clés."}</p>
        </div>
        <div className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Calendar size={14} />
          {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {mode === 'customisation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${cardClass} p-6`}>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Couleurs de l'interface</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex-1">Bande principale</div>
                <input type="color" value={brandBg} onChange={e => { const v = e.target.value; updateUiTheme({ brandBg: v }); }} className="w-12 h-8 rounded-lg overflow-hidden" />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex-1">Accent</div>
                <input type="color" value={brandAccent} onChange={e => { const v = e.target.value; updateUiTheme({ brandAccent: v }); }} className="w-12 h-8 rounded-lg overflow-hidden" />
              </div>
            </div>
            <div className="mt-4 h-10 rounded-xl border-2 border-zinc-100 dark:border-zinc-800" style={{ background: `linear-gradient(90deg, ${brandBg} 65%, ${brandAccent} 35%)` }}></div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try { await settingsApi?.update({ brandBg, brandAccent }); } catch {}
                  setIsSaving(false);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg border-2 ${isSaving ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors'}`}
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement…' : 'Enregistrer les couleurs'}
              </button>
            </div>
          </div>
          <div className={`${cardClass} p-6`}>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Réseaux sociaux</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex-1">YouTube</div>
                <input
                  type="url"
                  placeholder="https://youtube.com/@votrechaîne"
                  value={youtubeInput}
                  onChange={e => { setYoutubeInput(e.target.value); }}
                  onBlur={async e => { let v = e.target.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; setYoutubeInput(v); updateUiTheme({ youtubeUrl: v }); try { await settingsApi?.update({ youtubeUrl: v }); } catch {} }}
                  onKeyDown={async e => { if (e.key === 'Enter') { const el = e.target as HTMLInputElement; let v = el.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; setYoutubeInput(v); updateUiTheme({ youtubeUrl: v }); try { await settingsApi?.update({ youtubeUrl: v }); } catch {} } }}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm border-2 border-zinc-200 dark:border-zinc-700 outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex-1">Instagram</div>
                <input
                  type="url"
                  placeholder="https://instagram.com/votrecompte"
                  value={instagramInput}
                  onChange={e => { setInstagramInput(e.target.value); }}
                  onBlur={async e => { let v = e.target.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; setInstagramInput(v); updateUiTheme({ instagramUrl: v }); try { await settingsApi?.update({ instagramUrl: v }); } catch {} }}
                  onKeyDown={async e => { if (e.key === 'Enter') { const el = e.target as HTMLInputElement; let v = el.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; setInstagramInput(v); updateUiTheme({ instagramUrl: v }); try { await settingsApi?.update({ instagramUrl: v }); } catch {} } }}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm border-2 border-zinc-200 dark:border-zinc-700 outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex-1">TikTok</div>
                <input
                  type="url"
                  placeholder="https://www.tiktok.com/@votrecompte"
                  value={tiktokInput}
                  onChange={e => { setTiktokInput(e.target.value); }}
                  onBlur={async e => { let v = e.target.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; setTiktokInput(v); updateUiTheme({ tiktokUrl: v }); try { await settingsApi?.update({ tiktokUrl: v }); } catch {} }}
                  onKeyDown={async e => { if (e.key === 'Enter') { const el = e.target as HTMLInputElement; let v = el.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; setTiktokInput(v); updateUiTheme({ tiktokUrl: v }); try { await settingsApi?.update({ tiktokUrl: v }); } catch {} } }}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm border-2 border-zinc-200 dark:border-zinc-700 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    let y = youtubeInput.trim(); if (y && !/^https?:\/\//i.test(y)) y = 'https://' + y;
                    let i = instagramInput.trim(); if (i && !/^https?:\/\//i.test(i)) i = 'https://' + i;
                    let t = tiktokInput.trim(); if (t && !/^https?:\/\//i.test(t)) t = 'https://' + t;
                    setYoutubeInput(y); setInstagramInput(i); setTiktokInput(t);
                    updateUiTheme({ youtubeUrl: y, instagramUrl: i, tiktokUrl: t });
                    try { await settingsApi?.update({ youtubeUrl: y, instagramUrl: i, tiktokUrl: t }); } catch {}
                    setIsSaving(false);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border-2 ${isSaving ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors'}`}
                  disabled={isSaving}
                >
                  {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {! (mode === 'customisation') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative">

        {/* Reservations Card */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 mb-4 text-zinc-700 dark:text-zinc-300">
            <Activity size={18} />
            <span className="text-sm font-bold">Réservations confirmées</span>
          </div>
          <div className="flex items-end gap-6 mb-6">
            <div>
              <div className="text-4xl font-black text-zinc-900 dark:text-white">{monthlyStats.bookingsCount}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Ce mois</div>
            </div>
          </div>
          <div className="space-y-2">
            {reservations
              .filter(r => r.status === BookingStatus.CONFIRMED)
              .filter(r => {
                const d = new Date(r.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 3)
              .map(r => {
                const space = spaces.find(s => s.id === r.spaceId);
                const u = usersById[r.userId];
                const clientLabel = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.companyName || u.email : r.eventName || r.userId;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="truncate flex-1 pr-3">
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">{clientLabel}</div>
                      <div className="text-xs text-zinc-500 truncate">{space?.name}</div>
                    </div>
                    <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Space Distribution */}
        <div className={`${cardClass} p-6`}>
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
              <PieChartIcon size={24} />
            </div>
          </div>
          <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Top des espaces</h3>
          <div className="relative h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-mini-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderRadius: '10px', border: '1px solid #e4e4e7', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {pieData.slice(0, 3).map((entry, index) => (
              <span key={index} className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }}></span>
                <span className="truncate max-w-[120px]">{entry.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Live Status */}
        <div className={`${cardClass} p-6 flex flex-col`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
              <Layout size={24} />
            </div>
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-1 border border-zinc-200 dark:border-zinc-700">
              <Search size={14} className="text-zinc-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher" className="bg-transparent text-xs font-bold outline-none w-24 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setStatusFilter('all')} className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition-all ${statusFilter === 'all' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>Tous</button>
            <button onClick={() => setStatusFilter('free')} className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition-all ${statusFilter === 'free' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>Libre</button>
            <button onClick={() => setStatusFilter('occupied')} className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition-all ${statusFilter === 'occupied' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>Occupé</button>
          </div>
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              <span>Occupés</span>
              <span>{liveSummary.occupied}/{liveSummary.total}</span>
            </div>
            <div className="h-2 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${liveSummary.pct}%` }}></div>
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[150px]">
            {filteredSpaces.slice(0, 6).map(s => {
              const { status, label, user } = getSpaceStatus(s.id);
              const isOccupied = status === 'occupied';
              const next = getNextReservation(s.id);
              const nextLabel = next ? new Date(next.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null;

              return (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isOccupied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">{s.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{isOccupied ? user : (nextLabel ? `Prochaine ${nextLabel}` : 'Disponible')}</div>
                    </div>
                  </div>
                  {isOccupied && <Lock size={14} className="text-zinc-300" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {! (mode === 'customisation') && (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 z-10 relative">
        <div className="xl:col-span-2">
          <div className={`${cardClass} p-8`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl text-zinc-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-black dark:bg-white rounded-xl text-white dark:text-black">
                  <Clock size={20} />
                </div>
                Derniers Événements
              </h3>
              <button className="text-xs font-black px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                Voir tout
              </button>
            </div>

            <div className="space-y-4">
              {recentEvents.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-400 font-bold">Aucun événement récent.</p>
                </div>
              ) : (
                recentEvents.map(ev => {
                  const s = spaces.find(sp => sp.id === ev.spaceId);
                  const u = usersById[ev.userId];
                  const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.companyName || u.email : ev.eventName || ev.userId;
                  const isToday = ev.date === todayStr;
                  const isPast = new Date(ev.date).getTime() < new Date(todayStr).getTime() || !!ev.checkedInAt;

                  return (
                    <div key={ev.id} className="flex items-center gap-5 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                        <MapPin size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-base font-black text-zinc-900 dark:text-white truncate">{name}</div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${isPast ? 'bg-zinc-100 text-zinc-500' :
                            (isToday ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-600')
                            }`}>
                            {isPast ? 'Terminé' : (isToday ? 'Aujourd\'hui' : 'À venir')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
                          <span className="flex items-center gap-1"><Layout size={12} /> {s?.name}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                          <span>{ev.date}{ev.endDate && ev.endDate !== ev.date ? ` → ${ev.endDate}` : ''}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                          <span>{ev.slot === BookingSlot.FULL_DAY ? 'Journée' : 'Demi-journée'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      <style>{`
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
        }
        .dark .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};
