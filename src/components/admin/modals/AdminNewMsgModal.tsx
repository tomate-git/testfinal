
import React, { useEffect, useState } from 'react';
import { api } from '../../../data/api';
import { UserRole, User } from '../../../types';
import { X } from 'lucide-react';

interface AdminNewMsgModalProps {
  onClose: () => void;
  onSelectUser: (email: string) => void;
}

const cardClass = "bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300";

export const AdminNewMsgModal: React.FC<AdminNewMsgModalProps> = ({ onClose, onSelectUser }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    let mounted = true;
    api.users.getAll().then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`${cardClass} w-full max-w-md overflow-hidden`}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Nouvelle Conversation</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition"><X size={20} /></button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1.5">Sélectionner un utilisateur</label>
          <div className="space-y-2 mt-2 max-h-64 overflow-y-auto custom-scrollbar">
            {allUsers.filter(u => u.role !== UserRole.ADMIN).map(u => (
              <button
                key={u.id}
                onClick={() => onSelectUser(u.email)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition text-left group"
              >
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-500 group-hover:bg-ess-600 group-hover:text-white">
                  {u.firstName?.[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-200">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
