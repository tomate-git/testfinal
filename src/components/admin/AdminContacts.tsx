
import React, { useEffect, useState } from 'react';
import { api } from '../../data/api';
import { UserType, UserRole, User } from '../../types';
import { Mail, Phone, Building, User as UserIcon, Info, Pencil, Trash, Search, UserPlus } from 'lucide-react';
import { AdminUserModal } from './modals/AdminUserModal';

interface AdminContactsProps {
  setActiveTab: (tab: any) => void;
  setSelectedEmail: (email: string) => void;
}

export const AdminContacts: React.FC<AdminContactsProps> = ({ setActiveTab, setSelectedEmail }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    api.users.getAll().then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);

  const filteredUsers = allUsers.filter(u => {
    const search = searchTerm.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(search) ||
      u.lastName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.companyName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Contacts</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gérez et consultez tous les utilisateurs</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-black dark:focus:border-white outline-none transition-all"
            />
          </div>
          <button className="px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm hover:opacity-90 transition shadow-lg flex items-center gap-2 whitespace-nowrap">
            <UserPlus size={18} />
            <span className="hidden md:inline">Nouveau</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-200 dark:border-zinc-800">
                <th className="p-5 text-xs font-black text-zinc-400 uppercase tracking-widest">Utilisateur</th>
                <th className="p-5 text-xs font-black text-zinc-400 uppercase tracking-widest">Type</th>
                <th className="p-5 text-xs font-black text-zinc-400 uppercase tracking-widest">Coordonnées</th>
                <th className="p-5 text-xs font-black text-zinc-400 uppercase tracking-widest">Statut</th>
                <th className="p-5 text-xs font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white font-black uppercase border-2 border-zinc-200 dark:border-zinc-700 text-base">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-zinc-900 dark:text-white text-base">{u.firstName} {u.lastName}</div>
                        {u.companyName && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5 mt-0.5">
                            <Building size={11} />
                            {u.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 ${u.type === UserType.COMPANY
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-900 dark:border-white'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}>
                      {u.type === UserType.COMPANY ? <Building size={12} /> : <UserIcon size={12} />}
                      {u.type === UserType.COMPANY ? 'Entreprise' : 'Particulier'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        <Mail size={14} />
                        {u.email}
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
                          <Phone size={14} />
                          {u.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 ${u.role === UserRole.ADMIN
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}
                        className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                        title="Voir les informations"
                      >
                        <Info size={18} />
                      </button>
                      <button
                        onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}
                        className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => { setActiveTab('messages'); setSelectedEmail(u.email); }}
                        className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                        title="Message"
                      >
                        <Mail size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Supprimer ce compte ? Cette action est irréversible.')) {
                            try {
                              await api.users.delete(u.id);
                              const updatedUsers = await api.users.getAll();
                              setAllUsers(updatedUsers);
                            } catch (error) {
                              console.error("Failed to delete user:", error);
                              alert("Erreur lors de la suppression de l'utilisateur. Veuillez réessayer.");
                            }
                          }
                        }}
                        className="p-2.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all"
                        title="Supprimer"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <UserIcon className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
            </p>
          </div>
        )}
      </div>

      {isUserModalOpen && selectedUser && (
        <AdminUserModal
          user={selectedUser}
          onClose={() => { setIsUserModalOpen(false); setSelectedUser(null); }}
          onContact={(email) => { setActiveTab('messages'); setSelectedEmail(email); setIsUserModalOpen(false); }}
          onUpdated={(updated) => {
            setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          }}
          onDeleted={() => {
            api.users.getAll().then(setAllUsers);
          }}
        />
      )}
    </div>
  );
};
