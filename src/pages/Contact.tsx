
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Send, Mail, User, MessageSquare, MapPin, Phone, CheckCircle, Calendar, Copy, Check, AlertCircle } from 'lucide-react';
import { BookingSlot, BookingStatus, UserRole } from '../types';

export const Contact: React.FC = () => {
  const { sendMessage, addReservation, user, spaces, reservations } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const spaceId = searchParams.get('space');
  const space = spaces.find(s => s.id === spaceId);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    content: ''
  });

  // Quote specific fields
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteEndDate, setQuoteEndDate] = useState('');
  const [useCustomSlot, setUseCustomSlot] = useState(false);
  const [quoteSlot, setQuoteSlot] = useState<BookingSlot>(BookingSlot.FULL_DAY);
  const [customTime, setCustomTime] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Lazy load map
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShowMap(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Security Check: Redirect to login if requesting a quote (space param exists) but not logged in
  useEffect(() => {
    if (spaceId && !user) {
      navigate('/login');
    }
  }, [spaceId, user, navigate]);

  // Pre-fill data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }

    if (space) {
      setFormData(prev => ({
        ...prev,
        subject: `Demande de devis : ${space.name}`,
        content: `Bonjour,\n\nJe souhaite obtenir un devis pour l'espace "${space.name}".\n\nMon projet :\n[Décrivez votre activité ici...]`
      }));
    }
  }, [user, space]);

  const validateForm = () => {
    if (!formData.name.trim()) return "Le nom est requis.";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "L'email est invalide.";
    if (!formData.subject.trim()) return "Le sujet est requis.";
    if (!formData.content.trim()) return "Le message est requis.";
    if (space) {
      if (!quoteDate) return "La date de début est requise pour un devis.";
      if (useCustomSlot && !customTime.trim()) return "L'horaire spécifique est requis.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Reservation Record (as PENDING/QUOTE Request)
      // This feeds the calendar and admin dashboard
      if (space && user && quoteDate) {
        await addReservation({
          spaceId: space.id,
          userId: user.id,
          date: quoteDate,
          endDate: quoteEndDate || undefined,
          slot: quoteSlot,
          customTimeLabel: useCustomSlot ? customTime : undefined,
          isQuoteRequest: true, // Flag to indicate this started as a quote, ensures PENDING status even if autoApprove is on
        });
      }

      // 2. Send Message
      // We do NOT append the technical details (dates, slot) to the content, as requested.
      // The admin will see the linked reservation details in the system.
      await sendMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.content,
        senderRole: user ? user.role : UserRole.USER,
        type: space ? 'devis' : 'contact'
      });

      setSuccess(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setValidationError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const clearForm = () => {
    setFormData({ name: '', email: '', subject: '', content: '' });
    setQuoteDate('');
    setQuoteEndDate('');
    setUseCustomSlot(false);
    setQuoteSlot(BookingSlot.FULL_DAY);
    setCustomTime('');
    setConfirmClear(false);
    setValidationError(null);
  };

  if (success) {
    return (
      <div className="min-h-screen pt-32 pb-12 flex items-center justify-center px-4">
        <Helmet>
          <title>Contact & Devis - Maison de l'ESS</title>
        </Helmet>
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md border border-slate-100 animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Demande Envoyée !</h2>
          <p className="text-slate-500 mb-8">
            Votre demande de devis et pré-réservation a bien été transmise. Vous pouvez retrouver cette demande dans votre espace personnel.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Input Styles
  const inputClasses = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ess-500 focus:border-ess-500 outline-none transition-colors font-medium";
  const simpleInputClasses = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ess-500 focus:border-ess-500 outline-none transition-colors font-medium";
  const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";
  const icon = (name: string, cls = "material-symbols-outlined align-middle") => (<span className={cls}>{name}</span>);

  return (
    <div className="min-h-screen pt-32 pb-12 bg-grid-pattern">
      <Helmet>
        <title>Contact & Devis - Maison de l'ESS</title>
        <meta name="description" content="Contactez la Maison de l'ESS pour toute question ou demande de devis pour nos espaces de coworking et salles de réunion." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Contact & Devis</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Vous avez une question ou besoin d'un devis personnalisé ?
            <br />Remplissez le formulaire ci-dessous.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* Contact Info Side */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/20">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                {icon('location_on')} Nous trouver
              </h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                1 Av. du Général de Gaulle<br />
                95140 Garges-lès-Gonesse
              </p>

              {/* Google Maps Iframe with Lazy Loading */}
              <div ref={mapRef} className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-200 relative">
                {showMap ? (
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d778.5801782352996!2d2.3935409304331032!3d48.97592936645518!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66bccab80e723%3A0x34281a97dbf50604!2s1%20Av.%20du%20G%C3%A9n%C3%A9ral%20de%20Gaulle%2C%2095140%20Garges-l%C3%A8s-Gonesse!5e0!3m2!1sfr!2sfr!4v1763654865066!5m2!1sfr!2sfr"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps Location"
                    className="animate-fade-in"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    Chargement de la carte...
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl shadow-lg text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                {icon('call', 'material-symbols-outlined text-ess-400 align-middle')} Coordonnées
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      {icon('call')}
                    </div>
                    <span className="font-medium truncate">01 23 45 67 89</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('01 23 45 67 89', 'phone')}
                    className="p-2 shrink-0 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copier le numéro"
                  >
                    {copiedField === 'phone' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      {icon('mail')}
                    </div>
                    <span className="font-medium truncate">lafactory.garges@gmail.com</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('lafactory.garges@gmail.com', 'email')}
                    className="p-2 shrink-0 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copier l'email"
                  >
                    {copiedField === 'email' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-xl border border-white/20">

              {space && (
                <div className="bg-ess-50 border border-ess-100 p-4 rounded-xl mb-8 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg border border-ess-100 shadow-sm">
                    <img src={space.image} alt="" className="w-10 h-10 object-cover rounded-md" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ess-600 uppercase tracking-wider">Objet de la demande</div>
                    <div className="font-bold text-slate-900">Devis pour : {space.name}</div>
                  </div>
                </div>
              )}

              {validationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3 animate-fade-in">
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClasses}>Nom Complet</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className={inputClasses}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={inputClasses}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Quote Fields */}
              {space && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-ess-600" /> Souhaits de réservation
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className={labelClasses}>Date Début</label>
                      <input
                        type="date"
                        required
                        value={quoteDate}
                        onChange={e => setQuoteDate(e.target.value)}
                        className={simpleInputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Date Fin (Optionnel)</label>
                      <input
                        type="date"
                        value={quoteEndDate}
                        min={quoteDate}
                        onChange={e => setQuoteEndDate(e.target.value)}
                        className={simpleInputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Horaire / Créneau</label>

                    {/* Flexible Time Slot Customization */}
                    {useCustomSlot ? (
                      <input
                        type="text"
                        placeholder="Ex: 18h00 - 23h00"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className={simpleInputClasses}
                        required={useCustomSlot}
                      />
                    ) : (
                      <select
                        value={quoteSlot}
                        onChange={(e) => setQuoteSlot(e.target.value as BookingSlot)}
                        className={simpleInputClasses}
                      >
                        {Object.values(BookingSlot).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useCustomTimeQuote"
                        checked={useCustomSlot}
                        onChange={(e) => setUseCustomSlot(e.target.checked)}
                        className="w-4 h-4 text-ess-600 rounded border-slate-300 focus:ring-ess-500"
                      />
                      <label htmlFor="useCustomTimeQuote" className="text-xs text-slate-600 cursor-pointer select-none">
                        Je souhaite définir un horaire spécifique (ex: Soirée, événement...)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className={labelClasses}>Sujet</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className={simpleInputClasses}
                  placeholder="Sujet de votre message"
                />
              </div>

              <div className="mb-8">
                <label className={labelClasses}>Message / Précisions</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ess-500 focus:border-ess-500 outline-none transition-colors font-medium resize-none leading-relaxed`}
                    placeholder="Décrivez votre besoin..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 text-slate-600 hover:text-slate-900 font-semibold transition"
                >
                  {icon('arrow_back')} Annuler
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition flex items-center gap-2"
                >
                  {icon('delete')} Effacer
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-ess-600 hover:bg-ess-700 text-white rounded-xl font-semibold transition flex items-center gap-2"
                >
                  {icon('send')}
                  {isSubmitting ? 'Envoi...' : (space ? 'Envoyer la demande' : 'Envoyer le message')}
                </button>
              </div>

              {confirmClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmClear(false)}></div>
                  <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
                          {icon('report', 'material-symbols-outlined text-red-600 text-[24px]')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-black text-slate-900">Confirmer la suppression</h4>
                            <button onClick={() => setConfirmClear(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                              {icon('close')}
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">Voulez-vous effacer tous les champs du formulaire ? Cette action est définitive.</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-xl bg-black text-white hover:bg-slate-900 transition flex items-center gap-2">
                          {icon('undo')}
                          Annuler
                        </button>
                        <button onClick={clearForm} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2">
                          {icon('delete')}
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
