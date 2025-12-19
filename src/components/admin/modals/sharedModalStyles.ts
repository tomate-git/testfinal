/**
 * Shared Modal Styles and Constants
 * Centralized styling to avoid duplication across admin modals
 */

export const modalStyles = {
    // Base card styles
    cardClass: "bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300",
    cardClassPremium: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300",

    // Input styles
    inputClasses: "w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-ess-500 focus:border-ess-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500",

    // Label styles
    labelClasses: "block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1.5",

    // Button styles
    buttonPrimary: "px-4 py-2 bg-ess-600 hover:bg-ess-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-ess-600/20 active:scale-[0.98]",
    buttonSecondary: "px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all",
    buttonDanger: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]",

    // Overlay styles
    overlayClass: "fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in",

    // Animation variants
    fadeInUp: "animate-fade-in-up",
} as const;

/**
 * Common Modal Animation Variants for framer-motion
 */
export const modalAnimationVariants = {
    overlay: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
    },
    modal: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
    }
} as const;
