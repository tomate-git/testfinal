
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookingSlot, BookingStatus } from '../types';
import { useBookingLogic } from '../hooks/useBookingLogic';
import { ArrowLeft, Calendar as CalendarIcon, CheckCircle, Clock, ChevronLeft, ChevronRight, Sun, Sunset, Info, CalendarPlus, Lock, X, CreditCard, CalendarRange, Zap, Ban, Repeat, ArrowRight, User as UserIcon } from 'lucide-react';

export const Booking: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { spaces, user, addReservation, reservations, loading } = useApp();

    // Initialize with URL param, but allow switching
    const [selectedSpaceId, setSelectedSpaceId] = useState<string>(id || '');

    const space = spaces.find(s => s.id === selectedSpaceId);

    // --- USE CUSTOM HOOK FOR LOGIC ---
    const {
        bookingType, setBookingType,
        startDate, setStartDate,
        endDate, setEndDate,
        slot, setSlot,
        recurrence, setRecurrence,
        recurringDates,
        duration,
        totalPrice,
        checkDateStatus,
        isSlotAvailable,
        handleDateClick,
        validateSelection
    } = useBookingLogic(space, reservations);

    // Modals State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Calendar View State
    const [calDate, setCalDate] = useState(new Date());

    useEffect(() => {
        if (id) setSelectedSpaceId(id);
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div></div>;
    if (!space || space.showInCalendar === false) return <div className="pt-32 p-12 text-center text-zinc-500">Espace non trouvé ou non disponible</div>;

    const siblings = space.name.includes('N°')
        ? spaces
            .filter(s => (s.name.includes('N°') ? s.name.split('N°')[0].trim() : s.name) === space.name.split('N°')[0].trim())
            .filter(s => s.showInCalendar !== false)
            .sort((a, b) => {
                const ra = /N°\s*(\d+)/.exec(a.name);
                const rb = /N°\s*(\d+)/.exec(b.name);
                const na = ra ? parseInt(ra[1], 10) : 0;
                const nb = rb ? parseInt(rb[1], 10) : 0;
                return na - nb;
            })
        : [];

    // Trigger Confirmation Modal
    const handlePreValidation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        const validation = validateSelection();
        if (!validation.isValid) {
            setValidationError(validation.error);
            setTimeout(() => setValidationError(null), 3000);
            return;
        }

        // If checks pass, open confirm modal
        setShowConfirmModal(true);
    };

    // Final Submission
    const handleConfirmBooking = async () => {
        if (!user) return;

        setIsSubmitting(true);

        // HANDLE RECURRING BATCH
        if (bookingType === 'recurring') {
            const groupId = 'g-' + Date.now();
            const promises = recurringDates.map(dateStr =>
                addReservation({
                    spaceId: space.id,
                    userId: user.id,
                    date: dateStr,
                    slot: slot,
                    recurringGroupId: groupId
                })
            );
            await Promise.all(promises);
        } else {
            // HANDLE SINGLE / RANGE
            await addReservation({
                spaceId: space.id,
                userId: user.id,
                date: startDate,
                endDate: bookingType === 'range' ? endDate : undefined,
                slot: bookingType === 'range' ? BookingSlot.FULL_DAY : slot,
            });
        }

        setIsSubmitting(false);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
    };

    const downloadICS = () => {
        // Simplified ICS for single event, recurring not fully supported in this simple blob
        const eventTitle = `Réservation: ${space.name}`;
        const eventDesc = `Réservation à la Maison de l'ESS pour l'espace ${space.name}.`;
        const formatICSDate = (dateStr: string) => dateStr.replace(/-/g, '');
        const start = formatICSDate(startDate);
        const end = endDate ? formatICSDate(endDate) : start;

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART;VALUE=DATE:${start}`,
            `DTEND;VALUE=DATE:${end}`,
            `SUMMARY:${eventTitle}`,
            `DESCRIPTION:${eventDesc}`,
            `LOCATION:Maison de l'ESS`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'reservation.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calendar Helpers
    const handlePrevMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));

    const monthName = calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay(); // 0 = Sunday
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Shift to start on Monday
    const formatDateLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const parseDateLocal = (s: string) => {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y || 0, (m || 1) - 1, d || 1);
    };

    const daysOfWeekMap = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
        <div className="min-h-screen pt-24 pb-12 bg-white dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Top Bar: Navigation & Sibling Selection */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <button onClick={() => navigate('/catalog')} className="flex items-center text-zinc-500 hover:text-black dark:hover:text-white font-medium transition-colors px-4 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                        <ArrowLeft size={20} className="mr-2" /> Retour au catalogue
                    </button>

                    {siblings.length > 0 && (
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                            {siblings.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setSelectedSpaceId(s.id);
                                        setStartDate(''); setEndDate('');
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap ${selectedSpaceId === s.id
                                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    {s.name.includes('N°') ? `N°${s.name.split('N°')[1]}` : s.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Booking Interface */}
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Context & Calendar */}
                    <div className="lg:col-span-7 flex flex-col gap-6">

                        {/* Header Info Card */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                                <img src={space.image} alt={space.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider">
                                        {space.category}
                                    </span>
                                    
                                </div>
                                <h1 className="text-3xl font-black mb-3 tracking-tight">{space.name}</h1>
                                <p className="text-zinc-500 text-sm leading-relaxed">{space.description}</p>
                            </div>
                        </div>

                        {/* Calendar Visualization */}
                        <div className="bg-gradient-to-br from-white via-white to-zinc-50/50 dark:from-black dark:via-black dark:to-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-black/40 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black text-2xl flex items-center gap-3 bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                                    <CalendarIcon size={24} className="text-zinc-900 dark:text-white" />
                                    Disponibilités
                                </h3>
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1.5 shadow-lg shadow-zinc-200/50 dark:shadow-black/20">
                                    <button type="button" onClick={handlePrevMonth} className="w-9 h-9 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 transition-all hover:scale-110 active:scale-95">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm font-black uppercase min-w-[140px] text-center tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                                        {monthName}
                                    </span>
                                    <button type="button" onClick={handleNextMonth} className="w-9 h-9 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 transition-all hover:scale-110 active:scale-95">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <div className="grid grid-cols-7 gap-3 text-center mb-6">
                                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                                        <div key={d} className="text-xs font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-3">
                                    {Array.from({ length: offset }).map((_, i) => <div key={`blank-${i}`} />)}

                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const d = new Date(calDate.getFullYear(), calDate.getMonth(), day);
                                        const dateStr = formatDateLocal(d);

                                        // USE HOOK FOR STATUS
                                        const status = checkDateStatus(dateStr);

                                        // Selection Logic
                                        let isSelected = false;
                                        if (bookingType === 'single') {
                                            isSelected = startDate === dateStr;
                                        } else if (bookingType === 'range') {
                                            isSelected = startDate === dateStr || (!!endDate && dateStr >= startDate && dateStr <= endDate);
                                        } else if (bookingType === 'recurring') {
                                            // Highlight if it's the start date OR if it's one of the generated recurring dates
                                            isSelected = startDate === dateStr || recurringDates.includes(dateStr);
                                        }

                                        // Dynamic styling based on status
                                        let baseClass = "aspect-square rounded-2xl text-base font-black flex items-center justify-center transition-all duration-300 relative overflow-hidden border-2";
                                        let stateClass = "";

                                        if (status.isBlocked) {
                                            // Unavailable
                                            stateClass = "bg-zinc-100/80 dark:bg-zinc-900/80 border-zinc-200/50 dark:border-zinc-800/50 text-zinc-300 dark:text-zinc-700 cursor-not-allowed backdrop-blur-sm";
                                            if (status.isGlobalClosed) stateClass += " bg-red-50/30 dark:bg-red-900/10 text-red-300 dark:text-red-800";
                                            if (status.isFullDay) stateClass += " line-through decoration-2 decoration-zinc-300";
                                        } else {
                                            // Available
                                            stateClass = "bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-100 hover:shadow-2xl hover:shadow-zinc-900/10 dark:hover:shadow-black/40 cursor-pointer active:scale-95 hover:scale-110 hover:z-10 backdrop-blur-sm";
                                            if (status.isPartiallyBooked) stateClass += " border-zinc-300 dark:border-zinc-700";
                                        }

                                        // Selection Overrides Everything
                                        if (isSelected && !status.isBlocked) {
                                            stateClass = "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-white dark:via-zinc-100 dark:to-white text-white dark:text-black border-zinc-900 dark:border-white shadow-2xl shadow-zinc-900/30 dark:shadow-white/20 scale-110 z-20 ring-4 ring-zinc-900/10 dark:ring-white/10";
                                        }

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                disabled={status.isBlocked}
                                                onClick={() => handleDateClick(dateStr)}
                                                className={`${baseClass} ${stateClass} group`}
                                            >
                                                {status.isGlobalClosed && (
                                                    <Lock size={12} className="absolute top-1.5 right-1.5 opacity-40" />
                                                )}
                                                <span className="relative z-10">{day}</span>
                                                {status.isPartiallyBooked && !isSelected && !status.isBlocked && (
                                                    <div className="absolute bottom-2 flex gap-0.5">
                                                        <div className="w-1 h-1 bg-zinc-500 dark:bg-zinc-400 rounded-full"></div>
                                                        <div className="w-1 h-1 bg-zinc-500 dark:bg-zinc-400 rounded-full"></div>
                                                    </div>
                                                )}
                                                {/* Shine effect on hover for available dates */}
                                                {!status.isBlocked && !isSelected && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 group-hover:via-white/20 group-hover:to-white/10 transition-all duration-300 rounded-2xl"></div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-10 pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="w-3 h-3 bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg"></div>
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Libre</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="w-3 h-3 bg-zinc-400 rounded-lg relative overflow-hidden">
                                        <div className="absolute inset-0 flex gap-0.5 items-center justify-center">
                                            <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                                            <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Partiel</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="w-3 h-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center">
                                        <X size={8} className="text-zinc-400" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Complet</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="w-3 h-3 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 rounded-lg shadow-md"></div>
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Sélection</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Form Actions */}
                    <div className="lg:col-span-5 flex flex-col h-full">
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 sticky top-24">
                            <form onSubmit={handlePreValidation} className="flex flex-col gap-8">

                                {/* Type Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Type de réservation</label>
                                    <div className="flex p-1 bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        {[
                                            { id: 'single', label: 'Courte' },
                                            { id: 'range', label: 'Longue' },
                                            { id: 'recurring', label: 'Récurrente' },
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setBookingType(type.id as any)}
                                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${bookingType === type.id
                                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                                    }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* RECURRING CONFIGURATION UI */}
                                {bookingType === 'recurring' && (
                                    <div className="animate-fade-in space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Période</label>
                                            <div className="flex gap-3">
                                                <div className={`flex-1 p-3 rounded-xl border bg-white dark:bg-black ${startDate ? 'border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                                    <div className="text-[10px] uppercase text-zinc-400 font-bold">Début</div>
                                                    <div className="font-mono text-sm font-bold">{startDate || '...'}</div>
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="date"
                                                        min={startDate}
                                                        value={recurrence.endDate}
                                                        onChange={(e) => setRecurrence({ ...recurrence, endDate: e.target.value })}
                                                        className="w-full h-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black font-bold text-sm outline-none focus:border-black dark:focus:border-white transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Jours</label>
                                            <div className="flex flex-wrap gap-2">
                                                {daysOfWeekMap.map((day, idx) => {
                                                    if (idx === 0) return null;
                                                    const isSelected = recurrence.daysOfWeek.includes(idx);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => {
                                                                const newDays = isSelected
                                                                    ? recurrence.daysOfWeek.filter(d => d !== idx)
                                                                    : [...recurrence.daysOfWeek, idx];
                                                                setRecurrence({ ...recurrence, daysOfWeek: newDays });
                                                            }}
                                                            className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${isSelected
                                                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                                                : 'bg-white dark:bg-black text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                                                                }`}
                                                        >
                                                            {day.charAt(0)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Dates Selection Display (Single/Range) */}
                                {bookingType !== 'recurring' && (
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Dates</label>
                                        <div className="flex items-center gap-3">
                                            <div className={`flex-1 p-4 rounded-2xl border transition-all ${startDate ? 'bg-white dark:bg-black border-black dark:border-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'}`}>
                                                <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Du</div>
                                                <div className="font-mono text-base font-bold">{startDate || '--/--/----'}</div>
                                            </div>
                                            {bookingType === 'range' && (
                                                <>
                                                    <div className="text-zinc-300"><ArrowRight size={16} /></div>
                                                    <div className={`flex-1 p-4 rounded-2xl border transition-all ${endDate ? 'bg-white dark:bg-black border-black dark:border-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'}`}>
                                                        <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Au</div>
                                                        <div className="font-mono text-base font-bold">{endDate || '--/--/----'}</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Slots Timeline */}
                                {(bookingType === 'single' || bookingType === 'recurring') && (
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Créneau</label>

                                        <div className="space-y-3">
                                            {/* Half Day Slots */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {[BookingSlot.MORNING, BookingSlot.AFTERNOON].map((currentSlot) => {
                                                    const isSelected = slot === currentSlot;
                                                    const isAvailable = bookingType === 'recurring' ? true : (startDate && isSlotAvailable(startDate, currentSlot));

                                                    return (
                                                        <button
                                                            key={currentSlot}
                                                            type="button"
                                                            disabled={bookingType === 'single' && (!startDate || !isAvailable)}
                                                            onClick={() => setSlot(currentSlot)}
                                                            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-2 active:scale-95 
                                                ${isSelected
                                                                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg'
                                                                    : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                                                                }
                                                ${(bookingType === 'single' && !isAvailable) ? 'opacity-40 cursor-not-allowed bg-zinc-50' : ''}
                                                `}
                                                        >
                                                            {currentSlot === BookingSlot.MORNING ? <Sun size={20} /> : <Sunset size={20} />}
                                                            <div className="text-center">
                                                                <div className="text-sm font-bold">{currentSlot === BookingSlot.MORNING ? 'Matin' : 'Après-midi'}</div>
                                                                <div className={`text-[10px] font-medium opacity-70`}>
                                                                    {currentSlot === BookingSlot.MORNING ? '8h - 12h' : '13h - 18h'}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Full Day Slot */}
                                            <button
                                                type="button"
                                                disabled={bookingType === 'single' && (!startDate || !isSlotAvailable(startDate, BookingSlot.FULL_DAY))}
                                                onClick={() => setSlot(BookingSlot.FULL_DAY)}
                                                className={`w-full p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group active:scale-[0.98] ${slot === BookingSlot.FULL_DAY
                                                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg'
                                                    : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                                                    } ${(bookingType === 'single' && (!startDate || !isSlotAvailable(startDate, BookingSlot.FULL_DAY))) ? 'opacity-40 grayscale cursor-not-allowed bg-zinc-50' : ''}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${slot === BookingSlot.FULL_DAY ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                                        <Zap size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-bold text-sm">Journée Entière</div>
                                                        <div className="text-[10px] opacity-70">9h - 18h</div>
                                                    </div>
                                                </div>
                                                <div className="font-black text-lg">{space.pricing.isQuote ? 'Devis' : space.pricing.day + '€'}</div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Summary & Action */}
                                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
                                    {validationError && (
                                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-fade-in">
                                            <Ban size={14} />
                                            {validationError}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <span className="text-zinc-400 text-xs font-bold uppercase block mb-1">Total estimé</span>
                                            <span className="text-3xl font-black text-black dark:text-white tracking-tight">
                                                {space.pricing.isQuote
                                                    ? 'Sur Devis'
                                                    : (totalPrice !== null ? `${totalPrice}€` : '-')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-zinc-400 text-xs font-bold uppercase block mb-1">Durée</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{duration > 0 ? duration : '-'} {bookingType === 'recurring' ? 'fois' : 'Jour(s)'}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!startDate || (bookingType === 'range' && !endDate) || (bookingType === 'recurring' && recurringDates.length === 0)}
                                        className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95"
                                    >
                                        Confirmer
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>

                {/* Confirm Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-black rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-zinc-200 dark:border-zinc-800">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Récapitulatif</h3>
                                <button onClick={() => setShowConfirmModal(false)} className="text-zinc-400 hover:text-black dark:hover:text-white transition"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                        <img src={space.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-400 uppercase">Espace</p>
                                        <p className="text-lg font-black">{space.name}</p>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-zinc-500">Dates</span>
                                        <span className="text-sm font-bold text-right">
                                            {bookingType === 'recurring'
                                                ? `${recurringDates.length} occurrences`
                                                : `${startDate} ${endDate ? `➔ ${endDate}` : ''}`}
                                        </span>
                                    </div>
                                    {bookingType !== 'range' && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-zinc-500">Créneau</span>
                                            <span className="text-sm font-bold">{slot}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 flex justify-between items-center">
                                        <span className="font-bold">Total</span>
                                        <span className="text-xl font-black">{totalPrice}€</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-black hover:opacity-90 transition flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? '...' : 'Valider'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-black rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up relative border border-zinc-800">
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-3xl font-black mb-2">Confirmé !</h2>
                                <p className="text-zinc-500">Votre réservation a été enregistrée avec succès.</p>
                            </div>

                            <div className="p-8 pt-0 space-y-3">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full bg-zinc-100 hover:bg-zinc-200 text-black py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2"
                                >
                                    <UserIcon size={18} /> Voir mes réservations
                                </button>

                                <button
                                    onClick={downloadICS}
                                    className="w-full border border-zinc-200 hover:bg-zinc-50 text-zinc-600 py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2"
                                >
                                    <CalendarPlus size={18} /> Ajouter au calendrier
                                </button>

                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full text-zinc-400 hover:text-black py-2 text-sm font-medium transition mt-4"
                                >
                                    Retour à l'accueil
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
