
import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Calendar, Clock } from 'lucide-react';
import { Reservation, Space, User } from '../../../types';
import { generateQrDataUrl } from '../../../utils/qrGenerator';
import { encodeReservationPayload } from '../../../utils/qrPayload';
import { motion } from 'framer-motion';

interface AdminQrDisplayModalProps {
  reservation: Reservation;
  space?: Space;
  user?: User;
  onClose: () => void;
}

export const AdminQrDisplayModal: React.FC<AdminQrDisplayModalProps> = ({ reservation, space, user, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${reservation.id}`);

  useEffect(() => {
    let cancelled = false;
    const gen = async () => {
      const payload = encodeReservationPayload(reservation.id);
      const dataUrl = await generateQrDataUrl(payload, 300);
      if (!cancelled) setQrUrl(dataUrl);
    };
    gen();
    return () => { cancelled = true; };
  }, [reservation.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
      >

        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-ess-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="relative z-10 p-8 flex flex-col items-center text-center">

          {/* Header */}
          <div className="w-full flex justify-between items-center mb-8 opacity-80">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-white">Pass Client</span>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-8">
            <h3 className="text-2xl font-black tracking-tighter mb-1 text-white">{user ? `${user.firstName} ${user.lastName}` : 'Utilisateur Inconnu'}</h3>
            <p className="text-slate-400 font-medium text-xs uppercase tracking-wide">{space?.name || 'Espace'}</p>
          </div>

          {/* QR Container */}
          <div className="relative bg-white p-5 rounded-3xl shadow-xl shadow-black/20 mb-8">
            <div className="absolute inset-0 border-[3px] border-dashed border-slate-200 rounded-3xl pointer-events-none"></div>
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain mix-blend-multiply" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-3 py-1 rounded-full border border-white/20 shadow-lg whitespace-nowrap">
              ID: {reservation.id}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                <Calendar size={12} />
                <div className="text-[10px] uppercase tracking-wider font-bold">Date</div>
              </div>
              <div className="font-bold text-white text-sm">{reservation.date}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                <Clock size={12} />
                <div className="text-[10px] uppercase tracking-wider font-bold">Horaire</div>
              </div>
              <div className="font-bold text-white text-sm">{space?.name || 'Standard'}</div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 w-full">
            <a
              href={qrUrl}
              download={`qr-${reservation.id}.png`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-ess-600 text-white rounded-xl text-xs font-bold hover:bg-ess-500 transition-colors shadow-lg shadow-ess-500/20"
            >
              <Download size={14} /> Télécharger
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(encodeReservationPayload(reservation.id)); }}
              className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Copy size={14} /> Copier
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
