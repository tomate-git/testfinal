
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Maximize, LayoutGrid, Filter, Check, Eye, Lock, GripVertical, Plus, Clock, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { BookingStatus, Reservation } from '../../types';
import { AdminCreateModal } from './modals/AdminCreateModal';

interface AdminCalendarProps {
  setSelectedReservation: (res: Reservation) => void;
}



export const AdminCalendar: React.FC<AdminCalendarProps> = ({ setSelectedReservation }) => {
  const { reservations, spaces, moveReservation } = useApp();

  const [calDate, setCalDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<'unified' | 'split'>('unified');
  const [visibleSpaceIds, setVisibleSpaceIds] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [showClosures, setShowClosures] = useState(true);
  const [onlyClosures, setOnlyClosures] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Create Modal State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, date: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [createType, setCreateType] = useState<'booking' | 'event'>('booking');

  // Drag & Drop State
  const [draggedResId, setDraggedResId] = useState<string | null>(null);

  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Initialize visible spaces
  useEffect(() => {
    if (spaces.length > 0 && visibleSpaceIds.length === 0) {
      setVisibleSpaceIds(spaces.map(s => s.id));
    }
  }, [spaces]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      setContextMenu(null);
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, dateStr: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, date: dateStr });
  };

  const openCreateModal = (type: 'booking' | 'event') => {
    if (!contextMenu) return;
    setCreateDate(contextMenu.date);
    setCreateType(type);
    setIsCreateModalOpen(true);
    setContextMenu(null);
  };

  const toggleSpaceVisibility = (id: string) => {
    setVisibleSpaceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllSpaces = () => setVisibleSpaceIds(spaces.map(s => s.id));
  const deselectAllSpaces = () => setVisibleSpaceIds([]);
  const selectExclusiveSpace = (id: string) => setVisibleSpaceIds([id]);

  const groupData = React.useMemo(() => {
    const map = new Map<string, string[]>();
    const kids: Record<string, { id: string; name: string }[]> = {};
    const ungrouped = [] as { id: string; name: string }[];
    for (const s of spaces) {
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

  const eventSpaceIds = React.useMemo(() => {
    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const start = new Date(y, m, 1); start.setHours(0,0,0,0);
    const end = new Date(y, m + 1, 0); end.setHours(0,0,0,0);
    const ids = new Set<string>();
    for (const r of reservations) {
      if (!r.isGlobalClosure) continue;
      const rs = new Date(r.date); rs.setHours(0,0,0,0);
      const re = new Date(r.endDate || r.date); re.setHours(0,0,0,0);
      if (re < start || rs > end) continue;
      ids.add(r.spaceId);
    }
    return Array.from(ids).filter(id => spaces.some(s => s.id === id));
  }, [reservations, spaces, calDate]);

  const allEventSelected = eventSpaceIds.length > 0 && eventSpaceIds.every(id => visibleSpaceIds.includes(id));
  const toggleEventSpaces = () => {
    if (eventSpaceIds.length === 0) return;
    setVisibleSpaceIds(prev => {
      const allSelected = eventSpaceIds.every(id => prev.includes(id));
      if (allSelected) return prev.filter(id => !eventSpaceIds.includes(id));
      return Array.from(new Set([...prev, ...eventSpaceIds]));
    });
  };
  const selectOnlyEventSpaces = () => {
    setVisibleSpaceIds(eventSpaceIds);
    setIsFilterMenuOpen(false);
  };

  // --- DRAG & DROP LOGIC ---
  type DragStartEvent = React.DragEvent<HTMLDivElement> | MouseEvent | PointerEvent | TouchEvent;
  const handleDragStart = (e: DragStartEvent, resId: string) => {
    if (typeof e === 'object' && e && 'dataTransfer' in e) {
      const dt = (e as React.DragEvent<HTMLDivElement>).dataTransfer;
      dt.setData("resId", resId);
      dt.effectAllowed = "move";
    }
    setDraggedResId(resId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const resId = e.dataTransfer.getData("resId");

    if (resId && targetDate) {
      await moveReservation(resId, targetDate);
    }
    setDraggedResId(null);
  };

  // Calendar Data
  const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const monthName = calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayObj = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
  const startDay = firstDayObj.getDay();
  const offset = startDay === 0 ? 6 : startDay - 1;
  const blanks = Array.from({ length: offset }, (_, i) => i);
  const todayStr = new Date().toLocaleDateString('fr-CA');

  const getEventsForDay = (day: number, targetSpaceId?: string) => {
    const dateStr = new Date(calDate.getFullYear(), calDate.getMonth(), day).toLocaleDateString('fr-CA');
    return reservations.filter(r => {
      const isClosure = !!r.isGlobalClosure;
      if (onlyClosures && !isClosure) return false;
      if (!showClosures && isClosure) return false;
      if (targetSpaceId) {
        if (r.spaceId !== targetSpaceId) return false;
      } else {
        if (!visibleSpaceIds.includes(r.spaceId)) return false;
      }

      if (r.status === BookingStatus.CANCELLED) return false;
      const start = new Date(r.date);
      const end = r.endDate ? new Date(r.endDate) : start;
      const current = new Date(dateStr);
      start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0); current.setHours(0, 0, 0, 0);
      return current >= start && current <= end;
    });
  };

  const getEventsForDayForSpaces = (day: number, spaceIds: string[]) => {
    const dateStr = new Date(calDate.getFullYear(), calDate.getMonth(), day).toLocaleDateString('fr-CA');
    return reservations.filter(r => {
      const isClosure = !!r.isGlobalClosure;
      if (onlyClosures && !isClosure) return false;
      if (!showClosures && isClosure) return false;
      if (!spaceIds.includes(r.spaceId)) return false;
      if (r.status === BookingStatus.CANCELLED) return false;
      const start = new Date(r.date);
      const end = r.endDate ? new Date(r.endDate) : start;
      const current = new Date(dateStr);
      start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0); current.setHours(0, 0, 0, 0);
      return current >= start && current <= end;
    });
  };

  const calendarTitle = useMemo(() => {
    if (visibleSpaceIds.length === spaces.length) return "Calendrier Global";
    if (visibleSpaceIds.length === 0) return "Aucun espace sélectionné";
    if (visibleSpaceIds.length === 1) {
      const s = spaces.find(x => x.id === visibleSpaceIds[0]);
      return s ? s.name : "Espace inconnu";
    }
    return "Vue Filtrée (" + visibleSpaceIds.length + " espaces)";
  }, [visibleSpaceIds, spaces]);

  const getSpaceColor = (spaceId: string) => {
    const s = spaces.find(x => x.id === spaceId);
    const m = spaceId.match(/(.+?)-(\d+)$/);
    const varIdx = m ? parseInt(m[2], 10) % 3 : 0;
    const family = (() => {
      const c = s?.category as string | undefined;
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
    const variants: Record<string, { bg: string; text: string; border: string }[]> = {
      blue: [
        { bg: 'bg-gradient-to-r from-blue-50 to-blue-200', text: 'text-blue-700', border: 'border-blue-200' },
        { bg: 'bg-gradient-to-r from-blue-100 to-blue-300', text: 'text-blue-700', border: 'border-blue-300' },
        { bg: 'bg-gradient-to-r from-blue-200 to-blue-400', text: 'text-blue-800', border: 'border-blue-400' }
      ],
      green: [
        { bg: 'bg-gradient-to-r from-green-50 to-green-200', text: 'text-green-700', border: 'border-green-200' },
        { bg: 'bg-gradient-to-r from-green-100 to-green-300', text: 'text-green-700', border: 'border-green-300' },
        { bg: 'bg-gradient-to-r from-green-200 to-green-400', text: 'text-green-800', border: 'border-green-400' }
      ],
      purple: [
        { bg: 'bg-gradient-to-r from-purple-50 to-purple-200', text: 'text-purple-700', border: 'border-purple-200' },
        { bg: 'bg-gradient-to-r from-purple-100 to-purple-300', text: 'text-purple-700', border: 'border-purple-300' },
        { bg: 'bg-gradient-to-r from-purple-200 to-purple-400', text: 'text-purple-800', border: 'border-purple-400' }
      ],
      orange: [
        { bg: 'bg-gradient-to-r from-orange-50 to-orange-200', text: 'text-orange-700', border: 'border-orange-200' },
        { bg: 'bg-gradient-to-r from-orange-100 to-orange-300', text: 'text-orange-700', border: 'border-orange-300' },
        { bg: 'bg-gradient-to-r from-orange-200 to-orange-400', text: 'text-orange-800', border: 'border-orange-400' }
      ],
      pink: [
        { bg: 'bg-gradient-to-r from-pink-50 to-pink-200', text: 'text-pink-700', border: 'border-pink-200' },
        { bg: 'bg-gradient-to-r from-pink-100 to-pink-300', text: 'text-pink-700', border: 'border-pink-300' },
        { bg: 'bg-gradient-to-r from-pink-200 to-pink-400', text: 'text-pink-800', border: 'border-pink-400' }
      ],
      teal: [
        { bg: 'bg-gradient-to-r from-teal-50 to-teal-200', text: 'text-teal-700', border: 'border-teal-200' },
        { bg: 'bg-gradient-to-r from-teal-100 to-teal-300', text: 'text-teal-700', border: 'border-teal-300' },
        { bg: 'bg-gradient-to-r from-teal-200 to-teal-400', text: 'text-teal-800', border: 'border-teal-400' }
      ],
      indigo: [
        { bg: 'bg-gradient-to-r from-indigo-50 to-indigo-200', text: 'text-indigo-700', border: 'border-indigo-200' },
        { bg: 'bg-gradient-to-r from-indigo-100 to-indigo-300', text: 'text-indigo-700', border: 'border-indigo-300' },
        { bg: 'bg-gradient-to-r from-indigo-200 to-indigo-400', text: 'text-indigo-800', border: 'border-indigo-400' }
      ],
      amber: [
        { bg: 'bg-gradient-to-r from-amber-50 to-amber-200', text: 'text-amber-700', border: 'border-amber-200' },
        { bg: 'bg-gradient-to-r from-amber-100 to-amber-300', text: 'text-amber-700', border: 'border-amber-300' },
        { bg: 'bg-gradient-to-r from-amber-200 to-amber-400', text: 'text-amber-800', border: 'border-amber-400' }
      ],
      rose: [
        { bg: 'bg-gradient-to-r from-rose-50 to-rose-200', text: 'text-rose-700', border: 'border-rose-200' },
        { bg: 'bg-gradient-to-r from-rose-100 to-rose-300', text: 'text-rose-700', border: 'border-rose-300' },
        { bg: 'bg-gradient-to-r from-rose-200 to-rose-400', text: 'text-rose-800', border: 'border-rose-400' }
      ]
    };
    return variants[family][varIdx];
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative bg-grid-pattern">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-3xl shadow-lg border-2 border-zinc-200 dark:border-zinc-800 gap-4 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 w-full md:w-auto">
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center">
              <Calendar className="text-white dark:text-black" size={20} />
            </div>
            <span className="hidden sm:inline">{calendarTitle}</span>
          </h2>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 rounded-2xl p-1.5 border-2 border-zinc-200 dark:border-zinc-800">
            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition">
              <ChevronLeft size={20} />
            </button>
            <span className="font-black text-base md:text-lg capitalize text-zinc-900 dark:text-white min-w-[140px] md:min-w-[180px] text-center select-none">{monthName}</span>
            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 rounded-2xl p-1.5 border-2 border-zinc-200 dark:border-zinc-800">
            <button onClick={() => setCalendarViewMode('unified')} className={`p-2 rounded-xl transition-all ${calendarViewMode === 'unified' ? 'bg-black dark:bg-white text-white dark:text-black font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`} title="Vue Globale">
              <Maximize size={18} />
            </button>
            <button onClick={() => setCalendarViewMode('split')} className={`p-2 rounded-xl transition-all ${calendarViewMode === 'split' ? 'bg-black dark:bg-white text-white dark:text-black font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`} title="Vue par Espace">
              <LayoutGrid size={18} />
            </button>
          </div>

          <div ref={filterMenuRef} className="relative flex-1 md:flex-none">
            <button onClick={(e) => { e.stopPropagation(); setIsFilterMenuOpen(!isFilterMenuOpen); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 transition-all font-bold text-sm w-full md:w-auto ${isFilterMenuOpen ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-white'}`}>
              <Filter size={18} />
              <span className="truncate">{visibleSpaceIds.length === spaces.length ? 'Tous' : `${visibleSpaceIds.length} espace(s)`}</span>
            </button>

            <AnimatePresence>
              {isFilterMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-full md:w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-zinc-900 dark:border-white p-4 z-50 flex flex-col max-h-[450px]"
                >
                  <div className="flex gap-2 pb-3 border-b-2 border-zinc-200 dark:border-zinc-800 mb-3">
                    <button onClick={selectAllSpaces} className="flex-1 py-2 text-xs font-black bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition">Tout</button>
                    <button onClick={deselectAllSpaces} className="flex-1 py-2 text-xs font-black bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-900 dark:hover:border-white transition">Aucun</button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setShowClosures(v => !v)} className={`flex-1 py-2 text-xs font-black rounded-xl border-2 ${showClosures ? 'bg-black dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white' : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800'}`}>Afficher fermetures</button>
                    <button onClick={() => { setOnlyClosures(v => !v); if (!onlyClosures) setShowClosures(true); }} className={`flex-1 py-2 text-xs font-black rounded-xl border-2 ${onlyClosures ? 'bg-black dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white' : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800'}`}>Uniquement fermetures</button>
                  </div>
                  {eventSpaceIds.length > 0 && (
                    <div className="flex items-center justify-between group p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-950 transition cursor-pointer border-2 border-zinc-200 dark:border-zinc-800 mb-2" onClick={toggleEventSpaces}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${allEventSelected ? 'bg-black dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white' : 'bg-transparent border-zinc-300 dark:border-zinc-600 text-transparent'}`}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                        <span className={`text-sm font-black truncate ${allEventSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Espaces événement</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); selectOnlyEventSpaces(); }} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-950 rounded-lg transition-all" title="Uniquement">
                        <Eye size={16} />
                      </button>
                    </div>
                  )}
                  <div className="overflow-y-auto space-y-2 flex-1 no-scrollbar">
                    {groupData.groups.map(g => {
                      const allSelected = g.ids.every(id => visibleSpaceIds.includes(id));
                      return (
                        <div key={`grp-${g.key}`} className="rounded-xl">
                          <div className={`flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer`} onClick={() => toggleGroupVisibility(g.key)}>
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${allSelected ? 'bg-black dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white' : 'bg-transparent border-zinc-300 dark:border-zinc-600 text-transparent'}`}>
                                <Check size={14} strokeWidth={4} />
                              </div>
                              <span className={`text-sm font-black truncate capitalize ${allSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{g.key}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); selectExclusiveGroup(g.key); }} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-950 rounded-lg transition-all" title="Uniquement">
                              <Eye size={16} />
                            </button>
                          </div>
                          <div className="pl-8 space-y-1">
                            {g.ids.map(id => {
                              const child = (groupData.kids[g.key] || []).find(c => c.id === id);
                              if (!child) return null;
                              const isSelected = visibleSpaceIds.includes(child.id);
                              const colors = getSpaceColor(child.id);
                              return (
                                <div key={child.id} className="flex items-center justify-between group p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer" onClick={() => toggleSpaceVisibility(child.id)}>
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? `${colors.bg} ${colors.border} ${colors.text}` : 'bg-transparent border-zinc-300 dark:border-zinc-600 text-transparent'}`}>
                                      <Check size={14} strokeWidth={4} />
                                    </div>
                                    <span className={`text-sm font-bold truncate ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{child.name}</span>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); selectExclusiveSpace(child.id); setIsFilterMenuOpen(false); }} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-950 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Uniquement">
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
                      const colors = getSpaceColor(s.id);
                      return (
                        <div key={s.id} className="flex items-center justify-between group p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer" onClick={() => toggleSpaceVisibility(s.id)}>
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? `${colors.bg} ${colors.border} ${colors.text}` : 'bg-transparent border-zinc-300 dark:border-zinc-600 text-transparent'}`}>
                              <Check size={14} strokeWidth={4} />
                            </div>
                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{s.name}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); selectExclusiveSpace(s.id); setIsFilterMenuOpen(false); }} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-950 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Uniquement">
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
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {calendarViewMode === 'unified' ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border-2 border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden min-h-[500px]">
            <div className="grid grid-cols-7 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-10">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
                <div key={d} className="py-2 md:py-3 text-center font-black text-zinc-400 text-[10px] md:text-xs uppercase tracking-widest">
                  <span className="hidden md:inline">{['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][i]}</span>
                  <span className="md:hidden">{d}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
              {blanks.map(b => <div key={`blank-${b}`} className="bg-zinc-50 dark:bg-zinc-950 border-r border-b border-zinc-200 dark:border-zinc-800"></div>)}
              {days.map(day => {
                const events = getEventsForDay(day);
                const dateStr = new Date(calDate.getFullYear(), calDate.getMonth(), day).toLocaleDateString('fr-CA');
                const hasGlobalClosure = events.some(e => e.isGlobalClosure);
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={day}
                    onContextMenu={(e) => handleContextMenu(e, dateStr)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`border-r border-b border-zinc-200 dark:border-zinc-800 p-1 transition-all group relative min-h-[70px] md:min-h-[90px] flex flex-col gap-1
                      ${hasGlobalClosure ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'} 
                      ${isToday ? 'ring-2 ring-inset ring-black dark:ring-white' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1 md:mb-2 pointer-events-none">
                      <div className={`text-xs md:text-sm font-black w-6 h-6 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-all ${isToday ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' : 'text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}`}>
                        {day}
                      </div>
                      {hasGlobalClosure && <div className="px-1.5 md:px-2 py-0.5 rounded-lg bg-red-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Lock size={8} className="hidden md:inline" />Fermé</div>}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[60px] md:max-h-[100px] no-scrollbar">
                      {events.map(ev => {
                        const isConfirmed = ev.status === BookingStatus.CONFIRMED;
                        const isEvent = !!ev.eventName;
                        const colors = getSpaceColor(ev.spaceId);

                        return (
                          <motion.div
                            layoutId={ev.id}
                            key={ev.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, ev.id)}
                            onClick={(e) => { e.stopPropagation(); setSelectedReservation(ev); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                text-[9px] md:text-[10px] px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg border truncate font-black w-full text-left transition-all cursor-grab active:cursor-grabbing flex items-center gap-1 group/card
                                ${ev.isGlobalClosure
                                ? 'bg-red-600 text-white border-red-700'
                                : isEvent
                                  ? `${colors.bg} ${colors.text} border-dashed ${colors.border}`
                                  : isConfirmed
                                    ? `${colors.bg} ${colors.text} ${colors.border}`
                                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-400 dark:border-zinc-600'
                              }
                                ${draggedResId === ev.id ? 'opacity-50 border-dashed' : ''}
                              `}
                          >
                            <GripVertical size={8} className="hidden md:inline text-current opacity-50" />
                            <span className="truncate flex-1">{ev.eventName || spaces.find(s => s.id === ev.spaceId)?.name}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 pb-6">
            {groupData.groups.map(g => {
              const children = g.ids.filter(id => visibleSpaceIds.includes(id)).map(id => spaces.find(s => s.id === id)).filter(Boolean) as typeof spaces;
              if (children.length === 0) return null;
              const label = ((groupData.kids[g.key] || [])[0]?.name || g.key).replace(/\s*-?\s*\d+$/, '');
              const isExpanded = !!expandedGroups[g.key];
              return (
                <React.Fragment>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`grp-card-${g.key}`}
                  className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:shadow-xl transition"
                >
                  <div className="p-3 md:p-4 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white">
                        <LayoutGrid size={16} />
                      </div>
                      <h4 className="font-black text-zinc-900 dark:text-white truncate text-sm md:text-lg capitalize">{label}</h4>
                    </div>
                    <button onClick={() => setExpandedGroups(prev => ({ ...prev, [g.key]: !isExpanded }))} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white transition" title={isExpanded ? 'Réduire' : 'Étendre'}>
                      <ChevronDown size={14} className={`${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {isExpanded ? null : (
                  <div className={`flex flex-col h-[400px] md:h-[450px]`}>
                    <div className="grid grid-cols-7 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="py-2 md:py-3 text-center">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr text-xs">
                      {blanks.map(b => <div key={`blank-${g.key}-${b}`} className="border-r border-b border-zinc-200 dark:border-zinc-800"></div>)}
                      {days.map(day => {
                        const events = getEventsForDayForSpaces(day, children.map(s => s.id));
                        const dateStr = new Date(calDate.getFullYear(), calDate.getMonth(), day).toLocaleDateString('fr-CA');
                        const isToday = dateStr === todayStr;
                        const hasEvent = events.length > 0;
                        return (
                          <div
                            key={`${g.key}-agg-${day}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dateStr)}
                            className={`border-r border-b border-zinc-200 dark:border-zinc-800 p-1 flex flex-col items-center justify-start transition
                              ${isToday ? 'ring-2 ring-inset ring-black dark:ring-white' : ''} 
                              ${hasEvent ? 'bg-zinc-50 dark:bg-zinc-800/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}
                            `}
                          >
                            <span className={`mb-1 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-lg text-[9px] md:text-[10px] transition ${isToday ? 'bg-black dark:bg-white text-white dark:text-black font-black' : 'text-zinc-600 dark:text-zinc-400'}`}>{day}</span>
                            <div className="w-full space-y-1 overflow-hidden px-0.5">
                              {events.map(ev => {
                                const colors = getSpaceColor(ev.spaceId);
                                return (
                                  <motion.div
                                    layoutId={`mini-agg-${ev.id}`}
                                    key={ev.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, ev.id)}
                                    onClick={() => setSelectedReservation(ev)}
                                    className={`h-1.5 md:h-2 w-full rounded-sm cursor-grab active:cursor-grabbing ${ev.isGlobalClosure ? 'bg-red-600' :
                                      ev.eventName ? `${colors.bg} border border-dashed ${colors.border}` :
                                        ev.status === BookingStatus.CONFIRMED ? `${colors.bg} ${colors.border}` : 'bg-zinc-300 dark:bg-zinc-700'
                                      } ${draggedResId === ev.id ? 'opacity-50' : ''}`}
                                    title={ev.eventName || 'Réservé'}
                                    whileHover={{ scale: 1.1 }}
                                  ></motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  )}
                </motion.div>
                {isExpanded && children.map(space => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`expanded-${space.id}`}
                    className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-[400px] md:h-[450px] hover:shadow-xl transition"
                  >
                    <div className="p-3 md:p-4 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getSpaceColor(space.id).bg} ${getSpaceColor(space.id).text}`}>
                          <MapPin size={16} />
                        </div>
                        <h4 className="font-black text-zinc-900 dark:text-white truncate text-sm md:text-lg">{space.name}</h4>
                      </div>
                      <button onClick={() => { selectExclusiveSpace(space.id); setCalendarViewMode('unified'); }} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white transition">
                        <Maximize size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="py-2 md:py-3 text-center">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr text-xs">
                      {blanks.map(b => <div key={`blank-expanded-${space.id}-${b}`} className="border-r border-b border-zinc-200 dark:border-zinc-800"></div>)}
                      {days.map(day => {
                        const events = getEventsForDay(day, space.id);
                        const dateStr = new Date(calDate.getFullYear(), calDate.getMonth(), day).toLocaleDateString('fr-CA');
                        const isToday = dateStr === todayStr;
                        const hasEvent = events.length > 0;
                        return (
                          <div
                            key={`expanded-${space.id}-${day}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dateStr)}
                            className={`border-r border-b border-zinc-200 dark:border-zinc-800 p-1 flex flex-col items-center justify-start transition
                              ${isToday ? 'ring-2 ring-inset ring-black dark:ring-white' : ''} 
                              ${hasEvent ? 'bg-zinc-50 dark:bg-zinc-800/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}
                            `}
                          >
                            <span className={`mb-1 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-lg text-[9px] md:text-[10px] transition ${isToday ? 'bg-black dark:bg-white text-white dark:text-black font-black' : 'text-zinc-600 dark:text-zinc-400'}`}>{day}</span>
                            <div className="w-full space-y-1 overflow-hidden px-0.5">
                              {events.map(ev => (
                                <motion.div
                                  layoutId={`mini-expanded-${ev.id}`}
                                  key={ev.id}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, ev.id)}
                                  onClick={() => setSelectedReservation(ev)}
                                  className={`h-1.5 md:h-2 w-full rounded-sm cursor-grab active:cursor-grabbing ${ev.isGlobalClosure ? 'bg-red-600' :
                                    ev.eventName ? `${getSpaceColor(space.id).bg} border border-dashed ${getSpaceColor(space.id).border}` :
                                      ev.status === BookingStatus.CONFIRMED ? `${getSpaceColor(space.id).bg} ${getSpaceColor(space.id).border}` : 'bg-zinc-300 dark:bg-zinc-700'
                                    } ${draggedResId === ev.id ? 'opacity-50' : ''}`}
                                  title={ev.eventName || "Réservé"}
                                  whileHover={{ scale: 1.1 }}
                                ></motion.div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
                </React.Fragment>
              );
            })}

            {groupData.ungrouped.filter(s => visibleSpaceIds.includes(s.id)).map(space => {
              const colors = getSpaceColor(space.id);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={space.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-[400px] md:h-[450px] hover:shadow-xl transition"
                >
                  <div className="p-3 md:p-4 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                        <MapPin size={16} />
                      </div>
                      <h4 className="font-black text-zinc-900 dark:text-white truncate text-sm md:text-lg">{space.name}</h4>
                    </div>
                    <button onClick={() => { selectExclusiveSpace(space.id); setCalendarViewMode('unified'); }} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white transition">
                      <Maximize size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="py-2 md:py-3 text-center">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 flex-1 auto-rows-fr text-xs">
                    {blanks.map(b => <div key={`blank-${b}`} className="border-r border-b border-zinc-200 dark:border-zinc-800"></div>)}
                    {days.map(day => {
                      const events = getEventsForDay(day, space.id);
                      const dateStr = new Date(calDate.getFullYear(), calDate.getMonth(), day).toLocaleDateString('fr-CA');
                      const isToday = dateStr === todayStr;
                      const hasEvent = events.length > 0;
                      return (
                        <div
                          key={day}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dateStr)}
                          className={`border-r border-b border-zinc-200 dark:border-zinc-800 p-1 flex flex-col items-center justify-start transition
                            ${isToday ? 'ring-2 ring-inset ring-black dark:ring-white' : ''} 
                            ${hasEvent ? 'bg-zinc-50 dark:bg-zinc-800/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}
                          `}
                        >
                          <span className={`mb-1 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-[9px] md:text-[10px] transition ${isToday ? 'bg-black dark:bg-white text-white dark:text-black font-black' : 'text-zinc-600 dark:text-zinc-400'}`}>{day}</span>
                          <div className="w-full space-y-1 overflow-hidden px-0.5">
                            {events.map(ev => (
                              <motion.div
                                layoutId={`mini-${ev.id}`}
                                key={ev.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, ev.id)}
                                onClick={() => setSelectedReservation(ev)}
                                className={`h-1.5 md:h-2 w-full rounded-full cursor-grab active:cursor-grabbing ${ev.isGlobalClosure ? 'bg-red-600' :
                                  ev.eventName ? `${colors.bg} border border-dashed ${colors.border}` :
                                    ev.status === BookingStatus.CONFIRMED ? `${colors.bg} ${colors.border}` : 'bg-zinc-300 dark:bg-zinc-700'
                                  } ${draggedResId === ev.id ? 'opacity-50' : ''}`}
                                title={ev.eventName || "Réservé"}
                                whileHover={{ scale: 1.1 }}
                              ></motion.div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-zinc-900 dark:border-white w-64 overflow-hidden"
            style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 260) }}
          >
            <div className="px-4 py-3 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Date</div>
              <div className="font-black text-zinc-900 dark:text-white capitalize text-sm">{new Date(contextMenu.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
            <div className="p-2 space-y-1">
              <button onClick={() => openCreateModal('booking')} className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white text-sm font-bold flex items-center gap-3 transition rounded-xl">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <Plus size={16} />
                </div>
                Réservation
              </button>
              <button onClick={() => openCreateModal('event')} className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white text-sm font-bold flex items-center gap-3 transition rounded-xl">
                <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white flex items-center justify-center">
                  <Clock size={16} />
                </div>
                Événement
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isCreateModalOpen && (
        <AdminCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialDate={createDate}
          initialType={createType}
        />
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
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};
