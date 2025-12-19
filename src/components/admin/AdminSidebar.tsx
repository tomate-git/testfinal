import React from 'react';
import { LayoutDashboard, Calendar, Users, Check, Building, Inbox, ChevronLeft, Globe, LogOut, QrCode, Megaphone, Mail, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  pendingBookingsCount: number;
  unreadMessagesCount: number;
  onOpenScanner?: () => void; // Optional prop to trigger scanner
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  pendingBookingsCount,
  unreadMessagesCount,
  onOpenScanner
}) => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: "Vue d'ensemble" },
    { id: 'customisation', icon: Palette, label: "Personnalisation" },
    { id: 'calendar', icon: Calendar, label: "Calendrier" },
    { id: 'bookings', icon: Check, label: "Réservations", count: pendingBookingsCount > 0 ? pendingBookingsCount : undefined },
    { id: 'spaces', icon: Building, label: "Espaces" },
    { id: 'events', icon: Megaphone, label: "Événements" },
    { id: 'messages', icon: Inbox, label: "Messagerie", count: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'mails', icon: Mail, label: "Mails" },
    { id: 'contacts', icon: Users, label: "Utilisateurs" },
  ];

  return (
    <aside
      className={`${isSidebarCollapsed ? 'w-24' : 'w-72'} h-screen flex-shrink-0 relative z-30 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] border-r border-slate-800 shadow-2xl`}
    >
      {/* BACKGROUND: Always Dark (Black) + Dot Pattern */}
      <div className="absolute inset-0 bg-[#0B1120] z-0"></div>
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      ></div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col h-full text-slate-300">

        {/* Header / Logo - Modified: Removed M Circle */}
        <div className={`h-24 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-6'} transition-all duration-300 border-b border-white/5`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`transition-all duration-300 whitespace-nowrap flex flex-col ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'w-auto opacity-100'}`}>
              <span className="font-bold text-white text-xl leading-none tracking-tight">Maison ESS</span>
              <span className="text-[10px] font-bold text-ess-500 uppercase tracking-widest mt-1">Administration</span>
            </div>
            {/* Icon Only Mode */}
            {isSidebarCollapsed && (
              <span className="font-black text-white text-lg tracking-tighter">ESS</span>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-slate-800 text-slate-400 hover:text-white border border-slate-600 rounded-full flex items-center justify-center shadow-md transition-all z-50 hover:scale-110"
        >
          <ChevronLeft size={14} className={`transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Scan Button - Prominent */}
        <div className={`px-4 py-4 border-b border-white/5 ${isSidebarCollapsed ? 'flex justify-center px-0' : ''}`}>
          <button
            onClick={onOpenScanner}
            className={`flex items-center justify-center gap-3 bg-ess-600 hover:bg-ess-500 text-white rounded-xl transition-all shadow-lg shadow-ess-600/20 group ${isSidebarCollapsed ? 'w-12 h-12 p-0' : 'w-full px-4 py-3'}`}
            title="Scanner QR Code"
          >
            <QrCode size={20} className="group-hover:scale-110 transition-transform" />
            {!isSidebarCollapsed && <span className="font-bold">Scan Check-in</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex items-center relative rounded-xl transition-all duration-300 border ${isActive
                  ? 'bg-white/10 border-white/10 text-white shadow-lg shadow-black/20'
                  : 'border-transparent hover:bg-white/5 text-slate-400 hover:text-white'
                  } ${isSidebarCollapsed ? 'w-12 h-12 justify-center mx-auto px-0' : 'w-full px-4 gap-3 min-h-[50px]'}`}
              >
                {/* Active Indicator Dot - Only visible when NOT collapsed */}
                {isActive && !isSidebarCollapsed && (
                  <div className="absolute left-2 w-1 h-5 bg-ess-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                )}

                <div className={`relative transition-all duration-300 flex items-center justify-center ${isActive ? 'text-ess-400' : ''} ${!isSidebarCollapsed && isActive ? 'ml-2' : ''}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`${!isActive && 'group-hover:scale-110 transition-transform'}`} />
                  {isSidebarCollapsed && item.count && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-[#0B1120]">
                      {item.count}
                    </span>
                  )}
                </div>

                <div className={`flex-1 flex items-center justify-between transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0 -translate-x-4 hidden' : 'w-auto opacity-100 translate-x-0'}`}>
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                  {item.count && (
                    <span className="px-2 py-0.5 bg-ess-900/50 text-ess-300 border border-ess-500/20 text-[10px] font-bold rounded-md">
                      {item.count}
                    </span>
                  )}
                </div>

                {/* Tooltip for Collapsed State */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0 duration-300 border border-slate-700">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm mt-auto">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'} transition-all duration-300`}>

            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 shadow-md shrink-0">
                {user?.firstName?.[0]}
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <div className="text-sm font-bold text-white truncate max-w-[120px]">{user?.firstName}</div>
                <div className="text-[10px] font-medium text-ess-400 truncate flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> En ligne
                </div>
              </div>
            </div>

            {isSidebarCollapsed ? (
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 rounded-xl shadow-sm transition hover:scale-110 border border-slate-700"
                title="Retour au site"
              >
                <Globe size={18} />
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                  title="Voir le site public"
                >
                  <Globe size={18} />
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
