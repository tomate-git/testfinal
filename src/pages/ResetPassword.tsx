import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, ArrowLeft, Check, AlertTriangle, RefreshCw, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        // Vérifier la session active (le lien magique connecte l'utilisateur)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setVerifying(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                setSession(session);
                setVerifying(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: "Les mots de passe ne correspondent pas." });
            return;
        }
        if (password.length < 6) {
            setStatus({ type: 'error', message: "Le mot de passe doit faire au moins 6 caractères." });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) {
                setStatus({ type: 'error', message: error.message });
            } else {
                setStatus({ type: 'success', message: "Votre mot de passe a été réinitialisé avec succès !" });
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (e) {
            setStatus({ type: 'error', message: "Impossible de contacter le serveur." });
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/50 relative z-10 animate-fade-in-up">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <RefreshCw size={32} className="text-slate-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Vérification...</h2>
                    <p className="text-slate-500 font-medium">Nous vérifions votre lien de réinitialisation.</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/50 relative z-10 animate-fade-in-up">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Lien invalide</h2>
                    <p className="text-slate-500 mb-8 font-medium">Le lien de réinitialisation est manquant, a expiré, ou vous n'êtes pas connecté.</p>
                    <Link to="/forgot-password" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg">
                        Demander un nouveau lien
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-ess-500/10 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10 animate-fade-in-up mx-4">
                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-900/20 transform -rotate-3">
                            <ShieldCheck size={36} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Nouveau mot de passe</h2>
                        <p className="text-slate-500 font-medium">Sécurisez votre compte avec un mot de passe fort.</p>
                    </div>

                    {status?.type === 'success' ? (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="p-6 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    <Check size={24} />
                                </div>
                                <p className="font-bold text-lg">Mot de passe modifié !</p>
                                <p className="text-sm opacity-90">Redirection vers la connexion...</p>
                            </div>
                            <Link to="/login" className="block w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                Se connecter maintenant
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2">Nouveau mot de passe</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ess-600 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-ess-500 focus:ring-4 focus:ring-ess-500/10 outline-none transition font-medium text-slate-900 placeholder:text-slate-400"
                                            placeholder="Minimum 6 caractères"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2">Confirmer</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ess-600 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-ess-500 focus:ring-4 focus:ring-ess-500/10 outline-none transition font-medium text-slate-900 placeholder:text-slate-400"
                                            placeholder="Répétez le mot de passe"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {status?.type === 'error' && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3 animate-shake">
                                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                    <span className="text-sm font-bold">{status.message}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-ess-600 hover:bg-ess-700 text-white font-bold rounded-xl shadow-xl shadow-ess-600/20 transition flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? <RefreshCw size={20} className="animate-spin" /> : "Réinitialiser le mot de passe"}
                            </button>

                            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition py-2">
                                <ArrowLeft size={16} /> Annuler
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
