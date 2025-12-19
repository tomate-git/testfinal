import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  Clock,
  ArrowUpRight,
  X,
  Check,
  ArrowUp,
  Download,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Space, AppEvent } from '../types';

export const Home: React.FC = () => {
  const { spaces, events, user } = useApp();
  const navigate = useNavigate();
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  // 1. Filter Real Upcoming Events
  const upcomingEvents = events
    .filter(e => {
      const eventDate = new Date(e.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase();
    return `${day} ${month}`;
  };

  const formatPriceLabel = (pricing: Space['pricing']) => {
    if (pricing.isQuote) return 'Sur devis';
    const currency = pricing.currency || '€';
    if (pricing.halfDay !== undefined && pricing.halfDay !== null) return `${pricing.halfDay}${currency} / demi-journée`;
    if (pricing.day !== undefined && pricing.day !== null) {
      if (pricing.day === 0) return 'Gratuit';
      return `${pricing.day}${currency} / jour`;
    }
    if (pricing.month !== undefined && pricing.month !== null) return `${pricing.month}${currency} / mois`;
    return 'Gratuit';
  };

  // 2. Filter unique spaces for gallery
  const uniqueSpaces = spaces.reduce((acc, current) => {
    if (current.showInCalendar === false) return acc;
    const baseName = current.name.includes('N°') ? current.name.split('N°')[0].trim() : current.name;
    if (!acc.find(s => (s.name.includes('N°') ? s.name.split('N°')[0].trim() : s.name) === baseName)) {
      acc.push(current);
    }
    return acc;
  }, [] as Space[]);

  const handleModalAction = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (selectedSpace?.pricing.isQuote) {
      navigate(`/contact?space=${selectedSpace.id}`);
      return;
    }

    if (selectedSpace) {
      navigate(`/booking/${selectedSpace.id}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col"
    >
      <Helmet>
        <title>Maison de l'ESS - Coworking & Événements à Garges</title>
        <meta name="description" content="Découvrez la Maison de l'ESS à Garges-lès-Gonesse. Espaces de coworking, studios, salles de réunion et événements dédiés à l'économie sociale et solidaire." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center pt-24 pb-12">
        {/* Background Animation Elements */}
        <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/2 w-[100vw] h-[100vw] rounded-full bg-gradient-to-br from-ess-100/40 to-purple-100/40 blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-16 w-full">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center md:text-left z-10"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-8 leading-tight text-slate-900">
              Innover. <br />
              Collaborer. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ess-600 to-purple-600">Entreprendre.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto md:mx-0 font-normal leading-relaxed">
              La Maison de l'ESS vous propose des espaces flexibles. Du studio podcast au conteneur bureau, trouvez votre place au cœur de l'innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/catalog" className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold transition flex items-center justify-center gap-2 shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-1" aria-label="Voir le catalogue des espaces">
                Voir les espaces <ArrowRight size={18} className="text-slate-900" />
              </Link>
              <Link to="/contact" className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold transition hover:bg-slate-800 shadow-lg shadow-slate-900/20 hover:-translate-y-1" aria-label="Nous contacter">
                Nous contacter
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              Nos Espaces
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Découvrez les lieux</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-[300px]">
            {uniqueSpaces.map((space, idx) => (
              <motion.div
                key={space.id}
                onClick={() => setSelectedSpace(space)}
                className={`group relative overflow-hidden rounded-3xl cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border border-white ${idx === 0 || idx === 3 ? 'lg:col-span-2' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Voir les détails de l'espace ${space.name}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedSpace(space); }}
              >
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors z-10"></div>
                <img
                  src={space.image}
                  alt={space.name}
                  loading="lazy"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2 block opacity-0 group-hover:opacity-100 transition-opacity">{space.category}</span>
                      <h3 className="text-2xl font-bold text-white">{space.name.includes('N°') ? space.name.split('N°')[0].trim() : space.name}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg">
                      <ArrowUpRight size={24} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Timeline Section */}
      <section className="pt-24 pb-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-20">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-900 shadow-sm">
                <Calendar size={28} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Prochains Événements</h3>
                <p className="text-slate-500 font-medium">L'actualité de la Maison de l'ESS</p>
              </div>
            </div>
            <Link to="/calendar" className="text-slate-900 hover:text-ess-600 font-bold flex items-center gap-2 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:shadow-md" aria-label="Voir tout l'agenda">
              Voir tout l'agenda <ArrowRight size={16} />
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="relative mt-24 md:mt-32 md:h-[500px]">
              {/* Timeline Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-slate-200 via-ess-200 to-slate-200 -translate-y-1/2 z-0"></div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10 md:h-full">
                {upcomingEvents.map((evt, idx) => {
                  const hasImage = !!evt.eventImage;
                  const date = new Date(evt.date);
                  const day = date.getDate();
                  const month = date.toLocaleString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '');

                  return (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      className="group relative flex flex-col items-center h-full"
                    >
                      {/* Timeline Dot */}
                      <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20">
                        <div className="w-4 h-4 rounded-full bg-white border-4 border-slate-300 group-hover:border-ess-500 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      </div>

                      {/* Card Container - Alternating Top/Bottom for visual interest could be cool, but let's stick to centered for now for consistency, 
                          OR push them up to sit ON the line. Let's try floating ABOVE the line. */}

                      <div className="hidden md:block absolute left-1/2 bottom-[calc(50%+24px)] -translate-x-1/2 w-28 lg:w-44 xl:w-56 perspective-1000">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-ess-500/20 transition-all duration-500 transform group-hover:-translate-y-2 group-hover:rotate-1 bg-white border border-slate-100 relative"
                        >
                          {hasImage ? (
                            <>
                              <img src={evt.eventImage} alt={evt.eventName} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 text-left transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-white font-bold text-xs lg:text-base xl:text-lg leading-tight line-clamp-2">{evt.eventName}</p>
                                <p className="text-ess-300 text-[10px] lg:text-xs font-bold mt-1 uppercase tracking-wider">{evt.customTimeLabel || 'Événement'}</p>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full p-3 lg:p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-ess-50 group-hover:to-white transition-colors">
                              <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 lg:mb-4 text-ess-600 group-hover:scale-110 transition-transform">
                                <Calendar size={16} className="lg:hidden" />
                                <Calendar size={24} className="hidden lg:block" />
                              </div>
                              <h4 className="text-slate-900 font-bold text-xs lg:text-lg leading-tight mb-1 lg:mb-2 line-clamp-3">{evt.eventName}</h4>
                              <span className="text-slate-500 text-[10px] lg:text-xs font-medium">{evt.customTimeLabel}</span>
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Date Label (Below Line) */}
                      <div className="hidden md:flex absolute top-[calc(50%+24px)] left-1/2 -translate-x-1/2 flex-col items-center">
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-slate-200 group-hover:text-ess-600 transition-colors duration-300">{day}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{month}</span>
                        </div>
                      </div>

                      {/* Mobile Card (Standard List) */}
                      <div className="md:hidden w-full">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                        >
                          {hasImage && (
                            <div className="h-40 w-full relative overflow-hidden">
                              <img src={evt.eventImage} alt={evt.eventName} className="w-full h-full object-cover" />
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-slate-900 shadow-sm">
                                {day} {month}
                              </div>
                            </div>
                          )}
                          <div className="p-5 text-left">
                            {!hasImage && (
                              <div className="text-xs font-bold text-ess-600 uppercase tracking-wider mb-1">{day} {month}</div>
                            )}
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{evt.eventName}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2">{evt.eventDescription || "Aucune description disponible."}</p>
                          </div>
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-12 p-12 bg-slate-50 rounded-3xl border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                  <Calendar size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Aucun événement pour le moment</h4>
                <p className="text-slate-500 max-w-md mx-auto">Notre agenda est en cours de mise à jour. Revenez vite pour découvrir nos prochaines activités !</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Space Detail Modal */}
      {selectedSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/50 ring-1 ring-slate-900/5">
            <div className="w-full md:w-1/2 relative h-64 md:h-auto bg-slate-100 group">
              <img src={selectedSpace.image} alt={selectedSpace.name} className="w-full h-full object-cover" />
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-slate-900 uppercase tracking-wider shadow-lg">
                {selectedSpace.category}
              </div>

              {/* Brochure / Details Overlay */}
              {selectedSpace.brochureUrl && (
                <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Download Button */}
                  <a
                    href={selectedSpace.brochureUrl}
                    download={selectedSpace.brochureName || "brochure"}
                    target="_blank" rel="noopener noreferrer"
                    className="p-3 rounded-full bg-white/90 backdrop-blur text-slate-900 hover:bg-white shadow-lg transition-all hover:scale-110"
                    aria-label="Télécharger la brochure"
                  >
                    <Download size={18} />
                  </a>
                  {/* External Link Button */}
                  <a
                    href={selectedSpace.brochureUrl}
                    target="_blank" rel="noopener noreferrer"
                    className="p-3 rounded-full bg-white/90 backdrop-blur text-slate-900 hover:bg-white shadow-lg transition-all hover:scale-110"
                    aria-label="Voir la brochure en ligne"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{selectedSpace.name.includes('N°') ? selectedSpace.name.split('N°')[0].trim() : selectedSpace.name}</h3>
                  <p className="text-slate-500 font-medium">{selectedSpace.category}</p>
                </div>
                <button
                  onClick={() => setSelectedSpace(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-slate-600 mb-6 leading-relaxed flex-1">{selectedSpace.description}</p>

              {selectedSpace.features && selectedSpace.features.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Équipements</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSpace.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-600">
                        <Check size={16} className="text-ess-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  {!selectedSpace.pricing.isQuote && (
                    <div className="text-2xl font-black text-slate-900">
                      {formatPriceLabel(selectedSpace.pricing)}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleModalAction}
                  className="w-full px-8 py-4 rounded-xl bg-slate-900 text-white font-bold transition hover:bg-slate-800 shadow-lg shadow-slate-900/20 hover:-translate-y-1"
                >
                  {user ? (selectedSpace.pricing.isQuote ? 'Demander un devis' : 'Réserver cet espace') : 'Se connecter pour réserver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/50 ring-1 ring-slate-900/5 flex flex-col max-h-[90vh]">

            {selectedEvent.eventImage && (
              <div className="w-full h-64 sm:h-80 bg-slate-100 relative shrink-0">
                <img src={selectedEvent.eventImage} alt={selectedEvent.eventName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors border border-white/20"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1">{selectedEvent.eventName}</h3>
                  <div className="flex items-center gap-2 text-xs text-ess-600 font-bold uppercase tracking-wider bg-ess-50 px-2 py-1 rounded w-fit">
                    <Clock size={12} /> {selectedEvent.customTimeLabel || 'Toute la journée'}
                  </div>
                </div>
                {!selectedEvent.eventImage && (
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                    aria-label="Fermer"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const start = new Date(selectedEvent.date);
                  const end = selectedEvent.endDate ? new Date(selectedEvent.endDate) : null;
                  const month = start.toLocaleString('fr-FR', { month: 'short' }).toUpperCase();
                  const day = start.getDate();
                  const monthEnd = end ? end.toLocaleString('fr-FR', { month: 'short' }).toUpperCase() : null;
                  const dayEnd = end ? end.getDate() : null;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">{month}</div>
                        <div className="text-xl font-black text-slate-900 leading-none">{day}</div>
                      </div>
                      {end && (
                        <>
                          <div className="text-slate-300">-</div>
                          <div className="text-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">{monthEnd}</div>
                            <div className="text-xl font-black text-slate-900 leading-none">{dayEnd}</div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {selectedEvent.eventDescription && (
                <p className="text-slate-600 leading-relaxed">{selectedEvent.eventDescription}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 p-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all hover:scale-110 z-40"
        aria-label="Retour en haut de page"
      >
        <ArrowUp size={20} />
      </button>
    </motion.div>
  );
};

export default Home;
