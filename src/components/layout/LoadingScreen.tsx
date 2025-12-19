import React from 'react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-ess-200 border-t-ess-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Chargement...</p>
            </div>
        </div>
    );
};
