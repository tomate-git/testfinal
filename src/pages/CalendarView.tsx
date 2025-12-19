
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BookingStatus } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Filter, Check, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CalendarView: React.FC = () => {
  const { reservations, spaces } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleSpaceIds, setVisibleSpaceIds] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (spaces.length > 0 && visibleSpaceIds.length === 0) {
      setVisibleSpaceIds(spaces.filter(s => s.showInCalendar !== false).map(s => s.id));
    }
  }, [spaces]);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) setIsFilterMenuOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  // Generate days array
  // Adjust for starting day of the week (Monday start)
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // 0 is Sunday, we want 0 to be Monday

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyStartDays = Array.from({ length: startOffset }, (_, i) => i);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };
  const toggleSpaceVisibility = (id: string) => {
    setVisibleSpaceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAllSpaces = () => setVisibleSpaceIds(spaces.filter(s => s.showInCalendar !== false).map(s => s.id));
  const deselectAllSpaces = () => setVisibleSpaceIds([]);
  const selectExclusiveSpace = (id: string) => setVisibleSpaceIds([id]);

  const groupData = React.useMemo(() => {
    const vis = spaces.filter(s => s.showInCalendar !== false);
    const map = new Map<string, string[]>();
    const kids: Record<string, { id: string; name: string }[]> = {};
    const ungrouped = [] as { id: string; name: string }[];
    for (const s of vis) {
      const m = String(s.id).match(/^(.+?)-(\d+)$/);
      if (m) {
        const key = m[1];
        const arr = map.get(key) || [];
        arr.push(s.id);
        map.set(key, arr);
        if (!kids[key]) kids[key] = [];
        kids[key].push({ id: s.id, name: s.name });
      } else {
        ungrouped.push({ id: s.id, name: s.name });
      }
    }
    const groups = Array.from(map.entries()).map(([key, ids]) => ({ key, ids: ids.sort((a, b) => Number(a.split('-').pop()) - Number(b.split('-').pop())) }));
    return { groups, kids, ungrouped };
  }, [spaces]);

  const toggleGroupVisibility = (key: string) => {
    const ids = groupData.groups.find(g => g.key === key)?.ids || [];
    setVisibleSpaceIds(prev => {
      const allSelected = ids.every(id => prev.includes(id));
      if (allSelected) return prev.filter(id => !ids.includes(id));
      return Array.from(new Set([...prev, ...ids]));
    });
  };
  const selectExclusiveGroup = (key: string) => {
    const ids = groupData.groups.find(g => g.key === key)?.ids || [];
    setVisibleSpaceIds(ids);
    setIsFilterMenuOpen(false);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = formatDateLocal(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return reservations.filter(r => {
      const sDate = String(r.date).split('T')[0];
      const eDate = String(r.endDate || r.date).split('T')[0];
      if (!(dateStr >= sDate && dateStr <= eDate)) return false;
      if (r.status !== BookingStatus.CONFIRMED) return false;
      if (!visibleSpaceIds.includes(r.spaceId)) return false;
      const space = spaces.find(s => s.id === r.spaceId);
      if (space && space.showInCalendar === false) return false;
      return true;
    });
  };

  const getSpaceColor = (spaceId?: string) => {
    if (!spaceId) return 'bg-ess-50 text-ess-700 border-ess-100';
    const space = spaces.find(s => s.id === spaceId);
    const m = spaceId.match(/(.+?)-(\d+)$/);
    const varIdx = m ? parseInt(m[2], 10) % 3 : 0;
    const family = (() => {
      const c = space?.category as any;
      if (c === 'Commerce') return 'blue';
      if (c === 'Bureau') return 'green';
      if (c === 'Créatif') return 'purple';
      if (c === 'Réunion' || c === 'Salle de réunion') return 'orange';
      if (c === 'Bien-être') return 'pink';
      if (c === 'Événementiel') return 'teal';
      if (c === 'Coworking') return 'indigo';
      if (c === 'Commun') return 'amber';
      return 'rose';
    })();
    const variants: Record<string, string[]> = {
      blue: [
        'bg-gradient-to-r from-blue-50 to-blue-200 text-blue-700 border-blue-200',
        'bg-gradient-to-r from-blue-100 to-blue-300 text-blue-700 border-blue-300',
        'bg-gradient-to-r from-blue-200 to-blue-400 text-blue-800 border-blue-400'
      ],
      green: [
        'bg-gradient-to-r from-green-50 to-green-200 text-green-700 border-green-200',
        'bg-gradient-to-r from-green-100 to-green-300 text-green-700 border-green-300',
        'bg-gradient-to-r from-green-200 to-green-400 text-green-800 border-green-400'
      ],
      purple: [
        'bg-gradient-to-r from-purple-50 to-purple-200 text-purple-700 border-purple-200',
        'bg-gradient-to-r from-purple-100 to-purple-300 text-purple-700 border-purple-300',
        'bg-gradient-to-r from-purple-200 to-purple-400 text-purple-800 border-purple-400'
      ],
      orange: [
        'bg-gradient-to-r from-orange-50 to-orange-200 text-orange-700 border-orange-200',
        'bg-gradient-to-r from-orange-100 to-orange-300 text-orange-700 border-orange-300',
        'bg-gradient-to-r from-orange-200 to-orange-400 text-orange-800 border-orange-400'
      ],
      pink: [
        'bg-gradient-to-r from-pink-50 to-pink-200 text-pink-700 border-pink-200',
        'bg-gradient-to-r from-pink-100 to-pink-300 text-pink-700 border-pink-300',
        'bg-gradient-to-r from-pink-200 to-pink-400 text-pink-800 border-pink-400'
      ],
      teal: [
        'bg-gradient-to-r from-teal-50 to-teal-200 text-teal-700 border-teal-200',
        'bg-gradient-to-r from-teal-100 to-teal-300 text-teal-700 border-teal-300',
        'bg-gradient-to-r from-teal-200 to-teal-400 text-teal-800 border-teal-400'
      ],
      indigo: [
        'bg-gradient-to-r from-indigo-50 to-indigo-200 text-indigo-700 border-indigo-200',
        'bg-gradient-to-r from-indigo-100 to-indigo-300 text-indigo-700 border-indigo-300',
        'bg-gradient-to-r from-indigo-200 to-indigo-400 text-indigo-800 border-indigo-400'
      ],
      amber: [
        'bg-gradient-to-r from-amber-50 to-amber-200 text-amber-700 border-amber-200',
        'bg-gradient-to-r from-amber-100 to-amber-300 text-amber-700 border-amber-300',
        'bg-gradient-to-r from-amber-200 to-amber-400 text-amber-800 border-amber-400'
      ],
      rose: [
        'bg-gradient-to-r from-rose-50 to-rose-200 text-rose-700 border-rose-200',
        'bg-gradient-to-r from-rose-100 to-rose-300 text-rose-700 border-rose-300',
        'bg-gradient-to-r from-rose-200 to-rose-400 text-rose-800 border-rose-400'
      ]
    };
    return variants[family][varIdx];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Disponibilités</h1>
          <p className="text-slate-500 font-medium text-sm">Consultez l'occupation de nos espaces en temps réel.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button onClick={goToToday} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition">
            Aujourd'hui
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <div className="flex items-center gap-1">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"><ChevronLeft size={18} /></button>
            <span className="px-2 font-black text-slate-900 min-w-[120px] text-center capitalize text-base">{monthName}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Bureaux
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Commerces
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-ess-500"></span> Autres
          </div>
        </div>
        <div ref={filterMenuRef} className="relative">
          <button onClick={(e) => { e.stopPropagation(); setIsFilterMenuOpen(!isFilterMenuOpen); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs ${isFilterMenuOpen ? 'bg-slate-100 border-slate-900 text-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900'}`}>
            <Filter size={14} />
            <span className="truncate">{visibleSpaceIds.length === spaces.length ? 'Tous' : `${visibleSpaceIds.length} espace(s)`}</span>
          </button>
          <AnimatePresence>
            {isFilterMenuOpen && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-900 p-4 z-50 flex flex-col max-h-[350px]">
                <div className="flex gap-2 pb-3 border-b border-slate-200 mb-3">
                  <button onClick={selectAllSpaces} className="flex-1 py-2 text-xs font-black bg-black text-white rounded-xl">Tout</button>
                  <button onClick={deselectAllSpaces} className="flex-1 py-2 text-xs font-black bg-white text-slate-900 border border-slate-200 rounded-xl">Aucun</button>
                </div>
                <div className="overflow-y-auto space-y-2 flex-1 no-scrollbar">
                  {groupData.groups.map(g => {
                    const allSelected = g.ids.every(id => visibleSpaceIds.includes(id));
                    return (
                      <div key={`grp-${g.key}`} className="rounded-xl">
                        <div className={`flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer`} onClick={() => toggleGroupVisibility(g.key)}>
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${allSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-transparent border-slate-300 text-transparent'}`}>
                              <Check size={14} />
                            </div>
                            <span className={`${allSelected ? 'text-slate-900' : 'text-slate-500'} text-sm font-black truncate capitalize`}>{g.key}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); selectExclusiveGroup(g.key); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition" title="Uniquement">
                            <Eye size={16} />
                          </button>
                        </div>
                        <div className="pl-8 space-y-1">
                          {g.ids.map(id => {
                            const child = (groupData.kids[g.key] || []).find(c => c.id === id);
                            if (!child) return null;
                            const isSelected = visibleSpaceIds.includes(child.id);
                            const c = getSpaceColor(child.id);
                            return (
                              <div key={child.id} className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => toggleSpaceVisibility(child.id)}>
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${isSelected ? c : 'bg-transparent border-slate-300 text-transparent'}`}>
                                    <Check size={14} />
                                  </div>
                                  <span className={`${isSelected ? 'text-slate-900' : 'text-slate-500'} text-sm font-bold truncate`}>{child.name}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); selectExclusiveSpace(child.id); setIsFilterMenuOpen(false); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition" title="Uniquement">
                                  <Eye size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {groupData.ungrouped.map(s => {
                    const isSelected = visibleSpaceIds.includes(s.id);
                    const c = getSpaceColor(s.id);
                    return (
                      <div key={s.id} className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => toggleSpaceVisibility(s.id)}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${isSelected ? c : 'bg-transparent border-slate-300 text-transparent'}`}>
                            <Check size={14} />
                          </div>
                          <span className={`${isSelected ? 'text-slate-900' : 'text-slate-500'} text-sm font-bold truncate`}>{s.name}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); selectExclusiveSpace(s.id); setIsFilterMenuOpen(false); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition" title="Uniquement">
                          <Eye size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="py-3 text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-50/30">
          {emptyStartDays.map(i => (
            <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-slate-100 bg-slate-50/50"></div>
          ))}

          {days.map(day => {
            const events = getEventsForDay(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={day}
                className={`min-h-[100px] border-r border-b border-slate-100 p-2 transition-colors hover:bg-white group relative ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-400 group-hover:text-slate-900'}`}>
                    {day}
                  </span>
                  {events.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-400">{events.length} rés.</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 mb-1">
                  {visibleSpaceIds.map(id => {
                    const dateStr = formatDateLocal(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                    const hasEvent = reservations.some(r => {
                      const sDate = String(r.date).split('T')[0];
                      const eDate = String(r.endDate || r.date).split('T')[0];
                      return r.status === BookingStatus.CONFIRMED && r.spaceId === id && (dateStr >= sDate && dateStr <= eDate);
                    });
                    const c = getSpaceColor(id);
                    return (
                      <div key={`dot-${id}-${day}`} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full border ${hasEvent ? c + ' bg-current border-current' : 'bg-transparent border-slate-300'}`} title={hasEvent ? 'Réservé' : 'Disponible'}></div>
                    );
                  })}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                  {events.map(ev => {
                    const space = spaces.find(s => s.id === ev.spaceId);
                    const colorClass = getSpaceColor(space?.id);
                    return (
                      <div key={ev.id} className={`text-[9px] px-1.5 py-0.5 rounded border truncate font-bold flex items-center gap-1 ${colorClass}`} title={`${space?.name} (${ev.customTimeLabel || ev.slot})`}>
                        <div className={`w-1 h-1 rounded-full bg-current opacity-50 shrink-0`}></div>
                        {space?.name}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
