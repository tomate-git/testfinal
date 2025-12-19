
import React, { useState } from 'react';
import { User, UserType, UserRole } from '../../../types';
import { X, Mail, Phone, Building, FileText, MessageSquare, Pencil, Trash, Save, User as UserIcon, Shield } from 'lucide-react';
import { api } from '../../../data/api';

interface AdminUserModalProps {
  user: User;
  onClose: () => void;
  onContact: (email: string) => void;
  onUpdated?: (user: User) => void;
  onDeleted?: () => void;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({ user, onClose, onContact, onUpdated, onDeleted }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<User>({ ...user });

  const handleChange = (field: keyof User, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const updated = await api.users.update(form);
      onUpdated && onUpdated(updated);
      setIsEdit(false);
    } catch (e) {
      alert('Échec de la mise à jour du compte');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce compte ? Cette action est irréversible.')) return;
    try {
      await api.users.delete(user.id);
      onDeleted && onDeleted();
      onClose();
    } catch (e) {
      alert('Échec de la suppression du compte');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border-2 border-zinc-900 dark:border-white animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-6 border-b-2 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-2xl font-black border-2 border-zinc-900 dark:border-white shadow-lg">
                {form.firstName?.[0]}{form.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{form.firstName} {form.lastName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border-2 ${form.type === UserType.COMPANY
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                    }`}>
                    {form.type === UserType.COMPANY ? <Building size={12} /> : <UserIcon size={12} />}
                    {form.type === UserType.COMPANY ? 'Entreprise' : 'Particulier'}
                  </span>
                  {form.role === UserRole.ADMIN && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font.black bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white">
                      <Shield size={12} />
                      ADMIN
                    </span>
                  )}
                  {form.role === UserRole.ACCUEIL && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font.black bg-zinc-900 dark:bg-white text-white dark:text-black border-2 border-zinc-900 dark:border-white">
                      <Shield size={12} />
                      ACCUEIL
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-grid-pattern">
          {!isEdit ? (
            // View Mode
            <div className="space-y-3">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:border-zinc-900 dark:hover:border-white transition-all">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700">
                  <Mail className="text-zinc-600 dark:text-zinc-400" size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Email</div>
                  <div className="font-bold text-zinc-900 dark:text-white">{form.email}</div>
                </div>
              </div>

              {form.phone && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:border-zinc-900 dark:hover:border-white transition-all">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700">
                    <Phone className="text-zinc-600 dark:text-zinc-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Téléphone</div>
                    <div className="font-bold text-zinc-900 dark:text-white">{form.phone}</div>
                  </div>
                </div>
              )}

              {form.type === UserType.COMPANY && (
                <>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:border-zinc-900 dark:hover:border-white transition-all">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700">
                      <Building className="text-zinc-600 dark:text-zinc-400" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Entreprise</div>
                      <div className="font-bold text-zinc-900 dark:text-white">{form.companyName}</div>
                    </div>
                  </div>
                  {form.siret && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:border-zinc-900 dark:hover:border-white transition-all">
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700">
                        <FileText className="text-zinc-600 dark:text-zinc-400" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">SIRET</div>
                        <div className="font-bold text-zinc-900 dark:text-white font-mono">{form.siret}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 block">Prénom</label>
                  <input
                    className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    placeholder="Prénom"
                    value={form.firstName || ''}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 block">Nom</label>
                  <input
                    className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    placeholder="Nom"
                    value={form.lastName || ''}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 block">Téléphone</label>
                <input
                  className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                  placeholder="Téléphone"
                  value={form.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 block">Rôle</label>
                  <select
                    className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    value={form.role}
                    onChange={(e) => handleChange('role', e.target.value as UserRole)}
                  >
                    <option value={UserRole.USER}>Utilisateur</option>
                    <option value={UserRole.ADMIN}>Administrateur</option>
                    <option value={UserRole.ACCUEIL}>Accueil</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 block">Type</label>
                  <select
                    className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value as UserType)}
                  >
                    <option value={UserType.INDIVIDUAL}>Particulier</option>
                    <option value={UserType.COMPANY}>Entreprise</option>
                  </select>
                </div>
              </div>

              {form.type === UserType.COMPANY && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 block">Entreprise</label>
                    <input
                      className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-bold focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                      placeholder="Nom de l'entreprise"
                      value={form.companyName || ''}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 block">SIRET</label>
                    <input
                      className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-bold font-mono focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                      placeholder="SIRET"
                      value={form.siret || ''}
                      onChange={(e) => handleChange('siret', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          {!isEdit ? (
            <div className="flex gap-3">
              <button
                onClick={() => onContact(form.email)}
                className="flex-1 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare size={18} />
                Envoyer un message
              </button>
              <button
                onClick={() => setIsEdit(true)}
                className="flex-1 py-3.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl font-black border-2 border-zinc-900 dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-2 text-sm"
              >
                <Pencil size={18} />
                Modifier
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <Save size={18} />
                Enregistrer
              </button>
              <button
                onClick={() => setIsEdit(false)}
                className="px-6 py-3.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl font-black border-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3.5 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <Trash size={18} />
              </button>
            </div>
          )}
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
