import React, { useState, useEffect } from 'react';
import { Send, History, Check, AlertTriangle, RefreshCw, Mail, User, Users, FileText, Plus, Trash2, X, Search, ChevronDown, Save, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EmailLog {
    id: string;
    recipients: string[];
    subject: string;
    content: string;
    status: 'sent' | 'failed';
    sent_at: string;
    error?: string;
}

interface Template {
    id: string;
    name: string;
    subject: string;
    content: string;
}

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyName?: string;
}

export const AdminMail: React.FC = () => {
    const { user } = useApp();
    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

    // Data
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [history, setHistory] = useState<EmailLog[]>([]);

    // Compose State
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showTemplateSave, setShowTemplateSave] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'company' | 'individual'>('all');

    // Fetch Data
    useEffect(() => {
        fetchUsers();
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_ADMIN_API_BASE}/api/admin/users`, {
                headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error("Erreur fetch users:", res.status);
            }
        } catch (e) { console.error("Erreur users", e); }
        finally { setUsersLoading(false); }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_ADMIN_API_BASE}/api/admin/templates`, {
                headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
            });
            if (res.ok) setTemplates(await res.json());
        } catch (e) { console.error("Erreur templates", e); }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_ADMIN_API_BASE}/api/admin/emails`, {
                headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
            });
            if (res.ok) setHistory(await res.json());
        } catch (e) { console.error("Erreur history", e); }
        finally { setLoading(false); }
    };

    // Actions
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRecipients.length === 0) {
            setStatus({ type: 'error', message: "Veuillez sélectionner au moins un destinataire." });
            return;
        }

        setSending(true);
        setStatus(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_ADMIN_API_BASE}/api/admin/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN
                },
                body: JSON.stringify({
                    recipients: selectedRecipients,
                    subject,
                    content
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: `Email envoyé à ${data.count} destinataires !` });
                setSubject('');
                setContent('');
                setSelectedRecipients([]);
            } else {
                setStatus({ type: 'error', message: data.error || 'Erreur lors de l\'envoi' });
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Erreur de connexion au serveur' });
        } finally {
            setSending(false);
        }
    };

    const saveTemplate = async () => {
        if (!newTemplateName) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_ADMIN_API_BASE}/api/admin/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN
                },
                body: JSON.stringify({ name: newTemplateName, subject, content })
            });
            if (res.ok) {
                fetchTemplates();
                setShowTemplateSave(false);
                setNewTemplateName('');
                setStatus({ type: 'success', message: "Modèle sauvegardé !" });
            }
        } catch (e) { console.error(e); }
    };

    const deleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Supprimer ce modèle ?")) return;
        try {
            await fetch(`${import.meta.env.VITE_ADMIN_API_BASE}/api/admin/templates/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
            });
            fetchTemplates();
        } catch (e) { console.error(e); }
    };

    const loadTemplate = (t: Template) => {
        setSubject(t.subject);
        setContent(t.content);
        setIsDropdownOpen(false);
    };

    const insertVariable = (variable: string) => {
        setContent(prev => prev + ` {${variable}}`);
    };

    // Selection Logic
    const toggleRecipient = (email: string) => {
        setSelectedRecipients(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterType === 'company') return u.role === 'COMPANY' || !!u.companyName;
        if (filterType === 'individual') return u.role === 'USER' && !u.companyName;
        return true;
    });

    const selectAllFiltered = () => {
        const newEmails = filteredUsers.map(u => u.email);
        // Add only ones not already selected
        const toAdd = newEmails.filter(e => !selectedRecipients.includes(e));
        setSelectedRecipients(prev => [...prev, ...toAdd]);
    };

    const deselectAllFiltered = () => {
        const emailsToRemove = filteredUsers.map(u => u.email);
        setSelectedRecipients(prev => prev.filter(e => !emailsToRemove.includes(e)));
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-140px)] flex flex-col">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
                <button
                    onClick={() => setActiveTab('compose')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'compose' ? 'bg-slate-50 text-ess-600 border-b-2 border-ess-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Send size={18} /> Nouveau Message
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'history' ? 'bg-slate-50 text-ess-600 border-b-2 border-ess-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <History size={18} /> Historique
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'compose' ? (
                    <div className="h-full flex flex-col md:flex-row">
                        {/* Left Sidebar: Recipients */}
                        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
                            <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                        <Users size={16} /> Destinataires
                                    </h3>
                                    <span className="text-xs font-bold bg-ess-100 text-ess-700 px-2 py-0.5 rounded-full">
                                        {selectedRecipients.length}
                                    </span>
                                </div>

                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-ess-500 transition"
                                    />
                                </div>

                                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded transition ${filterType === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tous
                                    </button>
                                    <button
                                        onClick={() => setFilterType('company')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded transition ${filterType === 'company' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Entreprises
                                    </button>
                                    <button
                                        onClick={() => setFilterType('individual')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded transition ${filterType === 'individual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Particuliers
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={selectAllFiltered} className="flex-1 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition">
                                        Tout cocher
                                    </button>
                                    <button onClick={deselectAllFiltered} className="flex-1 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition">
                                        Tout décocher
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {usersLoading ? (
                                    <div className="p-4 text-center text-slate-400 text-xs">Chargement des utilisateurs...</div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-xs">Aucun utilisateur trouvé</div>
                                ) : (
                                    filteredUsers.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleRecipient(u.email)}
                                            className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition border ${selectedRecipients.includes(u.email)
                                                    ? 'bg-ess-50 border-ess-200 shadow-sm'
                                                    : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${selectedRecipients.includes(u.email) ? 'bg-ess-500 border-ess-500' : 'border-slate-300 bg-white'}`}>
                                                {selectedRecipients.includes(u.email) && <Check size={12} className="text-white" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-xs font-bold text-slate-900 truncate">{u.firstName} {u.lastName}</div>
                                                    {u.role === 'COMPANY' && <BuildingIcon size={10} className="text-slate-400" />}
                                                </div>
                                                <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                                                {u.companyName && <div className="text-[9px] text-ess-600 font-bold truncate mt-0.5">{u.companyName}</div>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Side: Editor */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                                <form onSubmit={handleSend} className="space-y-6 max-w-3xl mx-auto w-full">

                                    {/* Toolbar */}
                                    <div className="flex flex-wrap gap-3 justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                                            >
                                                <FileText size={16} /> Modèles <ChevronDown size={14} />
                                            </button>
                                            {isDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in-up">
                                                    <div className="p-3 border-b border-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">Mes Modèles</div>
                                                    <div className="max-h-64 overflow-y-auto">
                                                        {templates.length === 0 ? (
                                                            <div className="p-6 text-center text-xs text-slate-400">Aucun modèle sauvegardé</div>
                                                        ) : (
                                                            templates.map(t => (
                                                                <div key={t.id} onClick={() => loadTemplate(t)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center group border-b border-slate-50 last:border-0">
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-700 truncate w-48">{t.name}</div>
                                                                        <div className="text-[10px] text-slate-400 truncate w-48">{t.subject}</div>
                                                                    </div>
                                                                    <button onClick={(e) => deleteTemplate(t.id, e)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowTemplateSave(true)}
                                            className="text-ess-600 text-sm font-bold hover:bg-ess-50 px-3 py-2 rounded-lg transition flex items-center gap-2"
                                        >
                                            <Save size={16} /> Sauvegarder
                                        </button>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sujet</label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                placeholder="Sujet de votre message..."
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-ess-500 focus:ring-4 focus:ring-ess-500/10 outline-none transition font-medium text-slate-900 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 self-center">Insérer :</span>
                                                    <button type="button" onClick={() => insertVariable('firstName')} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-ess-50 hover:text-ess-600 border border-slate-200 rounded-md text-slate-600 font-bold transition">+ Prénom</button>
                                                    <button type="button" onClick={() => insertVariable('lastName')} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-ess-50 hover:text-ess-600 border border-slate-200 rounded-md text-slate-600 font-bold transition">+ Nom</button>
                                                    <button type="button" onClick={() => insertVariable('companyName')} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-ess-50 hover:text-ess-600 border border-slate-200 rounded-md text-slate-600 font-bold transition">+ Entreprise</button>
                                                </div>
                                            </div>
                                            <textarea
                                                value={content}
                                                onChange={e => setContent(e.target.value)}
                                                placeholder="Bonjour {firstName},&#10;&#10;Écrivez votre message ici..."
                                                rows={15}
                                                className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:border-ess-500 focus:ring-4 focus:ring-ess-500/10 outline-none transition resize-none font-sans text-sm leading-relaxed text-slate-700 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {status && (
                                        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                            <div className={`p-2 rounded-full ${status.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {status.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                                            </div>
                                            <span className="font-bold text-sm">{status.message}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition flex items-center justify-center gap-3 transform active:scale-[0.99] ${sending ? 'bg-slate-400 cursor-not-allowed' : 'bg-ess-600 hover:bg-ess-700 hover:shadow-ess-600/20'}`}
                                    >
                                        {sending ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                                        {sending ? 'Envoi en cours...' : `Envoyer le message (${selectedRecipients.length})`}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-xl text-slate-900">Historique des envois</h3>
                                <button onClick={fetchHistory} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition text-slate-500 border border-transparent hover:border-slate-200">
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            {loading && history.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">Chargement...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <Mail size={32} />
                                    </div>
                                    <h4 className="font-bold text-slate-700">Aucun email envoyé</h4>
                                    <p className="text-slate-400 text-sm mt-1">Vos futurs envois apparaîtront ici.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map(log => (
                                        <div key={log.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-bold text-lg text-slate-900 mb-1">{log.subject}</div>
                                                    <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                                        <History size={12} />
                                                        {new Date(log.sent_at).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide ${log.status === 'sent' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                    {log.status === 'sent' ? 'Envoyé' : 'Échec'}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 rounded-xl p-3 mb-3">
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Users size={12} /> Destinataires ({log.recipients.length})
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {log.recipients.slice(0, 5).map(email => (
                                                        <span key={email} className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600 font-medium">
                                                            {email}
                                                        </span>
                                                    ))}
                                                    {log.recipients.length > 5 && (
                                                        <span className="text-[10px] px-2 py-1 bg-slate-200 rounded-md text-slate-600 font-bold">
                                                            +{log.recipients.length - 5} autres
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {log.error && (
                                                <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                                    {log.error}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Template Save Modal */}
            {showTemplateSave && (
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-fade-in-up border border-white/50">
                        <h3 className="font-black text-xl mb-2 text-slate-900">Sauvegarder le modèle</h3>
                        <p className="text-slate-500 text-sm mb-6">Donnez un nom à ce modèle pour le retrouver facilement.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom du modèle</label>
                                <input
                                    type="text"
                                    value={newTemplateName}
                                    onChange={e => setNewTemplateName(e.target.value)}
                                    placeholder="ex: Bienvenue, Relance..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-ess-500 focus:ring-4 focus:ring-ess-500/10 outline-none transition font-bold text-slate-900"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowTemplateSave(false)}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={saveTemplate}
                                    className="flex-1 py-3 bg-ess-600 text-white font-bold rounded-xl hover:bg-ess-700 shadow-lg shadow-ess-600/20 transition"
                                >
                                    Sauvegarder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon
const BuildingIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
);
