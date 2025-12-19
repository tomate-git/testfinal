import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Check, AlertTriangle, RefreshCw, KeyRound } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            // Utilisation de l'URL actuelle pour la redirection, en pointant vers la page de reset
            // HashRouter nécessite le #
            const redirectTo = `${window.location.origin}/#/reset-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            if (error) {
                setStatus({ type: 'error', message: error.message });
            } else {
                setStatus({ type: 'success', message: "Si cet email existe, vous recevrez un lien de réinitialisation." });
            }
        } catch (e) {
            setStatus({ type: 'error', message: "Une erreur inattendue est survenue." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-ess-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10 animate-fade-in-up mx-4">
                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-ess-500 to-ess-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-ess-500/30 transform rotate-3">
                            <KeyRound size={36} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Mot de passe oublié ?</h2>
                        <p className="text-slate-500 font-medium">Pas de panique ! Entrez votre email pour recevoir un lien de réinitialisation.</p>
                    </div>

                    {status?.type === 'success' ? (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="p-6 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    <Check size={24} />
                                </div>
                                <p className="font-bold text-lg">Email envoyé !</p>
                                <p className="text-sm opacity-90">{status.message}</p>
                            </div>
                            <Link to="/login" className="block w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ess-600 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-ess-500 focus:ring-4 focus:ring-ess-500/10 outline-none transition font-medium text-slate-900 placeholder:text-slate-400"
                                        placeholder="exemple@email.com"
                                        required
                                    />
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
                                {loading ? <RefreshCw size={20} className="animate-spin" /> : "Envoyer le lien"}
                            </button>

                            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition py-2">
                                <ArrowLeft size={16} /> Retour à la connexion
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
