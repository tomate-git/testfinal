import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppEvent } from '../../types';
import { Plus, Calendar, Clock, MapPin, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { AdminEventModal } from './modals/AdminEventModal';

export const AdminEvents: React.FC = () => {
    const { events, addEvent, updateEvent, deleteEvent } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);

    const handleAdd = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (event: AppEvent) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleSave = async (event: AppEvent) => {
        try {
            if (editingEvent) {
                await updateEvent(event);
            } else {
                await addEvent(event);
            }
            setIsModalOpen(false);
            setEditingEvent(null);
        } catch (error) {
            console.error('Failed to save event:', error);
            alert('Erreur lors de la sauvegarde de l\'événement');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteEvent(id);
            setIsModalOpen(false); // Close modal if open (though usually called from modal)
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Erreur lors de la suppression');
        }
    };

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des Événements</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gérez les événements publics affichés sur le site.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-ess-600 hover:bg-ess-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-ess-600/20 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Nouvel Événement
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map(event => (
                    <div key={event.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-md transition-all">
                        {/* Image Header */}
                        <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                            {event.eventImage ? (
                                <img src={event.eventImage} alt={event.eventName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(event)}
                                    className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg text-slate-700 dark:text-slate-300 hover:text-ess-600 dark:hover:text-ess-400 shadow-sm"
                                >
                                    <Edit size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{event.eventName}</h3>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Calendar size={14} className="text-ess-500" />
                                    <span>{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                {event.customTimeLabel && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <Clock size={14} className="text-ess-500" />
                                        <span>{event.customTimeLabel}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 h-10">
                                {event.eventDescription || "Aucune description"}
                            </p>
                        </div>
                    </div>
                ))}

                {sortedEvents.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun événement planifié</p>
                        <button onClick={handleAdd} className="text-ess-600 font-bold hover:underline mt-2">Créer le premier événement</button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AdminEventModal
                    event={editingEvent}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    onDelete={editingEvent ? handleDelete : undefined}
                />
            )}
        </div>
    );
};
