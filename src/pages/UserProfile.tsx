
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BookingStatus, UserType, UserRole, Message, Reservation } from '../types';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { encodeReservationPayload } from '../utils/qrPayload';
import { User as UserIcon, Clock, Calendar, LogOut, Save, Building, MessageSquare, Paperclip, Send, FileText, X, Trash2, AlertTriangle, ShieldCheck, QrCode, Maximize2, Ticket, Download, Copy, MoreVertical, Bell, Check, CheckCheck, Info, Pin, Mic, Square, Reply, Edit, Smile, Play, Pause, Mail, Phone } from 'lucide-react';

export const UserProfile: React.FC = () => {
    const { user, logout, deleteAccount, reservations, spaces, cancelReservation, updateUserProfile, messages, sendMessage, deleteMessage, hardDeleteMessage, editMessage, reactToMessage, pinMessage, notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'info' | 'bookings' | 'history' | 'messages' | 'pass' | 'notifications'>('bookings');

    // Edit Form State
    const [formData, setFormData] = useState<Partial<User>>(user || {});
    const [isEditing, setIsEditing] = useState(false);

    // Messaging State
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
    const [confirmResId, setConfirmResId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [profileSaved, setProfileSaved] = useState(false);

    // Refs for scrolling and file input
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const notifMenuRef = useRef<HTMLDivElement>(null);

    // Context Menu State (Right Click)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: Message } | null>(null);
    const [notifMenu, setNotifMenu] = useState<{ x: number; y: number; notif: any } | null>(null);
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [recordingStart, setRecordingStart] = useState<number | null>(null);
    const [recordingElapsed, setRecordingElapsed] = useState<string>('00:00');
    const [confirmMsgId, setConfirmMsgId] = useState<string | null>(null);
    const [userInfoPopover, setUserInfoPopover] = useState<{ x: number; y: number; name: string; email?: string; role: 'ADMIN' | 'CLIENT' } | null>(null);
    const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
    const [moreMenuFor, setMoreMenuFor] = useState<string | null>(null);
    const [showChatHeaderMenu, setShowChatHeaderMenu] = useState(false);
    const headerMenuRef = useRef<HTMLDivElement>(null);
    const [chatTall, setChatTall] = useState(true);
    const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
    const [fullQrFor, setFullQrFor] = useState<string | null>(null);

    const classifySubject = (subject?: string) => {
        const s = (subject || '').toLowerCase();
        if (s.includes('devis')) return { label: 'Devis', cls: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' };
        if (s.includes('contact')) return { label: 'Contact', cls: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
        return null;
    };
    const isImage = (src: string) => src.startsWith('data:image') || /\.(png|jpe?g|gif|webp)$/i.test(src);
    const isAudio = (src: string) => src.startsWith('data:audio') || /\.(webm|mp3|wav|m4a|ogg)$/i.test(src);

    const AudioPlayer: React.FC<{ src: string; dark?: boolean }> = ({ src, dark }) => {
        const audioRef = useRef<HTMLAudioElement | null>(null);
        const [playing, setPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const [current, setCurrent] = useState('00:00');
        const [total, setTotal] = useState('00:00');
        useEffect(() => {
            const a = new Audio(src);
            audioRef.current = a;
            const onLoaded = () => { const d = a.duration || 0; setTotal(new Date(d * 1000).toISOString().substring(14, 19)); };
            const onTime = () => { const c = a.currentTime || 0; const d = a.duration || 1; setProgress((c / d) * 100); setCurrent(new Date(c * 1000).toISOString().substring(14, 19)); };
            a.addEventListener('loadedmetadata', onLoaded);
            a.addEventListener('timeupdate', onTime);
            a.addEventListener('ended', () => { setPlaying(false); setProgress(0); });
            return () => { a.pause(); a.src = ''; a.load(); };
        }, [src]);
        const toggle = () => {
            const a = audioRef.current; if (!a) return;
            if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
        };
        return (
            <div className={`mt-2 w-full max-w-xs ${dark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl px-3 py-2 border ${dark ? 'border-white/20' : 'border-slate-200'} flex items-center gap-3`}>
                <button type="button" onClick={toggle} className={`p-2 rounded-lg ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-200'} transition`}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
                <div className="flex-1">
                    <div className={`h-1.5 rounded-full ${dark ? 'bg-white/20' : 'bg-slate-200'}`}>
                        <div style={{ width: `${progress}%` }} className={`h-1.5 rounded-full ${dark ? 'bg-white' : 'bg-ess-600'}`}></div>
                    </div>
                    <div className={`text-[10px] mt-1 flex justify-between ${dark ? 'text-white/70' : 'text-slate-500'}`}><span>{current}</span><span>{total}</span></div>
                </div>
            </div>
        );
    };

    // Fix Scroll Bug: Only scroll the container, not the window
    useEffect(() => {
        if (activeTab === 'messages' && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [activeTab]);

    // Filter messages for this user (sent by them or sent to them)
    const myMessages = user ? messages
        .filter(m => m.email === user.email)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [];

    useEffect(() => {
        if (activeTab === 'messages' && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [myMessages.length, activeTab]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (menuRef.current && menuRef.current.contains(t)) return;
            setContextMenu(null);
            if (notifMenuRef.current && notifMenuRef.current.contains(t)) return;
            setNotifMenu(null);
            setUserInfoPopover(null);
            setEmojiPickerFor(null);
            setMoreMenuFor(null);
            if (headerMenuRef.current && headerMenuRef.current.contains(t)) return;
            setShowChatHeaderMenu(false);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Sync active tab from URL query (?tab=...)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') as any;
        if (tab && ['info', 'bookings', 'history', 'messages', 'pass', 'notifications'].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteAccount = () => {
        setDeleteConfirmOpen(true);
        setDeleteConfirmText('');
    };

    const confirmDeleteAccount = async () => {
        if (deleteConfirmText === 'SUPPRIMER') {
            await deleteAccount();
            setDeleteConfirmOpen(false);
            navigate('/');
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user && formData) {
            await updateUserProfile({ ...user, ...formData });
            setIsEditing(false);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2000);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !user) return;
        const msgToSend = newMessage;
        const attToSend = attachment;
        const attNameToSend = attachmentName;
        setNewMessage('');
        setAttachment(null);
        setAttachmentName(null);
        const quoted = replyingTo ? `> ${replyingTo.content || ''}\n\n` : '';

        if (editingMsgId) {
            await editMessage(editingMsgId, msgToSend);
            setEditingMsgId(null);
        } else {
            await sendMessage({
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                subject: 'Message depuis l\'espace client',
                type: 'contact',
                content: (quoted + msgToSend) || '',
                message: (quoted + msgToSend) || '',
                senderRole: UserRole.USER,
                attachment: attToSend || undefined,
                attachmentName: attNameToSend || undefined
            });
        }
        setReplyingTo(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
                setAttachmentName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, msg });
    };

    const handleCopyMessage = () => {
        if (contextMenu) {
            navigator.clipboard.writeText(contextMenu.msg.content || '');
            setContextMenu(null);
        }
    };

    const handleDeleteMessage = (e?: React.MouseEvent) => {
        if (contextMenu) {
            if (contextMenu.msg.senderRole === UserRole.USER) {
                if (e?.shiftKey) {
                    hardDeleteMessage(contextMenu.msg.id);
                } else {
                    setConfirmMsgId(contextMenu.msg.id);
                }
            }
            setContextMenu(null);
        }
    };

    const handleEditCurrent = () => {
        if (contextMenu && contextMenu.msg.senderRole === UserRole.USER) {
            setEditingMsgId(contextMenu.msg.id);
            setNewMessage(contextMenu.msg.content || '');
            setContextMenu(null);
        }
    };

    const handleReplyCurrent = () => {
        if (contextMenu) {
            setReplyingTo(contextMenu.msg);
            setContextMenu(null);
        }
    };

    const handleTogglePin = () => {
        if (contextMenu) {
            pinMessage(contextMenu.msg.id, !contextMenu.msg.pinned);
            setContextMenu(null);
        }
    };

    const startRecording = async () => {
        if (isRecording) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];
        mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mr.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
                setAttachmentName('message.webm');
            };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
            setRecordingStart(null);
            setRecordingElapsed('00:00');
        };
        mediaRecorderRef.current = mr;
        mr.start();
        setIsRecording(true);
        setRecordingStart(Date.now());
    };

    const stopRecording = () => {
        if (!isRecording) return;
        mediaRecorderRef.current?.stop();
    };

    useEffect(() => {
        let timer: any;
        if (isRecording && recordingStart) {
            timer = setInterval(() => {
                const diff = Math.floor((Date.now() - recordingStart) / 1000);
                const mm = String(Math.floor(diff / 60)).padStart(2, '0');
                const ss = String(diff % 60).padStart(2, '0');
                setRecordingElapsed(`${mm}:${ss}`);
            }, 500);
        }
        return () => timer && clearInterval(timer);
    }, [isRecording, recordingStart]);

    const handleReact = (emoji: string) => {
        if (contextMenu) {
            reactToMessage(contextMenu.msg.id, emoji);
            setContextMenu(null);
        }
    };

    // Data Filters
    const myReservations = reservations.filter(r => r.userId === user.id);
    const activeReservations = myReservations.filter(r => new Date(r.date) >= new Date() && r.status !== BookingStatus.CANCELLED);
    const pastReservations = myReservations.filter(r => new Date(r.date) < new Date() || r.status === BookingStatus.CANCELLED);
    const confirmedReservations = activeReservations.filter(r => r.status === BookingStatus.CONFIRMED);
    useEffect(() => {
        let cancelled = false;
        const gen = async () => {
            const entries = await Promise.all(confirmedReservations.map(async r => {
                const payload = encodeReservationPayload(r.id);
                const url = await generateQrDataUrl(payload, 200);
                return [r.id, url] as const;
            }));
            if (!cancelled) {
                const next: Record<string, string> = {};
                entries.forEach(([id, url]) => { next[id] = url; });
                setQrUrls(next);
            }
        };
        gen();
        return () => { cancelled = true; };
    }, [confirmedReservations.map(r => r.id).join(',')]);



    // Filter notifications
    const myNotifications = notifications.filter(n => n.userId === user.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const unreadCount = myNotifications.filter(n => !n.read).length;

    return (
        <>
            <div className="pt-28 pb-6 bg-transparent">
                <div className={`${activeTab === 'messages' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 sm:px-6 lg:px-8 relative z-10`}>

                    {/* Header */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                <span className="text-2xl font-bold">{user.firstName?.[0]}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.firstName} {user.lastName}</h1>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${user.type === UserType.COMPANY ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                        {user.type === UserType.COMPANY ? 'Entreprise' : 'Particulier'}
                                    </span>
                                </div>
                                {user.type === UserType.COMPANY && (
                                    <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                                        <Building size={16} className="text-slate-400" /> {user.companyName}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button onClick={handleLogout} className="group flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition border border-slate-200 font-bold">
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Déconnexion
                        </button>
                    </div>

                    <div className={`sticky top-28 z-30 flex overflow-x-auto space-x-2 bg-white/90 backdrop-blur p-2 rounded-2xl mb-8 w-full md:w-fit mx-auto md:mx-0 no-scrollbar border border-slate-100 shadow-sm ${activeTab === 'messages' ? 'md:hidden' : ''}`}>
                        <button onClick={() => setActiveTab('bookings')} className={`px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'bookings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <Clock size={18} /> En cours
                        </button>
                        <button onClick={() => setActiveTab('notifications')} className={`px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 relative ${activeTab === 'notifications' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <Bell size={18} /> Notifications
                            {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </button>
                        <button onClick={() => setActiveTab('pass')} className={`px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'pass' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <Ticket size={18} /> Mon Pass
                        </button>
                        <button onClick={() => setActiveTab('messages')} className={`px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'messages' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <MessageSquare size={18} /> Messagerie
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <Calendar size={18} /> Historique
                        </button>
                        <button onClick={() => setActiveTab('info')} className={`px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'info' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <UserIcon size={18} /> Mes Infos
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 animate-fade-in">

                        {activeTab === 'notifications' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">Vos notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllNotificationsAsRead} className="text-sm text-ess-600 hover:underline font-medium flex items-center gap-1">
                                            <Check size={14} /> Tout marquer comme lu
                                        </button>
                                    )}
                                </div>
                                {myNotifications.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <Bell size={32} className="text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">Aucune notification pour le moment.</p>
                                    </div>
                                ) : (
                                    myNotifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => { if (!notif.read) { markNotificationAsRead(notif.id); } if (notif.link) navigate(notif.link); }}
                                            onContextMenu={(e) => { e.preventDefault(); setNotifMenu({ x: e.clientX, y: e.clientY, notif }); }}
                                            className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${notif.read ? 'bg-white border-slate-200 opacity-80 hover:opacity-100' : 'bg-blue-50 border-blue-100 shadow-sm scale-[1.01]'}`}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className={`p-3 rounded-xl shrink-0 ${notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                                    notif.type === 'error' ? 'bg-red-100 text-red-600' :
                                                        'bg-ess-100 text-ess-600'
                                                    }`}>
                                                    {notif.type === 'success' ? <Check size={20} /> : notif.type === 'error' ? <AlertTriangle size={20} /> : <Info size={20} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`text-sm ${notif.read ? 'font-bold text-slate-700' : 'font-black text-slate-900'}`}>{notif.title}</h4>
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(notif.date).toLocaleDateString()} {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className={`text-sm mt-1 ${notif.read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>{notif.message}</p>

                                                    {notif.link && (
                                                        <button onClick={() => navigate(notif.link!)} className="mt-3 text-xs font-bold text-ess-600 hover:underline flex items-center gap-1">
                                                            Voir les détails →
                                                        </button>
                                                    )}
                                                </div>
                                                {!notif.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div className="grid gap-6">
                                {activeReservations.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar size={24} className="text-slate-300" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Aucune réservation</h3>
                                        <p className="text-slate-500 mb-6">Vous n'avez aucune réservation active pour le moment.</p>
                                        <button onClick={() => navigate('/catalog')} className="px-6 py-3 bg-ess-600 text-white rounded-xl font-bold hover:bg-ess-700 transition shadow-lg shadow-ess-200">
                                            Réserver un espace
                                        </button>
                                    </div>
                                ) : (
                                    activeReservations.map(res => {
                                        const space = spaces.find(s => s.id === res.spaceId);
                                        return (
                                            <div key={res.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col gap-6 shadow-sm hover:shadow-lg transition-all duration-300">
                                                {/* Header Info */}
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                                            <img src={space?.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-slate-900">{space?.name}</h3>
                                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg"><Calendar size={14} />
                                                                    <span className="font-medium">{res.endDate && res.endDate !== res.date ? `${res.date} → ${res.endDate}` : res.date}</span>
                                                                </span>
                                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg"><Clock size={14} /> <span className="font-medium">{res.customTimeLabel || res.slot}</span></span>
                                                            </div>
                                                            <div className="mt-3 flex items-center gap-2">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${res.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${res.status === BookingStatus.CONFIRMED ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                                    {res.status === BookingStatus.CONFIRMED ? 'Confirmée' : 'En attente de validation'}
                                                                </span>
                                                                {res.checkedInAt && (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-600">
                                                                        Arrivé à {new Date(res.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions for Pending */}
                                                {res.status !== BookingStatus.CONFIRMED && (
                                                    <div className="flex justify-end border-t border-slate-100 pt-4">
                                                        <button
                                                            onClick={() => setConfirmResId(res.id)}
                                                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-sm font-bold transition-all"
                                                        >
                                                            Annuler la demande
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {/* TAB PASS : DESIGN PREMIUM */}
                        {activeTab === 'pass' && (
                            <div className="max-w-md mx-auto space-y-8 pb-20">
                                {confirmedReservations.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
                                    >
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Ticket size={32} className="text-slate-300" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Aucun Pass Actif</h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">Les pass d'accès sont générés uniquement pour les réservations confirmées.</p>
                                        <button onClick={() => setActiveTab('bookings')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                                            Voir mes réservations
                                        </button>
                                    </motion.div>
                                ) : (
                                    confirmedReservations.map((res, index) => {
                                        const space = spaces.find(s => s.id === res.spaceId);
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                key={res.id}
                                                className="relative group perspective-1000"
                                            >
                                                {/* Card Design */}
                                                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20 border border-white/10 transition-transform duration-500 hover:scale-[1.02]">
                                                    {/* Decorative Background */}
                                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black z-0"></div>
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-ess-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                                                    {/* Content */}
                                                    <div className="relative z-10 p-8 flex flex-col items-center text-center">
                                                        {/* Header */}
                                                        <div className="w-full flex justify-between items-center mb-8 opacity-80">
                                                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                                                                <span className="text-[10px] font-bold tracking-widest uppercase">Pass Actif</span>
                                                            </div>
                                                            <span className="font-black tracking-tighter text-xl">ESS</span>
                                                        </div>

                                                        {/* Space Info */}
                                                        <div className="mb-8">
                                                            <h3 className="text-3xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{space?.name}</h3>
                                                            <p className="text-slate-400 font-medium text-sm uppercase tracking-wide">{user.firstName} {user.lastName}</p>
                                                        </div>

                                                        {/* QR Code Area */}
                                                        <div className="relative bg-white p-5 rounded-3xl shadow-xl shadow-black/20 mb-8 group-hover:scale-105 transition-transform duration-500">
                                                            <div className="absolute inset-0 border-[3px] border-dashed border-slate-200 rounded-3xl pointer-events-none"></div>
                                                            <img
                                                                src={qrUrls[res.id] || `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeReservationPayload(res.id)}`}
                                                                alt="QR Code"
                                                                className="w-48 h-48 object-contain mix-blend-multiply"
                                                            />
                                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-3 py-1 rounded-full border border-white/20 shadow-lg whitespace-nowrap">
                                                                ID: {res.id}
                                                            </div>
                                                        </div>

                                                        {/* Details Grid */}
                                                        <div className="grid grid-cols-2 gap-4 w-full mb-6">
                                                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                                                <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                                                                    <Calendar size={14} />
                                                                    <div className="text-[10px] uppercase tracking-wider font-bold">Date</div>
                                                                </div>
                                                                <div className="font-bold text-lg">{res.date}</div>
                                                            </div>
                                                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                                                <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                                                                    <Clock size={14} />
                                                                    <div className="text-[10px] uppercase tracking-wider font-bold">Horaire</div>
                                                                </div>
                                                                <div className="font-bold text-lg">{res.customTimeLabel || res.slot}</div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex gap-3 w-full">
                                                            <button
                                                                onClick={() => { navigator.clipboard.writeText(encodeReservationPayload(res.id)); }}
                                                                className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 font-bold text-sm transition flex items-center justify-center gap-2 backdrop-blur-sm"
                                                            >
                                                                <Copy size={16} /> Copier
                                                            </button>
                                                            <a
                                                                href={qrUrls[res.id] || `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeReservationPayload(res.id)}`}
                                                                download={`pass-${res.id}.png`}
                                                                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-ess-600 to-ess-500 hover:from-ess-500 hover:to-ess-400 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-ess-500/25"
                                                            >
                                                                <Download size={16} /> Télécharger
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="flex gap-8">
                                {/* Menu latéral uniquement pour la messagerie */}
                                <aside className="hidden md:block w-52 shrink-0">
                                    <div className="sticky top-28 bg-white rounded-2xl border border-slate-100 shadow-sm p-2 space-y-1">
                                        <button onClick={() => setActiveTab('bookings')} className={`w-full px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50`}>
                                            <Clock size={18} /> En cours
                                        </button>
                                        <button onClick={() => setActiveTab('notifications')} className={`w-full px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 relative text-slate-600 hover:text-slate-900 hover:bg-slate-50`}>
                                            <Bell size={18} /> Notifications
                                            {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                                        </button>
                                        <button onClick={() => setActiveTab('pass')} className={`w-full px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50`}>
                                            <Ticket size={18} /> Mon Pass
                                        </button>
                                        <button onClick={() => setActiveTab('messages')} className={`w-full px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-slate-900 text-white shadow-md`}>
                                            <MessageSquare size={18} /> Messagerie
                                        </button>
                                        <button onClick={() => setActiveTab('history')} className={`w-full px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50`}>
                                            <Calendar size={18} /> Historique
                                        </button>
                                        <button onClick={() => setActiveTab('info')} className={`w-full px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50`}>
                                            <UserIcon size={18} /> Mes Infos
                                        </button>
                                    </div>
                                </aside>

                                {/* Panneau de conversation */}
                                <div className={`flex-1 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 ${chatTall ? 'h-[80vh]' : 'h-[650px]'} flex flex-col overflow-hidden relative`}>
                                    <div className="px-6 py-4 bg-gradient-to-r from-white via-ess-50 to-white border-b border-slate-100 flex justify-between items-center z-10">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="relative w-11 h-11 rounded-full bg-ess-600 ring-4 ring-ess-100 flex items-center justify-center text-white shadow-md cursor-pointer"
                                                onClick={(e) => {
                                                    setUserInfoPopover({ x: e.clientX, y: e.clientY, name: 'Support Administration', role: 'ADMIN' });
                                                }}
                                            >
                                                <ShieldCheck size={20} />
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-slate-900 tracking-tight">Support Administration</h3>
                                                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700 border border-green-200 font-bold uppercase">En ligne</span>
                                                </div>
                                                <div className="text-[11px] text-slate-500">Assistance et réponses officielles</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setChatTall(v => !v)}
                                                className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition"
                                                title={chatTall ? 'Réduire' : 'Agrandir'}
                                            >
                                                <Maximize2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowChatHeaderMenu(s => !s)}
                                                className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition"
                                                title="Options"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {showChatHeaderMenu && (
                                                <div ref={headerMenuRef} className="absolute right-2 top-14 z-20 bg-white rounded-xl shadow-xl border border-slate-200 py-2 w-56">
                                                    <button
                                                        onClick={() => {
                                                            const lines = myMessages.map(m => `${new Date(m.date).toLocaleString()} - ${m.senderRole === UserRole.USER ? 'Client' : 'Admin'}: ${m.content || (m.attachment ? '[Pièce jointe]' : '')}`);
                                                            const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url; a.download = `conversation-${user.email}.txt`; a.click();
                                                            URL.revokeObjectURL(url);
                                                            setShowChatHeaderMenu(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Download size={14} /> Télécharger la conversation
                                                    </button>
                                                    <button
                                                        onClick={() => { setUserInfoPopover({ x: window.innerWidth - 280, y: 100, name: 'Support Administration', role: 'ADMIN' }); setShowChatHeaderMenu(false); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Info size={14} /> Infos Support
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages Area - Improved UI & Scroll Fix */}
                                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative">

                                        {myMessages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                                <div className="w-20 h-20 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                                                    <MessageSquare size={32} className="text-slate-300" />
                                                </div>
                                                <h3 className="font-bold text-slate-900">Aucun message</h3>
                                                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Démarrez une conversation avec l'administration pour toute question.</p>
                                            </div>
                                        ) : (
                                            myMessages.map((msg) => {
                                                const isMe = msg.senderRole === UserRole.USER;
                                                const displayName = isMe ? `${user.firstName} ${user.lastName}` : 'Administration';
                                                const initial = displayName?.[0] || '?';
                                                return (
                                                    <div key={msg.id} className="flex justify-start items-start gap-3 group">
                                                        <div
                                                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1 ${isMe ? 'bg-slate-900 text-white' : 'bg-ess-600 text-white'} font-bold cursor-pointer`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUserInfoPopover({
                                                                    x: e.clientX,
                                                                    y: e.clientY,
                                                                    name: displayName,
                                                                    email: isMe ? user.email : undefined,
                                                                    role: isMe ? 'CLIENT' : 'ADMIN'
                                                                });
                                                            }}
                                                        >{initial}</div>

                                                        <div
                                                            onContextMenu={(e) => handleContextMenu(e, msg)}
                                                            className={`max-w-[85%] flex flex-col items-start`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-slate-900">{displayName}</span>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isMe ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-ess-50 text-ess-600 border-ess-100'}`}>{isMe ? 'CLIENT' : 'ADMIN'}</span>
                                                                <span className="text-[10px] text-slate-500 ml-2">{new Date(msg.date).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                            </div>
                                                            <div className={`px-5 py-3 shadow-sm relative text-sm leading-relaxed cursor-context-menu transition-all hover:shadow-md ${isMe
                                                                ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm'
                                                                : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
                                                                }`}>
                                                                {(() => {
                                                                    const t = classifySubject(msg.subject);
                                                                    return t ? (
                                                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border mb-2 ${isMe ? 'border-white/20' : 'border-slate-200'} ${t.cls}`}>
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                                            {t.label}
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                                {msg.pinned && (
                                                                    <div className={`absolute -top-3 ${isMe ? 'right-0' : 'left-0'} bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1 font-bold shadow-sm z-10`}>
                                                                        <Pin size={8} fill="currentColor" /> Épinglé
                                                                    </div>
                                                                )}
                                                                {msg.subject && !msg.subject.startsWith('Message depuis') && !msg.subject.startsWith('Réponse') && (
                                                                    <div className={`text-xs font-bold mb-2 pb-2 border-b ${isMe ? 'border-white/20 text-slate-300' : 'border-slate-100 text-ess-600'}`}>
                                                                        {msg.subject}
                                                                    </div>
                                                                )}

                                                                <p className="whitespace-pre-wrap">{(!msg.attachment || (msg.content && msg.content.trim())) ? msg.content : ''}</p>

                                                                {/* Attachments */}
                                                                {msg.attachment && (
                                                                    <div className="mt-3">
                                                                        {isImage(msg.attachment) ? (
                                                                            <img src={msg.attachment} alt="Attachment" className="max-w-full rounded-lg border border-white/10 max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                                                        ) : (isAudio(msg.attachment)) ? (
                                                                            <AudioPlayer src={msg.attachment} dark={isMe} />
                                                                        ) : (
                                                                            <a
                                                                                href={msg.attachment}
                                                                                download={msg.attachmentName || "document.pdf"}
                                                                                className={`flex items-center gap-3 p-3 rounded-xl transition ${isMe ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                                                    }`}
                                                                            >
                                                                                <div className="p-2 bg-white/20 rounded-lg"><FileText size={18} /></div>
                                                                                <span className="font-medium truncate max-w-[150px]">{msg.attachmentName || "Document"}</span>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {msg.attachment && (
                                                                    <div className={`mt-2 text-[10px] opacity-60 flex items-center gap-1 ${isMe ? 'text-white' : 'text-slate-500'}`}>
                                                                        <Paperclip size={12} />
                                                                    </div>
                                                                )}
                                                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (() => {
                                                                    const counts: Record<string, number> = {};
                                                                    Object.values(msg.reactions).forEach((r: any) => { counts[r] = (counts[r] || 0) + 1; });
                                                                    return (
                                                                        <div className={`absolute -bottom-2 ${isMe ? 'right-0' : 'left-0'} bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-sm flex gap-1 text-xs`}>
                                                                            {Object.entries(counts).map(([emoji, count]) => (
                                                                                <span key={emoji} className="px-1 rounded">{emoji} {count > 1 ? `×${count}` : ''}</span>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {!msg.isDeleted && (
                                                                    <div className="absolute top-0 left-full ml-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all">
                                                                        <div className="inline-flex items-center gap-1 bg-black/80 text-white rounded-2xl shadow-lg px-2.5 py-1.5">
                                                                            <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-lg hover:bg-white/10" title="Répondre"><Reply size={14} /></button>
                                                                            <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); }} className="p-1.5 rounded-lg hover:bg-white/10" title="Copier"><Copy size={14} /></button>
                                                                            <button onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)} className="p-1.5 rounded-lg hover:bg-white/10" title="Réactions"><Smile size={14} /></button>
                                                                            {isMe && (
                                                                                <button onClick={() => { setEditingMsgId(msg.id); setNewMessage(msg.content || ''); }} className="p-1.5 rounded-lg hover:bg-white/10" title="Modifier"><Edit size={14} /></button>
                                                                            )}
                                                                            {isMe && (
                                                                                <button onClick={(e) => { if (e.shiftKey) hardDeleteMessage(msg.id); else setConfirmMsgId(msg.id); }} className="p-1.5 rounded-lg hover:bg-white/10" title="Supprimer"><Trash2 size={14} /></button>
                                                                            )}
                                                                            <button onClick={() => setMoreMenuFor(moreMenuFor === msg.id ? null : msg.id)} className="p-1.5 rounded-lg hover:bg-white/10" title="Plus"><MoreVertical size={14} /></button>
                                                                        </div>
                                                                        {emojiPickerFor === msg.id && (
                                                                            <div className="absolute top-8 left-full ml-2 bg-black/85 text-white rounded-xl px-2 py-2 shadow-xl flex flex-wrap gap-1">
                                                                                {['👍', '❤️', '😂', '🎉', '😮', '🙏', '✅', '❗'].map(e => (
                                                                                    <button key={e} onClick={() => { reactToMessage(msg.id, e); setEmojiPickerFor(null); }} className="px-2 py-1 rounded-lg hover:bg-white/10 text-sm">{e}</button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {moreMenuFor === msg.id && (
                                                                            <div className="absolute top-8 left-full ml-2 bg-black/85 text-white rounded-xl px-2 py-2 shadow-xl min-w-[180px]">
                                                                                {msg.attachment && (
                                                                                    <a href={msg.attachment} download={msg.attachmentName || 'pièce-jointe'} className="text-left px-2 py-1 rounded-lg hover:bg-white/10 text-sm flex items-center gap-2">
                                                                                        <Download size={14} /> Télécharger la pièce jointe
                                                                                    </a>
                                                                                )}
                                                                                <button onClick={() => { pinMessage(msg.id, !msg.pinned); setMoreMenuFor(null); }} className="text-left px-2 py-1 rounded-lg hover:bg-white/10 text-sm flex items-center gap-2">
                                                                                    <Pin size={14} /> {msg.pinned ? 'Détacher' : 'Épingler'}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-1 px-1 font-medium flex items-center gap-1">
                                                                {new Date(msg.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                                {isMe && !msg.isDeleted && (msg.readAt ? <span title={`Lu le ${new Date(msg.readAt as any).toLocaleString()}`} className="flex items-center gap-0.5 text-green-500"><CheckCheck size={12} /></span> : <span title="Envoyé" className="flex items-center gap-0.5"><Check size={12} /></span>)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Context Menu */}
                                    {contextMenu && (
                                        <div
                                            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-100 py-1 w-48 overflow-hidden animate-fade-in"
                                            style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 200) }}
                                            ref={menuRef}
                                        >
                                            <button onClick={handleCopyMessage} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                <Copy size={14} /> Copier le texte
                                            </button>
                                            <button onClick={handleReplyCurrent} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                <Reply size={14} /> Répondre
                                            </button>
                                            {contextMenu.msg.senderRole === UserRole.USER && (
                                                <button onClick={handleEditCurrent} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                    <Save size={14} /> Modifier
                                                </button>
                                            )}
                                            {contextMenu.msg.senderRole === UserRole.USER && (
                                                <button onClick={(e) => handleDeleteMessage(e)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                    <Trash2 size={14} /> Supprimer
                                                </button>
                                            )}
                                            <button onClick={handleTogglePin} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                <Pin size={14} /> {contextMenu.msg.pinned ? 'Détacher' : 'Épingler'}
                                            </button>
                                            <div className="px-4 py-2 text-[11px] text-slate-500 border-t">Réagir</div>
                                            <div className="px-3 pb-2 flex flex-wrap gap-2">
                                                {['👍', '❤️', '✅', '❗', '🎉', '🤝'].map(e => (
                                                    <button key={e} onClick={() => handleReact(e)} className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-sm">{e}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {notifMenu && (
                                        <div
                                            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-100 py-1 w-48 overflow-hidden animate-fade-in"
                                            style={{ top: notifMenu.y, left: Math.min(notifMenu.x, window.innerWidth - 200) }}
                                            ref={notifMenuRef}
                                        >
                                            <button onClick={() => { markNotificationAsRead(notifMenu.notif.id); setNotifMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Marquer comme lu</button>
                                            <button onClick={() => { deleteNotification(notifMenu.notif.id); setNotifMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Supprimer</button>
                                        </div>
                                    )}

                                    {/* Input Area */}
                                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                                        {attachment && (
                                            <div className="flex items-center gap-3 mb-3 bg-slate-50 w-fit px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 animate-fade-in">
                                                {attachment.startsWith('data:image') ? (
                                                    <img src={attachment} alt="Pièce jointe" className="w-10 h-10 object-cover rounded-lg border" />
                                                ) : attachment.includes('audio') ? (
                                                    <audio controls src={attachment} className="h-10" />
                                                ) : (
                                                    <div className="p-1.5 bg-white rounded border border-slate-200"><FileText size={12} /></div>
                                                )}
                                                <span className="font-medium truncate max-w-[160px]">{attachmentName}</span>
                                                <button type="button" onClick={() => { setAttachment(null); setAttachmentName(null); }} className="ml-2 p-1 hover:bg-red-100 hover:text-red-600 rounded-full transition"><X size={12} /></button>
                                            </div>
                                        )}
                                        <div className="flex items-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-3 text-slate-400 hover:text-ess-600 hover:bg-ess-50 rounded-xl transition-colors"
                                                title="Joindre un fichier"
                                            >
                                                <Paperclip size={22} />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*,audio/*,application/pdf"
                                                onChange={handleFileChange}
                                            />
                                            <button
                                                type="button"
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={`p-3 rounded-xl transition ${isRecording ? 'bg-red-100 text-red-600 ring-2 ring-red-200' : 'text-slate-400 hover:text-ess-600 hover:bg-ess-50'}`}
                                                title={isRecording ? 'Arrêter' : 'Dictée vocale'}
                                            >
                                                {isRecording ? <Square size={22} /> : <Mic size={22} />}
                                            </button>
                                            {isRecording && (
                                                <span className="text-xs font-mono text-red-600">{recordingElapsed}</span>
                                            )}
                                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-ess-500/20 focus-within:border-ess-500 transition-all relative">
                                                {replyingTo && (
                                                    <div className="mb-2 text-xs bg-white border border-slate-200 rounded-xl p-2">
                                                        <div className="font-bold mb-1 flex items-center gap-2"><Reply size={12} /> Réponse à</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-slate-500 line-clamp-2 flex-1">{replyingTo.content}</div>
                                                            {replyingTo.attachment && (
                                                                replyingTo.attachment.startsWith('data:image') ? (
                                                                    <img src={replyingTo.attachment} alt="Aperçu" className="w-10 h-10 rounded-lg object-cover border" />
                                                                ) : replyingTo.attachment.startsWith('data:audio') ? (
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><Mic size={14} /></div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><FileText size={14} /></div>
                                                                )
                                                            )}
                                                        </div>
                                                        <button type="button" onClick={() => setReplyingTo(null)} className="mt-1 text-[11px] text-red-500">Annuler</button>
                                                    </div>
                                                )}
                                                <textarea
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage(e);
                                                        }
                                                    }}
                                                    placeholder="Écrivez votre message..."
                                                    className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-sm placeholder:text-slate-400"
                                                    rows={1}
                                                    style={{ minHeight: '24px' }}
                                                />
                                                {editingMsgId && (
                                                    <button type="button" onClick={() => { setEditingMsgId(null); setNewMessage(''); }} className="absolute right-2 top-2 text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded hover:bg-slate-200">Annuler</button>
                                                )}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() && !attachment}
                                                className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 transition-all transform active:scale-95"
                                            >
                                                <Send size={20} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-5 text-xs font-bold uppercase text-slate-500 tracking-wider">Espace</th>
                                            <th className="p-5 text-xs font-bold uppercase text-slate-500 tracking-wider">Date</th>
                                            <th className="p-5 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pastReservations.length === 0 && (
                                            <tr><td colSpan={3} className="p-10 text-center text-slate-400">Aucun historique disponible.</td></tr>
                                        )}
                                        {pastReservations.map(res => {
                                            const space = spaces.find(s => s.id === res.spaceId);
                                            return (
                                                <tr key={res.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="p-5 font-bold text-slate-900">{space?.name}</td>
                                                    <td className="p-5 text-slate-600 text-sm font-medium">
                                                        {res.endDate && res.endDate !== res.date ? `${res.date} -> ${res.endDate}` : res.date}
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${res.status === BookingStatus.CANCELLED ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                            {res.status === BookingStatus.CANCELLED ? 'Annulé' : 'Terminé'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-2xl shadow-sm">
                                {profileSaved && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-bold">Profil mis à jour</div>
                                )}
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-slate-900">Informations Personnelles</h3>
                                    <button onClick={() => setIsEditing(!isEditing)} className="text-ess-600 text-sm font-bold hover:underline bg-ess-50 px-4 py-2 rounded-xl transition-colors">
                                        {isEditing ? 'Annuler' : 'Modifier'}
                                    </button>
                                </div>

                                <form onSubmit={handleSaveProfile} className="space-y-6">
                                    {isEditing ? (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prénom</label>
                                                    <input disabled={!isEditing} type="text" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-ess-500 outline-none font-medium transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nom</label>
                                                    <input disabled={!isEditing} type="text" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-ess-500 outline-none font-medium transition-all" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                                                <input disabled type="email" value={formData.email || ''} className="w-full border border-slate-200 rounded-xl p-3.5 bg-slate-100 text-slate-500 cursor-not-allowed font-medium" title="Contactez l'admin pour changer d'email" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Téléphone</label>
                                                <input disabled={!isEditing} type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-ess-500 outline-none font-medium transition-all" />
                                            </div>

                                            {user.type === UserType.COMPANY && (
                                                <div className="border-t border-slate-100 pt-6 mt-6">
                                                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Building size={16} className="text-slate-400" /> Informations Entreprise</h4>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raison Sociale</label>
                                                            <input disabled={!isEditing} type="text" value={formData.companyName || ''} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-ess-500 outline-none font-medium transition-all" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SIRET</label>
                                                            <input disabled={!isEditing} type="text" value={formData.siret || ''} onChange={e => setFormData({ ...formData, siret: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-ess-500 outline-none font-medium transition-all" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-6 flex justify-end">
                                                <button type="submit" className="bg-ess-600 text-white px-6 py-3 rounded-lg hover:bg-ess-700 flex items-center gap-2 font-bold shadow-sm transition">
                                                    <Save size={18} /> Enregistrer les modifications
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                                                        <Mail size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
                                                        <div className="font-medium text-slate-900">{formData.email}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                                                        <Phone size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Téléphone</div>
                                                        <div className="font-medium text-slate-900">{formData.phone}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                                <button type="button" onClick={() => setActiveTab('messages')} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-ess-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-ess-700 transition">
                                                    <MessageSquare size={18} /> Envoyer un message
                                                </button>
                                                <button type="button" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition">
                                                    <Edit size={18} /> Modifier
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </form>

                                {/* DANGER ZONE */}
                                <div className="mt-12 pt-8 border-t border-red-100">
                                    <h4 className="text-red-600 font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                                        <AlertTriangle size={16} /> Zone de danger
                                    </h4>
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="text-sm text-red-800 text-center sm:text-left">
                                            <p className="font-bold mb-1">Supprimer mon compte</p>
                                            <p className="opacity-70 leading-relaxed">Cette action est irréversible. Toutes vos données de réservation et messages seront définitivement effacés.</p>
                                        </div>
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-sm whitespace-nowrap shadow-sm"
                                        >
                                            Supprimer définitivement
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {confirmResId && (
                    <div className="fixed inset-0 z-[40] flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
                            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-900">Confirmation</h3>
                                <button onClick={() => setConfirmResId(null)} className="text-slate-400 hover:text-slate-900 transition"><X size={20} /></button>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-700 text-sm font-medium">Annuler cette réservation ?</p>
                            </div>
                            <div className="p-5 border-t border-slate-200 flex gap-2 justify-end bg-slate-50">
                                <button onClick={() => setConfirmResId(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-sm">Non</button>
                                <button onClick={async () => { if (confirmResId) { await cancelReservation(confirmResId); setConfirmResId(null); } }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Oui, annuler</button>
                            </div>
                        </div>
                    </div>
                )}

                {deleteConfirmOpen && (
                    <div className="fixed inset-0 z-[40] flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
                            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-900">Confirmer la suppression</h3>
                                <button onClick={() => setDeleteConfirmOpen(false)} className="text-slate-400 hover:text-slate-900 transition"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-slate-700 text-sm font-medium">Tapez "SUPPRIMER" pour confirmer. Cette action est irréversible.</p>
                                <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="SUPPRIMER" className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-red-500 outline-none font-medium" />
                            </div>
                            <div className="p-5 border-t border-slate-200 flex gap-2 justify-end bg-slate-50">
                                <button onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-sm">Annuler</button>
                                <button onClick={confirmDeleteAccount} disabled={deleteConfirmText !== 'SUPPRIMER'} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm disabled:opacity-50">Supprimer définitivement</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {userInfoPopover && (
                <div
                    className="fixed z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-64"
                    style={{ top: Math.min(userInfoPopover.y + 12, window.innerHeight - 220), left: Math.min(userInfoPopover.x + 12, window.innerWidth - 260) }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                            {userInfoPopover.name[0]}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900">{userInfoPopover.name}</div>
                            <div className="text-xs text-slate-500">{userInfoPopover.role}</div>
                        </div>
                    </div>
                    {userInfoPopover.email && (
                        <div className="text-xs text-slate-600 truncate">{userInfoPopover.email}</div>
                    )}
                </div>
            )}
            {confirmMsgId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Confirmation</h3>
                            <button onClick={() => setConfirmMsgId(null)} className="text-slate-400 hover:text-slate-900 transition"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 text-sm font-medium">Supprimer ce message ?</p>
                        </div>
                        <div className="p-5 border-t border-slate-200 flex gap-2 justify-end bg-slate-50">
                            <button onClick={() => setConfirmMsgId(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-sm">Annuler</button>
                            <button onClick={async () => { if (confirmMsgId) { await hardDeleteMessage(confirmMsgId); setConfirmMsgId(null); } }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
            {fullQrFor && (
                <div className="fixed inset-0 z-[45] flex items-center justify-center p-4">
                    <div className="absolute inset-0 checkerboard"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900/70"></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Pass d'accès</h3>
                            <button onClick={() => setFullQrFor(null)} className="text-slate-400 hover:text-slate-900 transition"><X size={20} /></button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <img src={qrUrls[fullQrFor] || `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeReservationPayload(fullQrFor)}`} alt="QR Code" className="w-[420px] h-[420px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]" />
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { navigator.clipboard.writeText(encodeReservationPayload(fullQrFor)); }} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800">
                                    Copier le code
                                </button>
                                <a href={qrUrls[fullQrFor] || `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeReservationPayload(fullQrFor)}`} download={`pass-${fullQrFor}.png`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50">
                                    Télécharger
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
      .checkerboard {
        --tile: rgba(148, 163, 184, 0.10);
        background-color: #0b1220;
        background-image:
          conic-gradient(from 90deg, var(--tile) 90deg, transparent 0) 0 0/24px 24px,
          conic-gradient(from 90deg, transparent 90deg, var(--tile) 0) 12px 12px/24px 24px;
      }
    `}</style>
        </>
    );
};
