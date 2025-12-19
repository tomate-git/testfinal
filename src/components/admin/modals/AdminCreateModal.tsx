import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { BookingSlot, BookingStatus, Reservation, UserRole, User } from '../../../types';
import { api } from '../../../data/api';
import { X, Users, Megaphone, Save, Calendar, Clock, AlignLeft, Type, Lock } from 'lucide-react';

interface AdminCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialType?: 'booking' | 'event';
}

export const AdminCreateModal: React.FC<AdminCreateModalProps> = ({ isOpen, onClose, initialDate, initialType }) => {
  const { spaces, refreshData, user } = useApp();
  const [creationType, setCreationType] = useState<'booking' | 'event'>(initialType || 'booking');
  const [useCustomSlot, setUseCustomSlot] = useState(false);
  const [isGlobalClosure, setIsGlobalClosure] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    let mounted = true;
    api.users.getAll().then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);

  const [newEvent, setNewEvent] = useState({
    spaceId: '',
    userId: '',
    date: initialDate || new Date().toISOString().split('T')[0],
    endDate: '',
    slot: BookingSlot.FULL_DAY,
    name: '',
    description: '',
    eventImage: '',
    customTimeLabel: ''
  });

  useEffect(() => {
    if (initialDate) setNewEvent(prev => ({ ...prev, date: initialDate }));
    if (initialType) setCreationType(initialType);
  }, [initialDate, initialType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newEvent.spaceId) { alert("Veuillez sélectionner un espace"); return; }
    if (creationType === 'booking' && !newEvent.userId) { alert("Veuillez sélectionner un client"); return; }
    if (creationType === 'event' && !newEvent.name) { alert("Veuillez donner un nom à l'événement"); return; }

    const newRes: Reservation = {
      id: 'r-admin-' + Date.now(),
      spaceId: newEvent.spaceId,
      userId: creationType === 'booking' ? newEvent.userId : user.id,
      date: newEvent.date,
      endDate: newEvent.endDate || undefined,
      slot: newEvent.slot,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date().toISOString(),
      eventName: creationType === 'event' ? newEvent.name : undefined,
      eventDescription: creationType === 'event' ? newEvent.description : undefined,
      eventImage: creationType === 'event' ? newEvent.eventImage : undefined,
      customTimeLabel: (creationType === 'event' && useCustomSlot) ? newEvent.customTimeLabel : undefined,
      isGlobalClosure: (creationType === 'event' && isGlobalClosure)
    };

    try {
      await api.reservations.add(newRes);
      await refreshData();
      onClose();
      alert("Création effectuée avec succès !");
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : (err?.message || (() => { try { return JSON.stringify(err) } catch { return String(err) } })());
      alert("Échec de la création : " + msg);
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl overflow-hidden animate-fade-in-up border-2 border-zinc-900 dark:border-white shadow-2xl rounded-3xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-6 border-b-2 border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
          <div>
            <h3 className="font-black text-2xl text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${creationType === 'booking' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'}`}>
                {creationType === 'booking' ? <Users size={24} /> : <Megaphone size={24} />}
              </div>
              {creationType === 'booking' ? 'Nouvelle Réservation' : 'Nouvel Événement'}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mt-2 ml-15">Remplissez les informations ci-dessous</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar bg-grid-pattern">
          <form onSubmit={handleCreate} className="space-y-6">

            {/* Type Switcher */}
            <div className="flex p-2 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCreationType('booking')}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${creationType === 'booking' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                <Users size={16} /> Réservation
              </button>
              <button
                type="button"
                onClick={() => setCreationType('event')}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${creationType === 'event' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                <Megaphone size={16} /> Événement
              </button>
            </div>

            <div className="space-y-6">
              {/* Space Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Espace concerné</label>
                <select
                  value={newEvent.spaceId}
                  onChange={e => setNewEvent({ ...newEvent, spaceId: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                >
                  <option value="">-- Choisir un espace --</option>
                  {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* User Selection (Booking Only) */}
              {creationType === 'booking' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Client</label>
                  <select
                    value={newEvent.userId}
                    onChange={e => setNewEvent({ ...newEvent, userId: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                  >
                    <option value="">-- Choisir un utilisateur --</option>
                    {allUsers.filter(u => u.role !== UserRole.ADMIN).map(u => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName} {u.companyName ? `(${u.companyName})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Event Details (Event Only) */}
              {creationType === 'event' && (
                <div className="space-y-4 animate-fade-in bg-white dark:bg-zinc-900 p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Nom de l'événement</label>
                    <div className="relative">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="text"
                        value={newEvent.name}
                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                        placeholder="Ex: Conférence, Fermeture..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Image de couverture (URL)</label>
                    <div className="relative">
                      <Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="text"
                        value={newEvent.eventImage}
                        onChange={e => setNewEvent({ ...newEvent, eventImage: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                        placeholder="https://example.com/image.jpg (Format 1448x2048 conseillé)"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Description (Interne)</label>
                    <div className="relative">
                      <AlignLeft className="absolute left-4 top-4 text-zinc-400" size={18} />
                      <textarea
                        value={newEvent.description}
                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all min-h-[100px] resize-none"
                        placeholder="Détails pour l'équipe..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800">
                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          id="globalClosure"
                          type="checkbox"
                          checked={isGlobalClosure}
                          onChange={(e) => setIsGlobalClosure(e.target.checked)}
                          className="h-5 w-5 rounded border-2 border-zinc-300 dark:border-zinc-700 text-red-600 focus:ring-red-600"
                        />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <label htmlFor="globalClosure" className="font-black text-zinc-900 dark:text-white flex items-center gap-2">
                          <Lock size={14} />
                          Fermeture Totale
                        </label>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs">Empêche toute réservation sur tous les espaces.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Date de début</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="date"
                      required
                      value={newEvent.date}
                      onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Date de fin (Optionnel)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="date"
                      value={newEvent.endDate}
                      onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                      min={newEvent.date}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">Créneau Horaire</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  {useCustomSlot ? (
                    <input
                      type="text"
                      placeholder="Ex: 18h00 - 23h30"
                      value={newEvent.customTimeLabel}
                      onChange={e => setNewEvent({ ...newEvent, customTimeLabel: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    />
                  ) : (
                    <select
                      value={newEvent.slot}
                      onChange={e => setNewEvent({ ...newEvent, slot: e.target.value as BookingSlot })}
                      className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    >
                      {Object.values(BookingSlot).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
                {creationType === 'event' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomTime"
                      checked={useCustomSlot}
                      onChange={(e) => setUseCustomSlot(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-zinc-500"
                    />
                    <label htmlFor="useCustomTime" className="text-xs font-black text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">Horaire personnalisé</label>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-lg shadow-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Save size={24} />
                {creationType === 'event' ? "Créer l'événement" : "Valider la réservation"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
