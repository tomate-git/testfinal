

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, User as UserIcon, Phone, Building, Briefcase, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserType, UserRole } from '../types';
import { api } from '../data/api';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, register } = useApp();

    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Common fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Registration fields
    const [userType, setUserType] = useState<UserType>(UserType.INDIVIDUAL);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [siret, setSiret] = useState('');

    // Phone number validation function (French format: 10 digits)
    const validatePhoneNumber = (phone: string): boolean => {
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, '');
        // French phone numbers should be exactly 10 digits
        return digitsOnly.length === 10;
    };

    // Format phone number for display
    const formatPhoneNumber = (phone: string): string => {
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length <= 2) return digitsOnly;
        if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
        if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4)}`;
        if (digitsOnly.length <= 8) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6)}`;
        return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6, 8)} ${digitsOnly.slice(8, 10)}`;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                // Validate phone number
                if (!validatePhoneNumber(phone)) {
                    throw new Error("Le numéro de téléphone doit contenir exactement 10 chiffres.");
                }

                const newUser = {
                    id: 'u-' + Date.now(),
                    email,
                    password,
                    role: UserRole.USER,
                    type: userType,
                    firstName,
                    lastName,
                    phone: phone.replace(/\D/g, ''), // Store only digits
                    ...(userType === UserType.COMPANY ? { companyName, siret } : {})
                };

                const err = await register(newUser);
                if (err) throw new Error(err);
                navigate('/profile');
            } else {
                const err = await login(email, password);
                if (err) throw new Error(err);

                // Vérifier le rôle depuis l'API pour décider la redirection
                const currentUser = await api.users.getByEmail(email);
                if (currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.ACCUEIL)) {
                    navigate('/admin');
                } else {
                    navigate('/profile');
                }
            }
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    // Styled Component Classes
    const inputContainerClass = "relative group";
    const iconClass = "absolute left-4 top-[42px] transform -translate-y-1/2 text-slate-400 group-focus-within:text-ess-600 transition-colors z-10";
    const inputClass = "w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 pl-12 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-ess-500/20 focus:border-ess-500 outline-none transition-all placeholder:text-slate-400 shadow-sm group-hover:border-slate-300 mt-1";
    const labelClass = "block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 ml-1";

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side - Modern Artistic Background */}
            <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden">
                {/* Abstract shapes / gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-ess-900 via-slate-900 to-slate-950"></div>
                <div className="absolute inset-0 bg-[url('/galerie/coworking.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>

                {/* Animated Circles */}
                <div className="absolute top-1/4 -right-20 w-96 h-96 bg-ess-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-transparent"></div>

                <div className="relative z-10 flex flex-col h-full justify-between p-12 text-white">
                    <div className="animate-fade-in-up">
                        <Link to="/" className="inline-flex items-center gap-3 group">
                            {/* REMOVED LOGO "M" from left side */}
                            <span className="font-bold text-xl tracking-tight">Maison de l'ESS</span>
                        </Link>
                    </div>

                    <div className="space-y-6 mb-12 animate-fade-in-up delay-100">
                        <h1 className="text-4xl xl:text-5xl font-black leading-tight">
                            Innover ensemble <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ess-400 to-purple-400">pour demain.</span>
                        </h1>
                        <p className="text-lg text-slate-300 font-light max-w-md leading-relaxed">
                            Accédez à votre espace personnel pour gérer vos réservations, vos événements et connecter avec la communauté.
                        </p>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                        &copy; {new Date().getFullYear()} Maison de l'ESS.
                    </div>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', // Increased dot visibility
                    backgroundSize: '24px 24px'
                }}
            >

                <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-white ring-1 ring-slate-100 overflow-hidden flex flex-col max-h-[90vh]">

                    {/* Header Section */}
                    <div className="px-8 pt-8 pb-6 bg-white z-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isSignUp ? 'Créer un compte' : 'Bon retour !'}
                        </h2>
                        <p className="mt-2 text-slate-500 text-sm">
                            {isSignUp ? 'Rejoignez la communauté ESS dès aujourd\'hui.' : 'Connectez-vous pour accéder à votre espace.'}
                        </p>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto px-8 pb-8">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-3 mb-6 animate-fade-in">
                                <div className="p-1 bg-red-100 rounded-full"><span className="block w-1.5 h-1.5 bg-red-600 rounded-full"></span></div>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">

                            {/* Toggle Type for SignUp */}
                            {isSignUp && (
                                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/80 rounded-2xl mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setUserType(UserType.INDIVIDUAL)}
                                        className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wide ${userType === UserType.INDIVIDUAL
                                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                            }`}
                                    >
                                        <UserIcon size={14} />
                                        Particulier
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUserType(UserType.COMPANY)}
                                        className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wide ${userType === UserType.COMPANY
                                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                            }`}
                                    >
                                        <Building size={14} />
                                        Entreprise
                                    </button>
                                </div>
                            )}

                            {/* Dynamic Fields Animation Container */}
                            <div className="space-y-5 animate-fade-in-up">

                                {isSignUp && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={inputContainerClass}>
                                            <label className={labelClass}>Prénom</label>
                                            <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={`${inputClass} pl-4`} placeholder="Jean" />
                                        </div>
                                        <div className={inputContainerClass}>
                                            <label className={labelClass}>Nom</label>
                                            <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={`${inputClass} pl-4`} placeholder="Dupont" />
                                        </div>
                                    </div>
                                )}

                                {isSignUp && (
                                    <div className={inputContainerClass}>
                                        <label className={labelClass}>Téléphone</label>
                                        <Phone className={iconClass} size={18} />
                                        <input
                                            required
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                                            className={`${inputClass} ${phone && !validatePhoneNumber(phone) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : phone && validatePhoneNumber(phone) ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}`}
                                            placeholder="06 12 34 56 78"
                                            maxLength={14}
                                        />
                                        {phone && !validatePhoneNumber(phone) && (
                                            <p className="text-red-500 text-xs mt-1">Le numéro doit contenir exactement 10 chiffres</p>
                                        )}
                                        {phone && validatePhoneNumber(phone) && (
                                            <p className="text-green-500 text-xs mt-1">Numéro de téléphone valide</p>
                                        )}
                                    </div>
                                )}

                                {isSignUp && userType === UserType.COMPANY && (
                                    <div className="space-y-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 dashed-border">
                                        <div className={inputContainerClass}>
                                            <label className={labelClass}>Nom de l'entreprise</label>
                                            <Briefcase className={iconClass} size={18} />
                                            <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder="Société SAS" />
                                        </div>
                                        <div className={inputContainerClass}>
                                            <label className={labelClass}>SIRET</label>
                                            <Building className={iconClass} size={18} />
                                            <input required type="text" value={siret} onChange={e => setSiret(e.target.value)} className={inputClass} placeholder="123 456 789 00012" />
                                        </div>
                                    </div>
                                )}

                                {/* Standard Fields */}
                                <div className={inputContainerClass}>
                                    <label className={labelClass}>Email Professionnel</label>
                                    <Mail className={iconClass} size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={inputClass}
                                        placeholder="votre@email.com"
                                    />
                                </div>

                                <div className={inputContainerClass}>
                                    <label className={labelClass}>Mot de passe</label>
                                    <Lock className={iconClass} size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`${inputClass} pr-12`}
                                        placeholder="••••••••"
                                        minLength={4}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-[42px] transform -translate-y-1/2 text-slate-400 hover:text-ess-600 transition-colors z-20"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {!isSignUp && (
                                    <div className="text-right">
                                        <Link to="/forgot-password" className="text-xs font-bold text-ess-600 hover:text-ess-700 transition">
                                            Mot de passe oublié ?
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 transition-all transform active:scale-[0.98] font-bold text-base shadow-xl shadow-slate-900/20 flex justify-center items-center gap-3 group"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            {isSignUp ? "Créer mon compte" : "Se connecter"}
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Toggle Mode */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                                className="text-sm text-slate-500 hover:text-slate-800 transition font-medium"
                            >
                                {isSignUp ? "Déjà membre ? " : "Pas encore de compte ? "}
                                <span className="text-ess-600 font-bold underline decoration-ess-200 hover:decoration-ess-500 underline-offset-2">
                                    {isSignUp ? "Se connecter" : "S'inscrire gratuitement"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Footer in Card */}
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors">
                            Retour à l'accueil
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};
