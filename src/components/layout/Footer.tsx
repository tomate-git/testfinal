
import React from 'react';
import { MapPin, Mail, Phone, Youtube, Instagram, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const TikTokIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export const Footer: React.FC = () => {
  const app = useApp() as any;
  const uiTheme = app?.uiTheme || {};
  return (
    <footer className="bg-slate-950 text-slate-400 font-sans">
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          
          {/* 1. Brand, Description & Social */}
          <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-4">
                  Maison de l'ESS
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Un tiers-lieu innovant dédié à la collaboration, à l'entrepreneuriat social et au développement durable au cœur de Garges-lès-Gonesse.
                </p>
            </div>
            
            <div className="flex gap-4 mt-4">
              <a href={uiTheme?.youtubeUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Youtube size={20} /></a>
              <a href={uiTheme?.instagramUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href={uiTheme?.tiktokUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><TikTokIcon size={20} /></a>
            </div>
          </div>

          {/* 2. Navigation - Centered Column */}
          <div className="flex flex-col md:items-center">
            <div className="w-fit">
                <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Navigation</h4>
                <ul className="space-y-3">
                  <li>
                      <Link to="/" className="flex items-center text-sm hover:text-white transition-colors group">
                        <ChevronRight size={14} className="mr-2 text-ess-600 group-hover:translate-x-1 transition-transform" />
                        Accueil
                      </Link>
                  </li>
                  <li>
                      <Link to="/catalog" className="flex items-center text-sm hover:text-white transition-colors group">
                        <ChevronRight size={14} className="mr-2 text-ess-600 group-hover:translate-x-1 transition-transform" />
                        Nos Espaces
                      </Link>
                  </li>
                  <li>
                      <Link to="/calendar" className="flex items-center text-sm hover:text-white transition-colors group">
                        <ChevronRight size={14} className="mr-2 text-ess-600 group-hover:translate-x-1 transition-transform" />
                        Calendrier
                      </Link>
                  </li>
                  <li>
                      <Link to="/contact" className="flex items-center text-sm hover:text-white transition-colors group">
                        <ChevronRight size={14} className="mr-2 text-ess-600 group-hover:translate-x-1 transition-transform" />
                        Contact
                      </Link>
                  </li>
                  <li>
                      <Link to="/login" className="flex items-center text-sm hover:text-white transition-colors group">
                        <ChevronRight size={14} className="mr-2 text-ess-600 group-hover:translate-x-1 transition-transform" />
                        Espace Membre
                      </Link>
                  </li>
                </ul>
            </div>
          </div>

          {/* 3. Contact (Right Side) */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Nous contacter</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 text-ess-600">
                    <MapPin size={18} />
                </div>
                <span className="text-sm">1 Av. du Général de Gaulle,<br/>95140 Garges-lès-Gonesse</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-ess-600">
                    <Phone size={18} />
                </div>
                <span className="text-sm">01 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-ess-600">
                    <Mail size={18} />
                </div>
                <span className="text-sm">lafactory.garges@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Maison de l'ESS. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-600 hover:text-white transition-colors">Mentions Légales</a>
            <a href="#" className="text-xs text-slate-600 hover:text-white transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
