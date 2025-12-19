

import React, { useState, useRef } from 'react';
import { Space, BookingSlot, BrochureType } from '../../../types';
import { Edit, X, Upload, Eye, EyeOff, Zap, Clock, Save, Check, Trash2, Plus, List, FileText, Globe, Image as ImageIcon, Paperclip, Loader2, Layout, Settings } from 'lucide-react';

interface AdminEditSpaceModalProps {
  space: Space;
  onClose: () => void;
  onUpdate: (space: Space) => Promise<void>;
  allSpaces: Space[];
}

const cardClass = "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors duration-300";
const inputClasses = "w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-ess-500 focus:border-ess-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500";
const labelClasses = "block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1.5";

type Tab = 'general' | 'visual' | 'rules' | 'docs';

export const AdminEditSpaceModal: React.FC<AdminEditSpaceModalProps> = ({ space, onClose, onUpdate, allSpaces }) => {
  const [editingSpace, setEditingSpace] = useState<Space>(space);
  const [newFeature, setNewFeature] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingSpace(prev => ({ ...prev, image: reader.result as string }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrochureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingSpace({
          ...editingSpace,
          brochureUrl: reader.result as string,
          brochureName: file.name,
          brochureType: file.type.includes('pdf') ? BrochureType.PDF : BrochureType.IMAGE
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate(editingSpace);
    } catch (error) {
      console.error("Failed to save", error);
      // Alert handled by parent usually, but just in case
    } finally {
      setIsSaving(false);
    }
  };

  // Feature Management
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setEditingSpace({ ...editingSpace, features: [...editingSpace.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = [...editingSpace.features];
    newFeatures.splice(index, 1);
    setEditingSpace({ ...editingSpace, features: newFeatures });
  };

  const handleUpdateFeature = (index: number, value: string) => {
    const newFeatures = [...editingSpace.features];
    newFeatures[index] = value;
    setEditingSpace({ ...editingSpace, features: newFeatures });
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className={`${cardClass} w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Edit className="text-slate-500 dark:text-slate-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configuration : {editingSpace.name}</h2>
              <p className="text-xs text-slate-500">Modifications en temps réel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 p-2 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
          <div className="p-6">
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
              <button onClick={() => setActiveTab('general')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'general' ? 'border-ess-600 text-ess-600 dark:text-ess-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <Layout size={16} /> Général
              </button>
              <button onClick={() => setActiveTab('visual')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'visual' ? 'border-ess-600 text-ess-600 dark:text-ess-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <ImageIcon size={16} /> Visuel & Équipements
              </button>
              <button onClick={() => setActiveTab('rules')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'rules' ? 'border-ess-600 text-ess-600 dark:text-ess-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <Settings size={16} /> Règles & Tarifs
              </button>
              <button onClick={() => setActiveTab('docs')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'docs' ? 'border-ess-600 text-ess-600 dark:text-ess-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <FileText size={16} /> Documentation
              </button>
            </div>

            <form id="edit-space-form" onSubmit={handleSave} className="space-y-8">
              {activeTab === 'general' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className={labelClasses}>Nom de l'espace</label>
                        <input type="text" value={editingSpace.name} onChange={e => setEditingSpace({ ...editingSpace, name: e.target.value })} className={inputClasses} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClasses}>Description Commerciale</label>
                        <textarea value={editingSpace.description} onChange={e => setEditingSpace({ ...editingSpace, description: e.target.value })} className={inputClasses} rows={4} />
                      </div>
                      <div>
                        <label className={labelClasses}>Sélectionner l'unité (ID)</label>
                        <select value={editingSpace.id} onChange={(e) => { const newSpace = allSpaces.find(s => s.id === e.target.value); if (newSpace) setEditingSpace(newSpace); }} className={inputClasses}>
                          {allSpaces.filter(s => { const baseName = s.name.includes('N°') ? s.name.split('N°')[0].trim() : s.name; const editingBaseName = editingSpace.name.includes('N°') ? editingSpace.name.split('N°')[0].trim() : editingSpace.name; return baseName === editingBaseName; }).map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'visual' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <label className={labelClasses}>Image de présentation</label>
                      <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-2">
                        <div className="h-48 bg-slate-200 dark:bg-slate-700 relative group">
                          <img src={editingSpace.image} alt="Preview" className="w-full h-full object-cover opacity-100 dark:opacity-80" />
                          <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <div className="bg-white/10 backdrop-blur p-3 rounded-full text-white border border-white/20 hover:bg-white/20 transition">
                              <Upload size={24} />
                            </div>
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                          <span className="text-xs text-slate-500">Format recommandé : 16:9, Max 2MB</span>
                          <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading} className="px-3 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-ess-600 hover:text-white transition">
                            {uploading ? 'Chargement...' : "Changer l'image"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
                      <h3 className="text-xs font-bold uppercase text-ess-600 dark:text-ess-500 mb-4 flex items-center gap-2"><List size={16} /> Équipements / Features</h3>
                      <div className="space-y-3">
                        {editingSpace.features.map((feat, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={feat}
                              onChange={(e) => handleUpdateFeature(index, e.target.value)}
                              className={inputClasses}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index)}
                              className="p-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Nouvel équipement..."
                            className={inputClasses}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                          />
                          <button
                            type="button"
                            onClick={handleAddFeature}
                            className="px-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-ess-600 hover:text-white dark:hover:bg-ess-600 rounded-lg font-bold transition-colors"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Visibilité & Validation</h3>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${editingSpace.showInCalendar !== false ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            {editingSpace.showInCalendar !== false ? <Eye size={20} /> : <EyeOff size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-200 text-sm">Visible sur l'agenda public</div>
                            <div className="text-xs text-slate-500">Si désactivé, seules les réservations admin sont possibles.</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={editingSpace.showInCalendar !== false} onChange={(e) => setEditingSpace({ ...editingSpace, showInCalendar: e.target.checked })} />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${editingSpace.autoApprove ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            {editingSpace.autoApprove ? <Zap size={20} /> : <Clock size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-200 text-sm">Validation Automatique</div>
                            <div className="text-xs text-slate-500">{editingSpace.autoApprove ? "Les réservations sont confirmées immédiatement." : "Les réservations nécessitent une validation admin."}</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={!!editingSpace.autoApprove} onChange={(e) => setEditingSpace({ ...editingSpace, autoApprove: e.target.checked })} />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Tarification & Capacité</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={labelClasses}>Jour (€)</label>
                          <input type="number" value={editingSpace.pricing.day || 0} onChange={e => setEditingSpace({ ...editingSpace, pricing: { ...editingSpace.pricing, day: Number(e.target.value) } })} className={inputClasses} />
                        </div>
                        <div>
                          <label className={labelClasses}>Mois (€)</label>
                          <input type="number" value={editingSpace.pricing.month || 0} onChange={e => setEditingSpace({ ...editingSpace, pricing: { ...editingSpace.pricing, month: Number(e.target.value) } })} className={inputClasses} />
                        </div>
                        <div>
                          <label className={labelClasses}>Capacité</label>
                          <input type="number" value={editingSpace.capacity} onChange={e => setEditingSpace({ ...editingSpace, capacity: Number(e.target.value) })} className={inputClasses} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Règles de Réservation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Durée Minimum (Jours)</label>
                        <input type="number" min="0" value={editingSpace.minDuration || 0} onChange={e => setEditingSpace({ ...editingSpace, minDuration: Number(e.target.value) })} className={inputClasses} />
                      </div>
                      <div>
                        <label className={labelClasses}>Durée Maximum (Jours)</label>
                        <input type="number" min="0" value={editingSpace.maxDuration || 0} onChange={e => setEditingSpace({ ...editingSpace, maxDuration: Number(e.target.value) })} className={inputClasses} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Créneaux Autorisés</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                        {Object.values(BookingSlot).map((slot) => {
                          const isChecked = editingSpace.availableSlots ? editingSpace.availableSlots.includes(slot) : true;
                          return (
                            <label key={slot} className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition border ${isChecked ? 'bg-ess-50 dark:bg-ess-900/20 border-ess-200 dark:border-ess-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-ess-600 border-ess-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </div>
                              <input type="checkbox" className="hidden" checked={isChecked} onChange={(e) => {
                                const currentSlots = editingSpace.availableSlots || Object.values(BookingSlot);
                                let newSlots;
                                if (isChecked) {
                                  newSlots = currentSlots.filter(s => s !== slot);
                                } else {
                                  newSlots = [...currentSlots, slot];
                                }
                                setEditingSpace({ ...editingSpace, availableSlots: newSlots });
                              }} />
                              <span className={`text-sm font-medium ${isChecked ? 'text-ess-700 dark:text-ess-300' : 'text-slate-600 dark:text-slate-500'}`}>{slot.split('(')[0]}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-ess-600 dark:text-ess-500 mb-4 flex items-center gap-2"><FileText size={16} /> Documentation & Brochure</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {Object.values(BrochureType).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setEditingSpace({ ...editingSpace, brochureType: type })}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border font-bold text-sm transition-all ${editingSpace.brochureType === type
                              ? 'bg-white dark:bg-slate-800 border-ess-500 text-ess-600 dark:text-ess-400 shadow-sm ring-2 ring-ess-500/20'
                              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                              }`}
                          >
                            {type === BrochureType.PDF && <FileText size={16} />}
                            {type === BrochureType.WEB && <Globe size={16} />}
                            {type === BrochureType.IMAGE && <ImageIcon size={16} />}
                            {type}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className={labelClasses}>Fichier joint (Téléchargement)</label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="cursor-pointer bg-white dark:bg-slate-800 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm w-full">
                            <Upload size={16} />
                            {editingSpace.brochureUrl ? "Remplacer le fichier" : "Téléverser un fichier"}
                            <input type="file" className="hidden" onChange={handleBrochureUpload} accept=".pdf,image/*" />
                          </label>
                          {editingSpace.brochureUrl && (
                            <div className="flex items-center gap-3 bg-ess-50 dark:bg-ess-900/20 px-3 py-2 rounded-lg border border-ess-100 dark:border-ess-900/50 whitespace-nowrap">
                              <div className="p-1 bg-white dark:bg-slate-800 rounded text-ess-600 dark:text-ess-400 shadow-sm"><Paperclip size={12} /></div>
                              <span className="text-xs font-bold text-ess-700 dark:text-ess-400 max-w-[150px] truncate">{editingSpace.brochureName || "Fichier prêt"}</span>
                              <button
                                type="button"
                                onClick={() => setEditingSpace({ ...editingSpace, brochureUrl: undefined, brochureName: undefined })}
                                className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3 rounded-b-2xl sticky bottom-0 z-10">
          <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold transition">Annuler</button>
          <button
            type="submit"
            form="edit-space-form"
            disabled={isSaving}
            className="px-6 py-3 bg-ess-600 text-white rounded-xl hover:bg-ess-700 flex items-center gap-2 font-bold shadow-lg shadow-ess-500/20 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};
