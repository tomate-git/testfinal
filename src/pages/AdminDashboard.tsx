

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Reservation, User, BookingStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
const AdminOverviewLazy = React.lazy(() => import('../components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminCalendarLazy = React.lazy(() => import('../components/admin/AdminCalendar').then(m => ({ default: m.AdminCalendar })));
const AdminMessagesLazy = React.lazy(() => import('../components/admin/AdminMessages').then(m => ({ default: m.AdminMessages })));
const AdminContactsLazy = React.lazy(() => import('../components/admin/AdminContacts').then(m => ({ default: m.AdminContacts })));
const AdminBookingsLazy = React.lazy(() => import('../components/admin/AdminBookings').then(m => ({ default: m.AdminBookings })));
const AdminSpacesLazy = React.lazy(() => import('../components/admin/AdminSpaces').then(m => ({ default: m.AdminSpaces })));
const AdminEventsLazy = React.lazy(() => import('../components/admin/AdminEvents').then(m => ({ default: m.AdminEvents })));
const AdminMailLazy = React.lazy(() => import('../components/admin/AdminMail').then(m => ({ default: m.AdminMail })));
const AdminUserModalLazy = React.lazy(() => import('../components/admin/modals/AdminUserModal').then(m => ({ default: m.AdminUserModal })));
const AdminReservationModalLazy = React.lazy(() => import('../components/admin/modals/AdminReservationModal').then(m => ({ default: m.AdminReservationModal })));
const AdminScannerModalLazy = React.lazy(() => import('../components/admin/modals/AdminScannerModal').then(m => ({ default: m.AdminScannerModal })));
import { Sun, Moon, Bell, MessageSquare, Calendar, X, LayoutDashboard, Check, Building, Inbox, Users, QrCode } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, reservations, messages, theme, toggleTheme, spaces, refreshData } = useApp();
  const navigate = useNavigate();
  const isAccueil = String(user?.role) === 'ACCUEIL';
  const [activeTab, setActiveTab] = useState<'overview' | 'customisation' | 'bookings' | 'spaces' | 'events' | 'calendar' | 'contacts' | 'messages' | 'mails'>(isAccueil ? 'bookings' : 'overview');

  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Notification Panel State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Shared States for Modals
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { refreshData(true); }, 200);
    return () => clearTimeout(t);
  }, [refreshData]);

  // Calculate Notifications
  const notifications = useMemo(() => {
    const pendingRes = reservations
      .filter(r => r.status === BookingStatus.PENDING)
      .map(r => ({
        type: 'booking',
        id: r.id,
        date: r.createdAt,
        title: 'Nouvelle réservation',
        subtitle: spaces.find(s => s.id === r.spaceId)?.name || 'Espace inconnu',
        data: r
      }));

    const unreadMsgs = messages
      .filter(m => !m.read && m.senderRole === UserRole.USER)
      .map(m => ({
        type: 'message',
        id: m.id,
        date: m.date,
        title: 'Nouveau message',
        subtitle: m.name,
        data: m
      }));

    return [...pendingRes, ...unreadMsgs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations, messages, spaces]);

  const pendingBookingsCount = reservations.filter(r => r.status === 'PENDING').length;
  const unreadMessagesCount = messages.filter(m => !m.read && m.senderRole === UserRole.USER).length;

  const handleNotificationClick = (notif: any) => {
    if (notif.type === 'booking') {
      setActiveTab('bookings');
    } else if (notif.type === 'message') {
      setActiveTab('messages');
      if (notif.data.email) setSelectedEmail(notif.data.email);
    }
    setIsNotificationsOpen(false);
  };

  if (!user || (user.role !== UserRole.ADMIN && String(user.role) !== 'ACCUEIL')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold mb-2">Accès Refusé</h2>
          <p className="text-slate-500 mb-4">Vous n'avez pas les droits d'administration.</p>
          <button onClick={() => navigate('/login')} className="text-ess-600 font-bold hover:underline">Se connecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-[#0B1120] relative transition-colors duration-300">

      {/* RESTORED DOT GRID PATTERN */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0"
          style={{
            backgroundImage: theme === 'dark'
              ? 'radial-gradient(#334155 1.5px, transparent 1.5px)'
              : 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            opacity: theme === 'dark' ? 0.3 : 0.6
          }}
        ></div>
      </div>

        <div className="hidden md:block">
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            pendingBookingsCount={pendingBookingsCount}
            unreadMessagesCount={unreadMessagesCount}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        <header className="h-14 md:h-20 px-4 md:px-8 flex items-center justify-between shrink-0 z-20 sticky top-0 transition-all duration-300">
          <div className="absolute inset-0 bg-white/70 dark:bg-[#0B1120]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"></div>

          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-black tracking-tight capitalize text-slate-900 dark:text-white">
              {activeTab === 'overview' ? "Vue d'ensemble" :
                activeTab === 'customisation' ? "Personnalisation" :
                activeTab === 'bookings' ? "Réservations" :
                  activeTab === 'spaces' ? "Espaces" :
                    activeTab === 'events' ? "Événements" :
                      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="hidden md:block text-xs font-medium text-slate-500 dark:text-slate-400">
              Bienvenue sur votre tableau de bord
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2.5 rounded-full transition-all border shadow-sm relative ${isNotificationsOpen ? 'bg-white dark:bg-slate-800 text-ess-600 dark:text-ess-400 border-slate-300 dark:border-slate-600' : 'bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 hover:text-ess-600 dark:hover:text-ess-400'}`}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-900"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  {/* Mobile full-screen sheet */}
                  <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsNotificationsOpen(false)}></div>
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-none shadow-2xl border-none overflow-hidden animate-fade-in-up">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                        <button onClick={() => setIsNotificationsOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="h-[calc(100vh-56px)] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">Aucune nouvelle notification.</div>
                        ) : (
                          notifications.map((notif, idx) => (
                            <button
                              key={`${notif.type}-${notif.id}-${idx}`}
                              onClick={() => handleNotificationClick(notif)}
                              className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors flex gap-3 items-start group"
                            >
                              <div className={`p-2 rounded-full shrink-0 ${notif.type === 'booking' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                                {notif.type === 'booking' ? <Calendar size={16} /> : <MessageSquare size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-ess-600 dark:group-hover:text-ess-400 transition-colors">{notif.title}</span>
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{notif.subtitle}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Desktop dropdown */}
                  <div className="hidden md:block absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in-up origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                      <span className="text-xs font-bold bg-ess-100 dark:bg-ess-900/30 text-ess-700 dark:text-ess-400 px-2 py-0.5 rounded-full">{notifications.length}</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">Aucune nouvelle notification.</div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <button
                            key={`${notif.type}-${notif.id}-${idx}`}
                            onClick={() => handleNotificationClick(notif)}
                            className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors flex gap-3 items-start group"
                          >
                            <div className={`p-2 rounded-full shrink-0 ${notif.type === 'booking' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                              {notif.type === 'booking' ? <Calendar size={16} /> : <MessageSquare size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-ess-600 dark:group-hover:text-ess-400 transition-colors">{notif.title}</span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{notif.subtitle}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
                        <button onClick={() => setIsNotificationsOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition">Fermer</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Toggle Theme */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white/50 dark:bg-white/5 text-slate-600 dark:text-yellow-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-200/50 dark:border-white/10 shadow-sm"
              title="Changer de thème"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-0 custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {!isAccueil && activeTab === 'overview' && (
              <React.Suspense fallback={<div />}> <AdminOverviewLazy /> </React.Suspense>
            )}
            {activeTab === 'customisation' && (
              <React.Suspense fallback={<div />}> <AdminOverviewLazy mode="customisation" /> </React.Suspense>
            )}
            {!isAccueil && activeTab === 'calendar' && (
              <React.Suspense fallback={<div />}> <AdminCalendarLazy setSelectedReservation={setSelectedReservation} /> </React.Suspense>
            )}
            {activeTab === 'bookings' && (
              <React.Suspense fallback={<div />}> <AdminBookingsLazy setViewUser={setViewUser} /> </React.Suspense>
            )}
            {!isAccueil && activeTab === 'spaces' && (
              <React.Suspense fallback={<div />}> <AdminSpacesLazy setIsSidebarCollapsed={setIsSidebarCollapsed} /> </React.Suspense>
            )}
            {!isAccueil && activeTab === 'events' && (
              <React.Suspense fallback={<div />}> <AdminEventsLazy /> </React.Suspense>
            )}
            {!isAccueil && activeTab === 'contacts' && (
              <React.Suspense fallback={<div />}> <AdminContactsLazy setActiveTab={setActiveTab} setSelectedEmail={setSelectedEmail} /> </React.Suspense>
            )}
            {!isAccueil && activeTab === 'messages' && (
              <React.Suspense fallback={<div />}> <AdminMessagesLazy initialSelectedEmail={selectedEmail} /> </React.Suspense>
            )}
            {!isAccueil && activeTab === 'mails' && (
              <React.Suspense fallback={<div />}> <AdminMailLazy /> </React.Suspense>
            )}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
          <div className={`grid ${isAccueil ? 'grid-cols-2' : 'grid-cols-5'} gap-1 px-2 py-1`}>
            {!isAccueil && (
              <>
                <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center justify-center py-2 rounded-lg ${activeTab === 'overview' ? 'text-ess-600 dark:text-ess-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <LayoutDashboard size={18} />
                  <span className="text-[10px] font-bold">Vue</span>
                </button>
                <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center justify-center py-2 rounded-lg ${activeTab === 'calendar' ? 'text-ess-600 dark:text-ess-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Calendar size={18} />
                  <span className="text-[10px] font-bold">Agenda</span>
                </button>
              </>
            )}
            <button onClick={() => setIsScannerOpen(true)} className="flex flex-col items-center justify-center py-2 rounded-lg text-ess-600 dark:text-ess-400">
              <QrCode size={20} />
              <span className="text-[10px] font-bold">Scan</span>
            </button>
            <button onClick={() => setActiveTab('bookings')} className={`flex flex-col items-center justify-center py-2 rounded-lg ${activeTab === 'bookings' ? 'text-ess-600 dark:text-ess-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <Check size={18} />
              <span className="text-[10px] font-bold">Réserv.</span>
            </button>
            {!isAccueil && (
              <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center justify-center py-2 rounded-lg ${activeTab === 'messages' ? 'text-ess-600 dark:text-ess-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <Inbox size={18} />
                <span className="text-[10px] font-bold">Msgs</span>
              </button>
            )}
          </div>
        </nav>

        {/* Global Modals */}
        {viewUser && (
          <React.Suspense fallback={<div />}>
            <AdminUserModalLazy
              user={viewUser}
              onClose={() => setViewUser(null)}
              onContact={(email) => { setViewUser(null); setSelectedEmail(email); setActiveTab('messages'); }}
            />
          </React.Suspense>
        )}

        {selectedReservation && (
          <React.Suspense fallback={<div />}>
            <AdminReservationModalLazy
              reservation={selectedReservation}
              onClose={() => setSelectedReservation(null)}
            />
          </React.Suspense>
        )}

        {isScannerOpen && (
          <React.Suspense fallback={<div />}>
            <AdminScannerModalLazy onClose={() => setIsScannerOpen(false)} />
          </React.Suspense>
        )}

      </div>
    </div>
  );
};
