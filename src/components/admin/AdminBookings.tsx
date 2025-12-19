import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookingStatus, Reservation, User, UserRole } from '../../types';
import { api } from '../../data/api';
import { Calendar, Clock, Lock, Check, X, Trash2, Archive, QrCode, Loader2 } from 'lucide-react';
import { AdminQrDisplayModal } from './modals/AdminQrDisplayModal';

interface AdminBookingsProps {
  setViewUser: (user: any) => void;
}

const cardClass = "bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300";
const tableHeaderClass = "bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-5 text-xs font-bold text-slate-500 uppercase tracking-wider";
const tableRowClass = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50";

export const AdminBookings: React.FC<AdminBookingsProps> = ({ setViewUser }) => {
  const { reservations, spaces, validateReservation, cancelReservation, user } = useApp();
  const isAccueil = user?.role === UserRole.ACCUEIL;
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // State for QR Modal
  const [selectedQrRes, setSelectedQrRes] = useState<Reservation | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    let mounted = true;
    api.users.getAll(true).then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);
  const today = new Date().toISOString().split('T')[0];

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'En attente';
      case BookingStatus.CONFIRMED: return 'Validée';
      case BookingStatus.DONE: return 'Terminée';
      case BookingStatus.CANCELLED: return 'Annulée';
      default: return status;
    }
  };

  const activeReservations = React.useMemo(() => {
    const list = reservations.filter(r => {
      if (r.status === BookingStatus.DONE) return false;
      if (r.status === BookingStatus.PENDING) return true;
      if (r.status === BookingStatus.CONFIRMED && r.date >= today) return true;
      return false;
    });
    return list.sort((a, b) => {
      if (a.status === BookingStatus.PENDING && b.status !== BookingStatus.PENDING) return -1;
      if (a.status !== BookingStatus.PENDING && b.status === BookingStatus.PENDING) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [reservations, today]);

  const historyReservations = React.useMemo(() => {
    const list = reservations.filter(r => {
      if (r.status === BookingStatus.CANCELLED) return true;
      if (r.status === BookingStatus.DONE) return true;
      if (r.status === BookingStatus.CONFIRMED && r.date < today) return true;
      return false;
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations, today]);

  const handleValidateBooking = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Validation directe sans confirmation pour une meilleure UX
    setProcessingId(id);
    try {
      // Petit délai artificiel pour feedback visuel
      await new Promise(resolve => setTimeout(resolve, 300));
      await validateReservation(id);
    } catch (error) {
      console.error("Erreur validation:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmId(id);
  };

  const confirmCancel = async () => {
    if (!confirmId) return;
    setProcessingId(confirmId);
    try {
      await cancelReservation(confirmId);
    } catch (error) {
      console.error("Erreur annulation:", error);
    } finally {
      setProcessingId(null);
      setConfirmId(null);
    }
  };

  const handleShowQr = (e: React.MouseEvent, res: Reservation) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedQrRes(res);
  }

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
        { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
        { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
        { bg: 'bg-blue-200 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-400 dark:border-blue-600' }
      ],
      green: [
        { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
        { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
        { bg: 'bg-green-200 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200', border: 'border-green-400 dark:border-green-600' }
      ],
      purple: [
        { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
        { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
        { bg: 'bg-purple-200 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-400 dark:border-purple-600' }
      ],
      orange: [
        { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
        { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
        { bg: 'bg-orange-200 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-400 dark:border-orange-600' }
      ],
      pink: [
        { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
        { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
        { bg: 'bg-pink-200 dark:bg-pink-900/40', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-400 dark:border-pink-600' }
      ],
      teal: [
        { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
        { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
        { bg: 'bg-teal-200 dark:bg-teal-900/40', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-400 dark:border-teal-600' }
      ],
      indigo: [
        { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
        { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
        { bg: 'bg-indigo-200 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-400 dark:border-indigo-600' }
      ],
      amber: [
        { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
        { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
        { bg: 'bg-amber-200 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-400 dark:border-amber-600' }
      ],
      rose: [
        { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
        { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700' },
        { bg: 'bg-rose-200 dark:bg-rose-900/40', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-400 dark:border-rose-600' }
      ]
    };
    return variants[family]?.[varIdx] || variants.rose[0];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Aujourd\'hui';
    if (isTomorrow) return 'Demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const displayList = tab === 'active' ? activeReservations : historyReservations;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${tab === 'active' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Clock size={16} /> En cours & Demandes
          {activeReservations.filter(r => r.status === BookingStatus.PENDING).length > 0 && (
            <span className="bg-ess-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {activeReservations.filter(r => r.status === BookingStatus.PENDING).length}
            </span>
          )}
        </button>
        {!isAccueil && (
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${tab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Archive size={16} /> Historique / Annulés
          </button>
        )}
      </div>

      {/* Version Mobile - Cartes */}
      <div className="md:hidden space-y-4">
        {displayList.length === 0 && (
          <div className={`${cardClass} p-8 text-center text-slate-400 italic`}>
            Aucune réservation dans cette section.
          </div>
        )}
        {displayList.map(r => {
          const space = spaces.find(s => s.id === r.spaceId);
          const client = allUsers.find(u => u.id === r.userId);
          const isProcessing = processingId === r.id;

          return (
            <div key={r.id} className={`${cardClass} p-4 ${r.isGlobalClosure ? 'bg-red-50 dark:bg-red-900/10' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-slate-200 text-sm">{space?.name || 'Espace Inconnu'}</div>
                  <div className="text-xs text-slate-500">{space?.category}</div>
                  {r.isGlobalClosure && <div className="text-xs text-red-500 dark:text-red-400 font-bold mt-1 flex items-center gap-1"><Lock size={10} /> Fermeture Globale</div>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${r.status === BookingStatus.CONFIRMED ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900' :
                  r.status === BookingStatus.PENDING ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                  {getStatusLabel(r.status)}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 text-sm"><Calendar size={14} className="text-slate-400 flex-shrink-0" /> {r.endDate && r.endDate !== r.date ? `${r.date} → ${r.endDate}` : r.date}</div>
                <div className="flex items-center gap-2 text-slate-500 text-xs"><Clock size={14} className="text-slate-400 flex-shrink-0" /> {r.customTimeLabel || r.slot}</div>

                {r.eventName ? (
                  <div className="font-bold px-2 py-1 rounded border text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-xs inline-block">{r.eventName}</div>
                ) : (
                  <button onClick={() => setViewUser(client || null)} className="flex items-center gap-2 group/user text-left">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 group-hover/user:bg-ess-600 group-hover/user:text-white transition-colors">{client?.firstName?.[0] || 'U'}</div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover/user:text-ess-600 dark:group-hover/user:text-ess-400 group-hover/user:underline decoration-ess-600 dark:decoration-ess-800 underline-offset-2 transition-colors">{client ? `${client.firstName} ${client.lastName}` : 'Utilisateur inconnu'}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {r.status === BookingStatus.PENDING ? (
                  <>
                    {!isAccueil && (
                      <button
                        type="button"
                        onClick={(e) => handleValidateBooking(e, r.id)}
                        className="flex-1 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-900 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Valider</>}
                      </button>
                    )}
                    {!isAccueil && (
                      <button
                        type="button"
                        onClick={(e) => handleRejectBooking(e, r.id)}
                        className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <><X size={14} /> Rejeter</>}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {r.status === BookingStatus.CONFIRMED && (
                      <button
                        type="button"
                        onClick={(e) => handleShowQr(e, r)}
                        className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <QrCode size={14} /> QR Code
                      </button>
                    )}
                    {!isAccueil && tab === 'active' && (
                      <button
                        type="button"
                        onClick={(e) => handleRejectBooking(e, r.id)}
                        className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Trash2 size={14} /> Annuler
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Version Desktop - Tableau */}
      <div className="hidden md:block">
        <div className={`${cardClass} overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead className={tableHeaderClass}>
              <tr>
                <th className="p-5">Espace</th>
                <th className="p-5">Dates</th>
                <th className="p-5">Client</th>
                <th className="p-5">Statut</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              {displayList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 italic">
                    Aucune réservation dans cette section.
                  </td>
                </tr>
              )}
              {displayList.map(r => {
                const space = spaces.find(s => s.id === r.spaceId);
                const client = allUsers.find(u => u.id === r.userId);
                const isProcessing = processingId === r.id;
                const spaceColor = space ? getSpaceColor(space.id) : { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };

                return (
                  <tr key={r.id} className={`${tableRowClass} ${r.isGlobalClosure ? 'bg-red-50 dark:bg-red-900/10' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${spaceColor.bg} ${spaceColor.border} ${spaceColor.text}`}>
                           <span className="text-[10px] font-black uppercase">{space?.name.substring(0, 2)}</span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-200 text-sm">{space?.name || 'Espace Inconnu'}</div>
                          <div className="text-xs text-slate-500">{space?.category}</div>
                        </div>
                      </div>
                      {r.isGlobalClosure && <div className="text-xs text-red-500 dark:text-red-400 font-bold mt-1 flex items-center gap-1 ml-11"><Lock size={10} /> Fermeture Globale</div>}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold text-sm">
                          <Calendar size={14} className="text-slate-400" /> 
                          {r.endDate && r.endDate !== r.date ? (
                            <span>{formatDate(r.date)} <span className="text-slate-400 mx-1">→</span> {formatDate(r.endDate)}</span>
                          ) : (
                            formatDate(r.date)
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                             <Clock size={10} /> {r.customTimeLabel || r.slot}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      {r.eventName ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Événement</span>
                          <span className="font-bold px-2 py-1 rounded border text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-sm w-fit">{r.eventName}</span>
                        </div>
                      ) : (
                        <button onClick={() => setViewUser(client || null)} className="flex items-center gap-3 group/user text-left">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 group-hover/user:bg-ess-600 group-hover/user:text-white transition-colors uppercase border-2 border-white dark:border-slate-800 shadow-sm">
                            {client?.firstName?.[0] || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover/user:text-ess-600 dark:group-hover/user:text-ess-400 transition-colors">
                              {client ? `${client.firstName} ${client.lastName}` : 'Utilisateur inconnu'}
                            </span>
                            {client?.companyName && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover/user:text-ess-500 transition-colors">
                                {client.companyName}
                              </span>
                            )}
                          </div>
                        </button>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${r.status === BookingStatus.CONFIRMED ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900' :
                        r.status === BookingStatus.PENDING ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                        {getStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {r.status === BookingStatus.PENDING ? (
                        <div className="flex items-center justify-end gap-2">
                          {!isAccueil && (
                            <button
                              type="button"
                              onClick={(e) => handleValidateBooking(e, r.id)}
                              className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-900 transition-colors shadow-sm active:scale-95 z-10 relative"
                              title="Valider"
                            >
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                          )}
                          {!isAccueil && (
                            <button
                              type="button"
                              onClick={(e) => handleRejectBooking(e, r.id)}
                              className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900 transition-colors shadow-sm active:scale-95 z-10 relative"
                              title="Rejeter"
                            >
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {r.status === BookingStatus.CONFIRMED && (
                            <button
                              type="button"
                              onClick={(e) => handleShowQr(e, r)}
                              className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm active:scale-95 z-10 relative"
                              title="Voir le QR Code"
                            >
                              <QrCode size={16} />
                            </button>
                          )}
                          {!isAccueil && tab === 'active' && (
                            <button
                              type="button"
                              onClick={(e) => handleRejectBooking(e, r.id)}
                              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10 relative"
                              title="Annuler la réservation"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      {selectedQrRes && (
        <AdminQrDisplayModal
          reservation={selectedQrRes}
          space={spaces.find(s => s.id === selectedQrRes.spaceId)}
          user={allUsers.find(u => u.id === selectedQrRes.userId)}
          onClose={() => setSelectedQrRes(null)}
        />
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Confirmation</h3>
              <button onClick={() => setConfirmId(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Voulez-vous vraiment annuler cette réservation ?</p>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-2 justify-end bg-slate-50 dark:bg-slate-950">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-bold text-sm">Non</button>
              <button onClick={confirmCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm disabled:opacity-50" disabled={processingId === confirmId}>{processingId === confirmId ? '...' : 'Oui, annuler'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
