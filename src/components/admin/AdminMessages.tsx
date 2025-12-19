
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Message, UserRole } from '../../types';
import { api } from '../../data/api';
import { Plus, Inbox, CheckCheck, Check, FileText, Edit, Trash2, Pin, Smile, Paperclip, Send, X, Mic, Square, Reply, Play, Pause, MoreVertical, Copy } from 'lucide-react';
import { AdminNewMsgModal } from './modals/AdminNewMsgModal';
import type { User } from '../../types';

interface AdminMessagesProps {
  initialSelectedEmail: string | null;
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({ initialSelectedEmail }) => {
  const { messages, sendMessage, editMessage, deleteMessage, hardDeleteMessage, pinMessage, reactToMessage, markAsRead } = useApp();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(initialSelectedEmail);
  const [adminReply, setAdminReply] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isNewMsgModalOpen, setIsNewMsgModalOpen] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [confirmMsgId, setConfirmMsgId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: Message } | null>(null);
  const [convMenu, setConvMenu] = useState<{ x: number; y: number; email: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [moreMenuFor, setMoreMenuFor] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
      <div className={`mt-2 w-full max-w-xs ${dark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-700'} rounded-xl px-3 py-2 border ${dark ? 'border-white/20' : 'border-zinc-200'} flex items-center gap-3`}>
        <button type="button" onClick={toggle} className={`p-2 rounded-lg ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-zinc-200'} transition`}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
        <div className="flex-1">
          <div className={`h-1.5 rounded-full ${dark ? 'bg-white/20' : 'bg-zinc-200'}`}>
            <div style={{ width: `${progress}%` }} className={`h-1.5 rounded-full ${dark ? 'bg-white' : 'bg-black'}`}></div>
          </div>
          <div className={`text-[10px] mt-1 flex justify-between ${dark ? 'text-white/70' : 'text-zinc-500'}`}><span>{current}</span><span>{total}</span></div>
        </div>
      </div>
    );
  };
  const classifySubject = (subject?: string) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('devis')) return { label: 'Devis', cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 font-bold' };
    if (s.includes('contact')) return { label: 'Contact', cls: 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800' };
    return null;
  };
  const isImage = (src: string) => src.startsWith('data:image') || /\.(png|jpe?g|gif|webp)$/i.test(src);
  const isAudio = (src: string) => src.startsWith('data:audio') || /\.(webm|mp3|wav|m4a|ogg)$/i.test(src);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const msgMenuRef = useRef<HTMLDivElement>(null);
  const convMenuRef = useRef<HTMLDivElement>(null);
  const hadConversationsRef = useRef(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    let mounted = true;
    api.users.getAll(true).then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (initialSelectedEmail) setSelectedEmail(initialSelectedEmail);
  }, [initialSelectedEmail]);

  // Group Messages
  const conversations = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    messages.forEach(m => {
      if (!groups[m.email]) groups[m.email] = [];
      groups[m.email].push(m);
    });
    const result = Object.entries(groups).sort(([, msgsA], [, msgsB]) => {
      const lastA = new Date(msgsA[msgsA.length - 1].date).getTime();
      const lastB = new Date(msgsB[msgsB.length - 1].date).getTime();
      return lastB - lastA;
    });
    if (result.length > 0) hadConversationsRef.current = true;
    return result;
  }, [messages]);

  useEffect(() => {
    if (selectedEmail) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      markAsRead(selectedEmail);
    }
  }, [selectedEmail]);

  useEffect(() => {
    if (selectedEmail) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, selectedEmail]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (msgMenuRef.current && msgMenuRef.current.contains(t)) return;
      if (convMenuRef.current && convMenuRef.current.contains(t)) return;
      setContextMenu(null); setConvMenu(null);
      setEmojiPickerFor(null); setMoreMenuFor(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleAdminSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!adminReply.trim() && !attachment) || !selectedEmail) return;

    const replyToSend = adminReply;
    const attachmentToSend = attachment;
    const attachmentNameToSend = attachmentName;
    // clear immediately to avoid UI persistence
    setAdminReply('');
    setAttachment(null);
    setAttachmentName(null);

    if (editingMsgId) {
      await editMessage(editingMsgId, replyToSend);
      setEditingMsgId(null);
    } else {
      const targetUser = allUsers.find(u => u.email === selectedEmail);
      const targetName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Utilisateur';

      await sendMessage({
        name: targetName,
        email: selectedEmail,
        subject: 'Réponse Administration',
        type: 'contact',
        content: ((replyingTo ? `> ${replyingTo.content || ''}\n\n` : '') + replyToSend) || '',
        message: ((replyingTo ? `> ${replyingTo.content || ''}\n\n` : '') + replyToSend) || '',
        senderRole: UserRole.ADMIN,
        attachment: attachmentToSend || undefined,
        attachmentName: attachmentNameToSend || undefined
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

  const handleMsgContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const handleConvContextMenu = (e: React.MouseEvent, email: string) => {
    e.preventDefault();
    setConvMenu({ x: e.clientX, y: e.clientY, email });
  };

  const openMsgMenuFromButton = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 4, msg });
  };

  const openConvMenuFromButton = (e: React.MouseEvent, email: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setConvMenu({ x: rect.left, y: rect.bottom + 4, email });
  };

  const handleCopyMsg = () => {
    if (contextMenu?.msg?.content) {
      navigator.clipboard.writeText(contextMenu.msg.content);
    }
    setContextMenu(null);
  };

  const handleEditMsg = () => {
    if (contextMenu?.msg) {
      setEditingMsgId(contextMenu.msg.id);
      setAdminReply(contextMenu.msg.content || '');
      setContextMenu(null);
      setTimeout(() => textAreaRef.current?.focus(), 50);
    }
  };

  const handleReplyMsg = () => {
    if (contextMenu?.msg) {
      setReplyingTo(contextMenu.msg);
      setContextMenu(null);
      setTimeout(() => textAreaRef.current?.focus(), 50);
    }
  };

  const handleDeleteMsg = () => {
    if (contextMenu?.msg) {
      setConfirmMsgId(contextMenu.msg.id);
      setContextMenu(null);
    }
  };

  const handleTogglePin = () => {
    if (contextMenu?.msg) {
      pinMessage(contextMenu.msg.id, !contextMenu.msg.pinned);
      setContextMenu(null);
    }
  };

  const handleReact = (emoji: string) => {
    if (contextMenu?.msg) {
      reactToMessage(contextMenu.msg.id, emoji);
      setContextMenu(null);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] bg-white dark:bg-black">
      {/* Vue mobile: une seule vue (liste OU conversation) */}
      <div className="md:hidden h-full relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

        {!selectedEmail ? (
          <div className="flex h-full flex-col relative z-10">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-zinc-900 dark:text-white tracking-tight">Messagerie</h3>
                <p className="text-xs text-zinc-500 font-medium">Vos échanges clients</p>
              </div>
              <button onClick={() => setIsNewMsgModalOpen(true)} className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg shadow-zinc-200 dark:shadow-zinc-800" title="Nouvelle conversation">
                <Plus size={20} />
              </button>
            </div>
            <div className="p-4 bg-white dark:bg-black">
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une conversation..."
                  className="w-full text-sm pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Inbox size={18} />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-black px-2">
              {conversations.length === 0 && !hadConversationsRef.current ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                  <Inbox size={48} strokeWidth={1} className="mb-4 opacity-50" />
                  <p className="text-sm font-medium">Aucune conversation</p>
                </div>
              ) : (
                conversations
                  .filter(([email, msgs]) => {
                    const name = msgs[0]?.name || '';
                    const lastContent = msgs[msgs.length - 1]?.content || '';
                    const q = searchTerm.toLowerCase();
                    return !q || email.toLowerCase().includes(q) || name.toLowerCase().includes(q) || lastContent.toLowerCase().includes(q);
                  })
                  .map(([email, msgs]) => {
                    const lastMsg = msgs[msgs.length - 1];
                    const hasUnread = msgs.some(m => !m.read && m.senderRole === UserRole.USER);
                    return (
                      <button
                        key={email}
                        onClick={() => setSelectedEmail(email)}
                        onContextMenu={(e) => handleConvContextMenu(e, email)}
                        className="w-full text-left p-4 mb-2 rounded-2xl border border-zinc-100 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all bg-white dark:bg-zinc-900/50 flex gap-4 items-center group active:scale-[0.98]"
                      >
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-black text-lg ${hasUnread ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                            {msgs[0].name[0]}
                          </div>
                          {hasUnread && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse"></div>}
                        </div>

                        <div className="overflow-hidden flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold text-base truncate ${hasUnread ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>{msgs[0].name}</span>
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-full">
                              {new Date(lastMsg.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p className={`text-sm truncate font-medium ${hasUnread ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {lastMsg.senderRole === UserRole.ADMIN && <span className="text-zinc-400 mr-1">Vous:</span>}
                            {(lastMsg.content || (lastMsg.attachment ? '📎 Pièce jointe' : ''))}
                          </p>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col bg-white dark:bg-black relative z-10">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-20">
              <button onClick={() => setSelectedEmail(null)} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition" title="Retour">
                <Reply size={20} className="rotate-180" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-zinc-900 dark:text-white truncate text-lg">
                  {allUsers.find(u => u.email === selectedEmail)?.firstName} {allUsers.find(u => u.email === selectedEmail)?.lastName || selectedEmail}
                </div>
                <div className="text-xs text-zinc-500 truncate">{selectedEmail}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-white font-black">
                {selectedEmail[0].toUpperCase()}
              </div>
            </div>

            {(() => {
              const conv = conversations.find(c => c[0] === selectedEmail)?.[1] || [];
              const text = conv.map(m => (m.subject || '').toLowerCase()).join(' ');
              const kind = text.includes('devis') ? 'devis' : text.includes('contact') ? 'contact' : null;
              return kind ? (
                <div className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-3 ${kind === 'devis' ? 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800' : 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kind === 'devis' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {kind === 'devis' ? <FileText size={16} /> : <Inbox size={16} />}
                  </div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">{kind === 'devis' ? 'Demande de Devis' : 'Prise de Contact'}</div>
                </div>
              ) : null;
            })()}

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {(conversations.find(c => c[0] === selectedEmail)?.[1] || []).map(msg => {
                const isAdmin = msg.senderRole === UserRole.ADMIN;
                const displayName = isAdmin ? 'Administration' : (msg.name || 'Utilisateur');
                return (
                  <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} group animate-fade-in-up`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-zinc-400">
                        {new Date(msg.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isAdmin && (msg.readAt ? <CheckCheck size={12} className="text-zinc-900 dark:text-white" /> : <Check size={12} className="text-zinc-400" />)}
                    </div>

                    <div
                      onContextMenu={(e) => handleMsgContextMenu(e, msg)}
                      className={`max-w-[85%] px-5 py-3 shadow-sm relative text-sm leading-relaxed transition-all ${isAdmin
                        ? 'bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm'
                        : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800 rounded-2xl rounded-tl-sm'
                        }`}
                    >
                      {msg.pinned && (
                        <div className="absolute -top-2.5 right-4 bg-yellow-400 text-black text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm flex items-center gap-1 z-10">
                          <Pin size={8} fill="currentColor" /> ÉPINGLÉ
                        </div>
                      )}

                      {msg.subject && !msg.subject.startsWith('Réponse') && !msg.subject.startsWith('Message depuis') && (
                        <div className={`text-xs font-bold mb-2 pb-2 border-b ${isAdmin ? 'border-white/20 text-zinc-300' : 'border-zinc-100 text-zinc-900 dark:text-white'}`}>{msg.subject}</div>
                      )}

                      <p className="whitespace-pre-wrap">{(!msg.attachment || (msg.content && msg.content.trim())) ? msg.content : ''}</p>

                      {msg.attachment && (
                        <div className="mt-3">
                          {isImage(msg.attachment) ? (
                            <img src={msg.attachment} alt="Attachment" className="w-full rounded-lg border border-white/10 max-h-56 object-cover" />
                          ) : isAudio(msg.attachment) ? (
                            <AudioPlayer src={msg.attachment} dark={isAdmin} />
                          ) : (
                            <a href={msg.attachment} download={msg.attachmentName || 'document.pdf'} className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition ${isAdmin ? 'bg-white/10 hover:bg-white/20' : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'}`}>
                              <FileText size={18} />
                              <span className="truncate">{msg.attachmentName || 'Document joint'}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleAdminSendMessage} className="sticky bottom-0 p-3 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800 backdrop-blur-xl">
              {replyingTo && (
                <div className="mb-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-1 h-8 bg-black dark:bg-white rounded-full"></div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1"><Reply size={10} /> Réponse à</div>
                      <div className="text-zinc-500 truncate max-w-[200px]">{replyingTo.content || 'Pièce jointe'}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full"><X size={14} /></button>
                </div>
              )}

              <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all shadow-sm">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-full transition" title="Joindre">
                  <Paperclip size={20} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*,application/pdf" onChange={handleFileChange} />

                <textarea
                  ref={textAreaRef}
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder={editingMsgId ? "Modifier..." : "Message..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 p-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-none max-h-32"
                  rows={1}
                />

                <button type="submit" disabled={!adminReply.trim() && !attachment} className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                  {editingMsgId ? <Check size={18} /> : <Send size={18} />}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Vue desktop: deux colonnes */}
      <div className="hidden md:flex h-full gap-6">
        <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-xl border border-zinc-200 dark:border-zinc-800 w-full md:w-80 lg:w-96 overflow-hidden flex flex-col transition-colors duration-300">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center gap-2">
            <h3 className="font-bold text-zinc-900 dark:text-white">Conversations</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className="hidden md:block text-xs pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Inbox size={12} />
                </div>
              </div>
              <button onClick={() => setIsNewMsgModalOpen(true)} className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:scale-105 transition shadow-sm" title="Nouvelle conversation">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-black">
            {conversations.length === 0 && !hadConversationsRef.current ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Aucune conversation.</div>
            ) : (
              conversations
                .filter(([email, msgs]) => {
                  const name = msgs[0]?.name || '';
                  const lastContent = msgs[msgs.length - 1]?.content || '';
                  const q = searchTerm.toLowerCase();
                  return !q || email.toLowerCase().includes(q) || name.toLowerCase().includes(q) || lastContent.toLowerCase().includes(q);
                })
                .map(([email, msgs]) => {
                  const lastMsg = msgs[msgs.length - 1];
                  const isSelected = selectedEmail === email;
                  const hasUnread = msgs.some(m => !m.read && m.senderRole === UserRole.USER);
                  return (
                    <div
                      key={email}
                      onClick={() => setSelectedEmail(email)}
                      onContextMenu={(e) => handleConvContextMenu(e, email)}
                      className={`p-4 border-b border-zinc-100 dark:border-zinc-900 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 flex gap-3 items-start relative group ${isSelected ? 'bg-zinc-50 dark:bg-zinc-900 border-l-4 border-l-black dark:border-l-white' : 'border-l-4 border-l-transparent'}`}
                    >
                      {hasUnread && <div className="absolute right-4 top-4 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-black shadow-sm animate-pulse"></div>}
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold uppercase transition-colors ${isSelected ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        {msgs[0].name[0]}
                      </div>
                      <div className="overflow-hidden w-full">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`font-bold text-sm truncate ${hasUnread ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>{msgs[0].name}</span>
                        </div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{email}</div>
                        <p className={`text-xs truncate font-medium ${hasUnread ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}>
                          {lastMsg.senderRole === UserRole.ADMIN ? 'Vous: ' : ''} {(lastMsg.content || (lastMsg.attachment ? 'Pièce jointe' : ''))}
                        </p>
                      </div>
                      <button onClick={(e) => openConvMenuFromButton(e, email)} className="absolute right-2 top-2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 transition opacity-0 group-hover:opacity-100" title="Options">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden relative transition-colors duration-300">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

          {selectedEmail ? (
            <>
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black font-bold shadow-md">
                    {selectedEmail[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white text-lg">
                      {allUsers.find(u => u.email === selectedEmail)?.firstName} {allUsers.find(u => u.email === selectedEmail)?.lastName || selectedEmail}
                    </div>
                    <div className="text-xs text-zinc-500">{selectedEmail}</div>
                  </div>
                </div>
              </div>

              {(() => {
                const conv = conversations.find(c => c[0] === selectedEmail)?.[1] || [];
                const text = conv.map(m => (m.subject || '').toLowerCase()).join(' ');
                const kind = text.includes('devis') ? 'devis' : text.includes('contact') ? 'contact' : null;
                return kind ? (
                  <div className={`mx-6 mt-4 ${kind === 'devis' ? 'bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200' : 'bg-zinc-50 border-zinc-100 text-zinc-800 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-300'} border rounded-xl px-4 py-3 flex items-center gap-3 relative z-10`}>
                    <div className={`${kind === 'devis' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'} w-8 h-8 rounded-lg flex items-center justify-center`}>{kind === 'devis' ? <FileText size={16} /> : <Inbox size={16} />}</div>
                    <div className="text-sm font-bold">{kind === 'devis' ? 'Conversation Devis' : 'Conversation Contact'}</div>
                  </div>
                ) : null;
              })()}

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-black relative z-10 custom-scrollbar">
                {(conversations.find(c => c[0] === selectedEmail)?.[1] || []).map(msg => {
                  const isAdmin = msg.senderRole === UserRole.ADMIN;
                  const displayName = isAdmin ? 'Administration' : (msg.name || 'Utilisateur');
                  const initial = (displayName[0] || '?').toUpperCase();
                  return (
                    <div key={msg.id} className={`flex justify-start items-start gap-3 group animate-fade-in-up`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1 ${isAdmin ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'} font-bold shadow-sm`}>{initial}</div>
                      <div className="max-w-[85%] flex flex-col items-start relative">
                        {msg.pinned && (
                          <div className="absolute -top-3 left-0 bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-black shadow-sm z-10">
                            <Pin size={8} fill="currentColor" /> ÉPINGLÉ
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1 w-full">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{displayName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isAdmin ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>{isAdmin ? 'ADMIN' : 'CLIENT'}</span>
                          <span className="ml-auto text-[10px] text-zinc-400">{new Date(msg.date).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          <button onClick={(e) => openMsgMenuFromButton(e, msg)} className="ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 transition opacity-0 group-hover:opacity-100" title="Options">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                        <div onContextMenu={(e) => handleMsgContextMenu(e, msg)} className={`px-5 py-3 shadow-sm relative text-sm leading-relaxed transition-all ${isAdmin ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-2xl rounded-tr-sm' : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800 rounded-2xl rounded-tl-sm'}`}>
                          {msg.subject && !msg.subject.startsWith('Réponse') && !msg.subject.startsWith('Message depuis') && (
                            <div className={`text-xs font-bold mb-2 pb-2 border-b ${isAdmin ? 'border-white/20 text-zinc-300 dark:text-zinc-600 dark:border-black/10' : 'border-zinc-100 text-zinc-900 dark:text-white'}`}>{msg.subject}</div>
                          )}
                          <p className="whitespace-pre-wrap">{(!msg.attachment || (msg.content && msg.content.trim())) ? msg.content : ''}</p>
                          {msg.attachment && (
                            <div className="mt-3">
                              {isImage(msg.attachment) ? (
                                <img src={msg.attachment} alt="Attachment" className="max-w-full rounded-lg border border-white/20 max-h-48 object-cover" />
                              ) : isAudio(msg.attachment) ? (
                                <AudioPlayer src={msg.attachment} dark={isAdmin} />
                              ) : (
                                <a href={msg.attachment} download={msg.attachmentName || 'document.pdf'} className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition ${isAdmin ? 'bg-white/10 hover:bg-white/20 dark:bg-black/5 dark:hover:bg-black/10' : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'}`}>
                                  <FileText size={16} /> {msg.attachmentName || 'Document joint'}
                                </a>
                              )}
                            </div>
                          )}
                          {msg.attachment && (
                            <div className={`mt-2 text-[10px] opacity-60 flex items-center gap-1 ${isAdmin ? 'text-white dark:text-black' : 'text-zinc-500'}`}>
                              <Paperclip size={12} />
                            </div>
                          )}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (() => {
                            const counts: Record<string, number> = {};
                            Object.values(msg.reactions).forEach((r: any) => { counts[r] = (counts[r] || 0) + 1; });
                            return (
                              <div className={`absolute -bottom-2 right-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-1.5 py-0.5 shadow-sm flex gap-1 text-xs`}>
                                {Object.entries(counts).map(([emoji, count]) => (
                                  <span key={emoji} className="px-1 rounded">{emoji} {count > 1 ? `×${count}` : ''}</span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleAdminSendMessage} className="p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 relative z-10">
                {replyingTo && (
                  <div className="mb-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-1 h-8 bg-black dark:bg-white rounded-full"></div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1"><Reply size={10} /> Réponse à</div>
                        <div className="text-zinc-500 truncate max-w-[300px]">{replyingTo.content}</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full"><X size={14} /></button>
                  </div>
                )}
                {attachment && (
                  <div className="mb-3 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 inline-flex items-center gap-3">
                    {attachment.startsWith('data:image') ? (
                      <img src={attachment} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400"><FileText size={20} /></div>
                    )}
                    <div className="text-xs">
                      <div className="font-bold text-zinc-900 dark:text-zinc-200">{attachmentName}</div>
                      <button type="button" onClick={() => { setAttachment(null); setAttachmentName(null); }} className="text-red-500 dark:text-red-400 hover:underline mt-1">Supprimer</button>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all shadow-sm">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-full transition" title="Joindre un fichier">
                    <Paperclip size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*,application/pdf" onChange={handleFileChange} />
                  <button type="button" onClick={() => { if (isRecording) { mediaRecorderRef.current?.stop(); } else { navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => { const mr = new MediaRecorder(stream); mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); }; mr.onstop = () => { const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); const reader = new FileReader(); reader.onloadend = () => { setAttachment(reader.result as string); setAttachmentName('message.webm'); }; reader.readAsDataURL(blob); stream.getTracks().forEach(t => t.stop()); setIsRecording(false); }; audioChunksRef.current = []; mediaRecorderRef.current = mr; mr.start(); setIsRecording(true); }); } }} className={`p-3 rounded-full transition ${isRecording ? 'bg-red-100 text-red-600' : 'text-zinc-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800'}`} title={isRecording ? 'Arrêter' : 'Dictée vocale'}>
                    {isRecording ? <Square size={20} /> : <Mic size={20} />}
                  </button>
                  <div className="flex-1 relative">
                    <textarea ref={textAreaRef} value={adminReply} onChange={(e) => setAdminReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdminSendMessage(e); } }} placeholder={editingMsgId ? "Modifier votre message..." : "Votre réponse..."} className={`w-full bg-transparent border-none focus:ring-0 px-2 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-none max-h-32`} rows={1} />
                    {editingMsgId && (
                      <button type="button" onClick={() => { setEditingMsgId(null); setAdminReply(''); }} className="absolute right-2 top-2 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">Annuler</button>
                    )}
                  </div>
                  <button type="submit" disabled={!adminReply.trim() && !attachment} className={`p-3 text-white rounded-full shadow-md transition-all hover:scale-105 active:scale-95 ${editingMsgId ? 'bg-green-600 hover:bg-green-700' : 'bg-black dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed'}`} title={editingMsgId ? "Enregistrer" : "Envoyer"}>
                    {editingMsgId ? <Check size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 bg-white dark:bg-black relative z-10">
              <div className="w-32 h-32 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Inbox size={64} strokeWidth={1} className="text-zinc-300 dark:text-zinc-700" />
              </div>
              <p className="font-bold text-xl text-zinc-900 dark:text-white mb-2">Vos messages</p>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8">Sélectionnez une conversation pour commencer</p>
              <button onClick={() => setIsNewMsgModalOpen(true)} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 transition-all font-bold shadow-lg shadow-zinc-200 dark:shadow-zinc-800 flex items-center gap-2">
                <Plus size={18} /> Nouvelle conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {isNewMsgModalOpen && (
        <AdminNewMsgModal
          onClose={() => setIsNewMsgModalOpen(false)}
          onSelectUser={(email) => { setSelectedEmail(email); setIsNewMsgModalOpen(false); }}
        />
      )}

      {confirmMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Confirmation</h3>
              <button onClick={() => setConfirmMsgId(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Supprimer ce message ?</p>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-2 justify-end bg-slate-50 dark:bg-slate-950">
              <button onClick={() => setConfirmMsgId(null)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-bold text-sm">Annuler</button>
              <button onClick={async () => { if (confirmMsgId) { await hardDeleteMessage(confirmMsgId); setConfirmMsgId(null); } }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-[1000] bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 w-56"
          style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 240) }}
          ref={msgMenuRef}
        >
          <button onClick={handleCopyMsg} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"><Copy size={16} /> Copie</button>
          <button onClick={handleReplyMsg} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"><Reply size={16} /> Répondre</button>
          {contextMenu.msg.senderRole === UserRole.ADMIN && (
            <button onClick={handleEditMsg} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"><Edit size={16} /> Modifier</button>
          )}
          <button onClick={handleDeleteMsg} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"><Trash2 size={16} /> Supprimer</button>
          <button onClick={() => { hardDeleteMessage(contextMenu.msg.id); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2"><Trash2 size={16} /> Supprimer définitivement</button>
          <button onClick={handleTogglePin} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"><Pin size={16} /> {contextMenu.msg.pinned ? 'Détacher' : 'Épingler'}</button>
          <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">Réagir</div>
          <div className="px-3 pb-2 flex flex-wrap gap-2">
            {['👍', '❤️', '✅', '❗', '🎉', '🤝'].map(e => (
              <button key={e} onClick={() => handleReact(e)} className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"><Smile size={14} className="inline-block mr-1" />{e}</button>
            ))}
          </div>
        </div>
      )}

      {convMenu && (
        <div
          className="fixed z-[1000] bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 w-56"
          style={{ top: convMenu.y, left: Math.min(convMenu.x, window.innerWidth - 240) }}
          ref={convMenuRef}
        >
          <button onClick={() => { markAsRead(convMenu.email); setConvMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"><CheckCheck size={16} /> Marquer comme lu</button>
        </div>
      )}
    </div>
  );
};
