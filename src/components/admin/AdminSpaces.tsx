
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Space } from '../../types';
import { Eye, EyeOff, Zap, Clock, Edit, Save, X } from 'lucide-react';
import { AdminEditSpaceModal } from './modals/AdminEditSpaceModal';

interface AdminSpacesProps {
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const cardClass = "bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300";

export const AdminSpaces: React.FC<AdminSpacesProps> = ({ setIsSidebarCollapsed }) => {
  const { spaces, updateSpace } = useApp();
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const togglePublicVisibility = async (s: Space, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSpace = { ...s, showInCalendar: s.showInCalendar === false ? true : false };
    await updateSpace(updatedSpace);
  };

  const handleEdit = (space: Space) => {
    setEditingSpace(space);
    setIsSidebarCollapsed(true);
  };

  const startRename = (s: Space) => {
    setRenamingId(s.id);
    setRenameValue(s.name);
  };
  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };
  const saveRename = async () => {
    if (!renamingId) return;
    const s = spaces.find(x => x.id === renamingId);
    if (!s) return;
    const updatedSpace = { ...s, name: renameValue.trim() };
    await updateSpace(updatedSpace);
    setRenamingId(null);
    setRenameValue('');
  };

  const getUniqueSpaceGroups = () => {
    const groups: Record<string, Space[]> = {};
    spaces.forEach(s => {
      const baseName = s.name.includes('N°') ? s.name.split('N°')[0].trim() : s.name;
      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push(s);
    });
    return groups;
  };
  const spaceGroups = getUniqueSpaceGroups();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(spaceGroups).map(([groupName, groupSpaces]) => {
          const representative = groupSpaces[0];
          const isHidden = representative.showInCalendar === false;
          return (
            <div key={groupName} className={`${cardClass} p-6 flex flex-col sm:flex-row gap-6 hover:border-ess-500/50 transition-colors group relative`}>
              <div className="w-full sm:w-32 h-32 rounded-xl relative overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner shrink-0">
                <img src={representative.image} alt="" className="w-full h-full object-cover opacity-90 dark:opacity-80 group-hover:opacity-100 transition-opacity" />
                <button onClick={(e) => togglePublicVisibility(representative, e)} className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all border ${isHidden ? 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white' : 'bg-white/30 text-white border-white/20 hover:bg-white/50'}`}>{isHidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      {renamingId === representative.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') cancelRename(); }}
                          />
                          <button onClick={saveRename} className="p-2 rounded-lg bg-ess-600 text-white hover:bg-ess-700 transition"><Save size={16} /></button>
                          <button onClick={cancelRename} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xl text-slate-900 dark:text-slate-200 group-hover:text-ess-600 dark:group-hover:text-ess-400 transition-colors">{groupName}</h3>
                          <button onClick={() => startRename(representative)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"><Edit size={14} /></button>
                          {isHidden && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wide rounded border border-slate-200 dark:border-slate-700">Privé</span>}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{representative.category} • {groupSpaces.length} unité(s)</p>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{representative.pricing.isQuote ? 'Devis' : `${representative.pricing.day}€`}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">{representative.description}</p>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1">{representative.autoApprove ? <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded flex items-center gap-1"><Zap size={12} /> Auto-Validation</span> : <span className="text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-1"><Clock size={12} /> Validation Manuelle</span>}</div>
                  <button onClick={() => handleEdit(representative)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shadow-sm"><Edit size={16} /> Configurer</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingSpace && (
        <AdminEditSpaceModal 
          space={editingSpace} 
          onClose={() => setEditingSpace(null)} 
          onUpdate={async (updatedSpace) => { try { await updateSpace(updatedSpace); setEditingSpace(null); } catch (e: any) { alert('Échec de la sauvegarde: ' + (e?.message || String(e))) } }}
          allSpaces={spaces}
        />
      )}
    </>
  );
};
