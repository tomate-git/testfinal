import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Menu, X, User as UserIcon, LogOut, Youtube, Instagram } from 'lucide-react';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const app = useApp() as any;
  const { user, logout, notifications } = app;
  const uiTheme = app?.uiTheme || {};
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const TikTokIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );

  const isActive = (path: string) => location.pathname === path
    ? 'font-bold shadow-md'
    : 'text-blue-100 hover:bg-white/10';

  const activeStyle = (path: string): React.CSSProperties => (
    location.pathname === path
      ? { backgroundColor: uiTheme?.brandAccent ?? '#facc15', color: '#0B1120', boxShadow: `0 0 0 1px ${(uiTheme?.brandAccent ?? '#facc15')}33` }
      : {}
  );

  // Calculate unread notifications for the current user
  const unreadCount = user
    ? notifications.filter(n => n.userId === user.id && !n.read).length
    : 0;

  return (
    <div className="flex justify-center w-full pt-6 px-4 relative z-[100]">
      <nav className="w-full max-w-6xl backdrop-blur-xl border rounded-2xl shadow-lg transition-all duration-300" style={{ backgroundColor: uiTheme?.brandBg ?? '#0B1120', borderColor: uiTheme?.brandAccent ?? '#facc15' }}>
        <div className="px-6">
          <div className="flex justify-between h-20 md:h-24 relative">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3">
                <span className="text-white font-black text-lg md:text-xl tracking-tight">Maison de l'ESS</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              <Link to="/" className={`px-5 py-2.5 rounded-full text-sm transition-all duration-300 ${isActive('/')}`} style={activeStyle('/')}>Accueil</Link>
              <Link to="/catalog" className={`px-5 py-2.5 rounded-full text-sm transition-all duration-300 ${isActive('/catalog')}`} style={activeStyle('/catalog')}>Espaces</Link>
              <Link to="/calendar" className={`px-5 py-2.5 rounded-full text-sm transition-all duration-300 ${isActive('/calendar')}`} style={activeStyle('/calendar')}>Calendrier</Link>
              <Link to="/contact" className={`px-5 py-2.5 rounded-full text-sm transition-all duration-300 ${isActive('/contact')}`} style={activeStyle('/contact')}>Contact</Link>
              <div className="ml-2 pl-2 border-l border-blue-700 flex items-center gap-3 text-blue-100">
                <a href={(uiTheme?.youtubeUrl || '').trim() || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors" title="YouTube">
                  <Youtube size={18} />
                </a>
                <a href={(uiTheme?.instagramUrl || '').trim() || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors" title="Instagram">
                  <Instagram size={18} />
                </a>
                <a href={(uiTheme?.tiktokUrl || '').trim() || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors" title="TikTok">
                  <TikTokIcon />
                </a>
              </div>

              {user ? (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-blue-700">
                  <Link
                    to={user.role === UserRole.ADMIN || String(user.role) === 'ACCUEIL' ? "/admin" : "/profile"}
                    className="flex items-center gap-2 text-xs font-bold text-blue-100 bg-blue-800/50 px-4 py-2.5 rounded-full hover:bg-blue-700 transition relative group border border-blue-700"
                  >
                    <UserIcon size={16} />
                    {user.role === UserRole.ADMIN ? 'Admin' : String(user.role) === 'ACCUEIL' ? 'Accueil' : 'Mon Compte'}

                    {/* Notification Badge */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border border-blue-900 shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <button onClick={() => { logout(); navigate('/login'); }} className="text-blue-300 hover:text-red-400 transition p-2">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="ml-4 px-6 py-3 rounded-full text-xs font-black transition shadow-lg" style={{ backgroundColor: uiTheme?.brandAccent ?? '#facc15', color: uiTheme?.brandBg ?? '#0B1120' }}>
                  Connexion
                </Link>
              )}
            </div>

            {/* Mobile button */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="text-blue-100 hover:text-yellow-400 p-2 relative">
                {isOpen ? <X size={28} /> : <Menu size={28} />}
                {unreadCount > 0 && !isOpen && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-blue-900"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden rounded-b-2xl text-white animate-fade-in-up" style={{ backgroundColor: uiTheme?.brandBg ?? '#0B1120', borderTopColor: uiTheme?.brandBg ?? '#0B1120', borderTopWidth: 1, borderStyle: 'solid' }}>
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:text-yellow-400 hover:bg-blue-800">Accueil</Link>
              <Link to="/catalog" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:text-yellow-400 hover:bg-blue-800">Espaces</Link>
              <Link to="/calendar" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:text-yellow-400 hover:bg-blue-800">Calendrier</Link>
              {user ? (
                <>
                  <Link to={user.role === UserRole.ADMIN || String(user.role) === 'ACCUEIL' ? "/admin" : "/profile"} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium mt-4 flex justify-between items-center" style={{ color: uiTheme?.brandAccent ?? '#facc15', backgroundColor: uiTheme?.brandBg ?? '#0B1120' }}>
                    {user.role === UserRole.ADMIN ? 'Tableau de bord' : String(user.role) === 'ACCUEIL' ? 'Accueil' : 'Mon Profil'}
                    {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                  </Link>
                  <button onClick={() => { logout(); setIsOpen(false); navigate('/login'); }} className="block w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:bg-blue-800">
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="block mt-4 text-center px-3 py-3 rounded-xl text-base font-bold" style={{ color: uiTheme?.brandBg ?? '#0B1120', backgroundColor: uiTheme?.brandAccent ?? '#facc15' }}>Connexion</Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};
