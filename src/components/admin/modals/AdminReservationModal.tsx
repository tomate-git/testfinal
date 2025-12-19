
import React, { useEffect, useState } from 'react';
import { Reservation, BookingStatus } from '../../../types';
import { X, Lock, Calendar, Clock, Check, Trash2, User, Building, MapPin, AlertTriangle, Mail, Phone } from 'lucide-react';
import { api } from '../../../data/api';
import type { User as UserType } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { modalStyles, modalAnimationVariants } from './sharedModalStyles';

interface AdminReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
}

export const AdminReservationModal: React.FC<AdminReservationModalProps> = ({ reservation, onClose }) => {
  const { spaces, validateReservation, cancelReservation } = useApp();
  const [loading, setLoading] = useState(false);
  const [confirmType, setConfirmType] = useState<null | 'reject' | 'delete'>(null);

  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  useEffect(() => {
    let mounted = true;
    api.users.getAll().then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);
  const space = spaces.find(s => s.id === reservation.spaceId);
  const user = allUsers.find(u => u.id === reservation.userId);

  const handleValidate = async () => {
    setLoading(true);
    try {
      await validateReservation(reservation.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setConfirmType('reject');
  };

  const handleConfirmReject = async () => {
    setLoading(true);
    try {
      await cancelReservation(reservation.id);
      setConfirmType(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmType('delete');
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await cancelReservation(reservation.id);
      setConfirmType(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={modalStyles.overlayClass}>
      <motion.div
        variants={modalAnimationVariants.modal}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`${modalStyles.cardClassPremium} w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative bg-grid-pattern`}
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl z-10">
          <div>
            <h3 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-black dark:bg-white rounded-xl text-white dark:text-black">
                {reservation.eventName ? <Calendar size={20} /> : <User size={20} />}
              </div>
              {reservation.eventName ? 'Détails Événement' : 'Détails Réservation'}
            </h3>
            <div className="text-xs font-bold text-zinc-400 mt-1 ml-1">ID: {reservation.id}</div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-zinc-50/50 dark:bg-zinc-950/50 z-0">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl border-2 border-zinc-200 dark:border-zinc-700">
                <MapPin size={24} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Espace Réservé</div>
                <div className="font-black text-zinc-900 dark:text-white text-lg leading-tight">{space?.name || 'Espace Inconnu'}</div>
                {reservation.isGlobalClosure && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-black border-2 border-red-200 dark:border-red-900/50 uppercase tracking-wide">
                    <Lock size={12} /> Fermeture Totale
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-zinc-100 dark:border-zinc-800">
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Date</div>
                <div className="text-zinc-900 dark:text-white font-bold flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-zinc-400" />
                  {reservation.date}
                  {reservation.endDate && reservation.endDate !== reservation.date && ` ➔ ${reservation.endDate}`}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Créneau</div>
                <div className="text-zinc-900 dark:text-white font-bold flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-zinc-400" />
                  {reservation.customTimeLabel || reservation.slot}
                </div>
              </div>
            </div>
          </div>

          {/* User or Event Details */}
          {reservation.eventName ? (
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Calendar size={100} />
              </div>
              <div className="relative z-10">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Événement Public</div>
                <div className="font-black text-zinc-900 dark:text-white text-xl mb-3">{reservation.eventName}</div>
                {reservation.eventDescription && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    "{reservation.eventDescription}"
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Client / Réservataire</div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-black text-zinc-400 dark:text-zinc-500 border-2 border-zinc-200 dark:border-zinc-700">
                  {user?.firstName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-zinc-900 dark:text-white text-lg truncate">{user?.firstName} {user?.lastName}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-wide mb-1">
                    {user?.companyName ? <><Building size={12} /> {user.companyName}</> : <><User size={12} /> Particulier</>}
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-lg w-fit">
                      <Mail size={10} /> {user?.email}
                    </div>
                    {user?.phone && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-lg w-fit">
                        <Phone size={10} /> {user.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-3 z-10">
          {reservation.status === BookingStatus.PENDING ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleValidate}
                disabled={loading}
                className="flex-1 py-4 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                {loading ? '...' : <><Check size={20} /> Valider la demande</>}
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-red-600 border-2 border-red-100 dark:border-red-900/30 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                {loading ? '...' : <><X size={20} /> Refuser</>}
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-2 ${reservation.status === BookingStatus.CONFIRMED ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                <div className={`w-2 h-2 rounded-full ${reservation.status === BookingStatus.CONFIRMED ? 'bg-black dark:bg-white' : 'bg-zinc-500'}`}></div>
                {reservation.status}
              </div>

              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-black text-sm transition-colors disabled:opacity-50 border-2 border-transparent hover:border-red-100 dark:hover:border-red-900/30"
              >
                <Trash2 size={18} /> Supprimer
              </button>
            </div>
          )}
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
      </motion.div>

      {/* Confirmation Overlay */}
      <AnimatePresence>
        {confirmType && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/20 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border-2 border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-red-100 dark:border-red-900/30">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="font-black text-xl text-zinc-900 dark:text-white mb-3">Êtes-vous sûr ?</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                  {confirmType === 'reject' ? 'Vous allez refuser cette demande de réservation. Cette action est irréversible.' : 'Vous allez supprimer définitivement cette réservation. Cette action est irréversible.'}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 flex gap-3 border-t-2 border-zinc-100 dark:border-zinc-800">
                <button onClick={() => setConfirmType(null)} className="flex-1 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">Annuler</button>
                <button
                  onClick={confirmType === 'reject' ? handleConfirmReject : handleConfirmDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-600/20 transition"
                  disabled={loading}
                >
                  {loading ? '...' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
