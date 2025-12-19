import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Oups ! Une erreur est survenue.</h1>
                        <p className="text-slate-500 mb-8">
                            Nous sommes désolés, mais quelque chose s'est mal passé. Veuillez rafraîchir la page ou réessayer plus tard.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-xl mb-8 text-left overflow-auto max-h-32">
                            <code className="text-xs text-slate-600 font-mono">
                                {this.state.error?.message}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Rafraîchir la page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
