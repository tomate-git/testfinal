import React, { useState, useEffect } from 'react';
import { AppEvent, Space } from '../../../types';
import { X, Upload, Calendar, Clock, MapPin, Type, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface AdminEventModalProps {
    event?: AppEvent | null;
    onClose: () => void;
    onSave: (event: AppEvent) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export const AdminEventModal: React.FC<AdminEventModalProps> = ({ event, onClose, onSave, onDelete }) => {
    const { spaces, reservations } = useApp();
    const [formData, setFormData] = useState<Partial<AppEvent>>({
        eventName: '',
        eventDescription: '',
        date: new Date().toISOString().slice(0, 16),
        endDate: '',
        customTimeLabel: '',
        spaceId: '',
        spaceIds: [],
        eventImage: ''
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (event) {
            const selectedFromClosures = reservations
                .filter(r => r.isGlobalClosure && typeof r.id === 'string' && r.id.startsWith(`r_evt_${event.id}_`))
                .map(r => r.spaceId)
                .filter(Boolean);
            const unique = Array.from(new Set([event.spaceId, ...selectedFromClosures].filter(Boolean))) as string[];
            setFormData({
                ...event,
                spaceIds: unique,
                date: new Date(event.date).toISOString().slice(0, 16),
                endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ''
            });
        }
    }, [event, reservations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleSpaceId = (id: string) => {
        setFormData(prev => {
            const current = (prev.spaceIds || []) as string[];
            const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
            return { ...prev, spaceIds: next };
        });
    };

    const toggleGroupByPrefix = (prefix: string) => {
        setFormData(prev => {
            const current = new Set((prev.spaceIds || []) as string[]);
            const ids = spaces.filter(s => String(s.id).startsWith(prefix)).map(s => s.id);
            const allSelected = ids.every(id => current.has(id));
            if (allSelected) {
                ids.forEach(id => current.delete(id));
            } else {
                ids.forEach(id => current.add(id));
            }
            return { ...prev, spaceIds: Array.from(current) };
        });
    };

    const toggleAllSpaces = () => {
        setFormData(prev => {
            const current = new Set((prev.spaceIds || []) as string[]);
            const ids = spaces.map(s => s.id);
            const allSelected = ids.every(id => current.has(id));
            if (allSelected) {
                ids.forEach(id => current.delete(id));
            } else {
                ids.forEach(id => current.add(id));
            }
            return { ...prev, spaceIds: Array.from(current) };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const adminApiBase = (import.meta as any).env?.VITE_ADMIN_API_BASE || '';
            const adminToken = (import.meta as any).env?.VITE_ADMIN_TOKEN || '';

            // Fallback for local dev if env vars are missing/different
            const url = adminApiBase ? `${adminApiBase}/api/admin/upload` : '/api/admin/upload';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'x-admin-token': adminToken
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, eventImage: data.url }));
            } else {
                alert('Erreur lors de l\'upload de l\'image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.eventName || !formData.date) {
            alert('Veuillez remplir les champs obligatoires (Nom, Date)');
            return;
        }

        const newEvent: AppEvent = {
            id: event?.id || `evt-${Date.now()}`,
            eventName: formData.eventName!,
            date: new Date(formData.date!).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            eventDescription: formData.eventDescription,
            customTimeLabel: formData.customTimeLabel,
            spaceId: formData.spaceId,
            spaceIds: (formData.spaceIds || []) as string[],
            eventImage: formData.eventImage
        };

        await onSave(newEvent);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {event ? 'Modifier l\'événement' : 'Nouvel événement'}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="eventForm" onSubmit={handleSubmit} className="space-y-6">

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Image de l'événement</label>
                            <div className="flex items-start gap-4">
                                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                                    {formData.eventImage ? (
                                        <>
                                            <img src={formData.eventImage} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, eventImage: '' }))}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <ImageIcon className="text-slate-400" size={32} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        Format recommandé : 1448x2048px (Portrait) ou 16:9. <br />
                                        L'image sera affichée sur la frise chronologique et dans le détail.
                                    </p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                                        <Upload size={16} />
                                        {uploading ? 'Upload en cours...' : 'Choisir une image'}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de l'événement *</label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="eventName"
                                        value={formData.eventName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-ess-500 focus:border-transparent transition-all"
                                        placeholder="Ex: Atelier Créatif"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Date Start */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Date de début *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="datetime-local"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-ess-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Date End */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Date de fin (Optionnel)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-ess-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Custom Time Label */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Horaire (Texte libre)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="customTimeLabel"
                                        value={formData.customTimeLabel}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-ess-500 focus:border-transparent transition-all"
                                        placeholder="Ex: 14h - 18h"
                                    />
                                </div>
                            </div>

                            {/* Space */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Lieu associé</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        name="spaceId"
                                        value={formData.spaceId}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-ess-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Aucun lieu spécifique</option>
                                        {spaces.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Spaces to block during event */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Espaces indisponibles pendant l'événement</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <button type="button" onClick={toggleAllSpaces} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium">
                                        Tout sélectionner
                                    </button>
                                    <button type="button" onClick={() => toggleGroupByPrefix('kiosque-')} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium">
                                        Kiosques
                                    </button>
                                    <button type="button" onClick={() => toggleGroupByPrefix('container-')} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium">
                                        Containers Pro
                                    </button>
                                </div>
                                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {spaces.map(s => (
                                        <label key={s.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={(formData.spaceIds || []).includes(s.id)}
                                                onChange={() => toggleSpaceId(s.id)}
                                            />
                                            <span className="text-slate-700 dark:text-slate-300">{s.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Les espaces sélectionnés seront bloqués sur le calendrier pendant la durée de l'événement.</p>
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    name="eventDescription"
                                    value={formData.eventDescription}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-ess-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Description détaillée de l'événement..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                    {event && onDelete ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                                    onDelete(event.id);
                                    onClose();
                                }
                            }}
                            className="px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={18} /> Supprimer
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            form="eventForm"
                            className="px-6 py-2.5 rounded-xl bg-ess-600 hover:bg-ess-700 text-white font-bold shadow-lg shadow-ess-600/20 transition-all hover:-translate-y-0.5"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
