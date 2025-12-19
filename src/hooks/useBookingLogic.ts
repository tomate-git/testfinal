

import { useState, useMemo, useCallback } from 'react';
import { Space, Reservation, BookingSlot, BookingStatus, RecurrenceConfig } from '../types';

interface DayStatus {
  isPast: boolean;
  isGlobalClosed: boolean;
  isFullDay: boolean;
  isPartiallyBooked: boolean;
  isBlocked: boolean;
}

export const useBookingLogic = (space: Space | undefined, reservations: Reservation[]) => {
  const [bookingType, setBookingType] = useState<'single' | 'range' | 'recurring'>('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [slot, setSlot] = useState<BookingSlot>(BookingSlot.FULL_DAY);
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
  
  // Recurrence State
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    frequency: 'weekly',
    daysOfWeek: [],
    endDate: ''
  });

  // --- Availability Helpers ---

  const checkDateStatus = useCallback((dateStr: string): DayStatus => {
    if (!space) return { isPast: false, isGlobalClosed: false, isFullDay: false, isPartiallyBooked: false, isBlocked: true };

    const today = formatDateLocal(new Date());
    const isPast = dateStr < today;

    let isGlobalClosed = false;
    let isFullDay = false;
    let isPartiallyBooked = false;

    // Filter relevant reservations for this specific date
    const dayReservations = reservations.filter(r => {
      if (r.status === BookingStatus.CANCELLED) return false;

      const rStart = parseDateLocal(r.date);
      const rEnd = parseDateLocal(r.endDate || r.date);
      const current = parseDateLocal(dateStr);
      
      // Normalize time components to avoid timezone issues
      rStart.setHours(0, 0, 0, 0);
      rEnd.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);

      const inRange = current >= rStart && current <= rEnd;

      // Check Global Closure for THIS space only
      if (inRange && r.isGlobalClosure && r.spaceId === space.id) {
        isGlobalClosed = true;
      }

      // Return true if it affects the current space
      return inRange && r.spaceId === space.id;
    });

    if (!isGlobalClosed) {
      const hasFullRange = dayReservations.some(r => r.slot === BookingSlot.FULL_DAY || (r.endDate && r.endDate !== r.date));
      const morningTaken = dayReservations.some(r => r.slot === BookingSlot.MORNING && r.date === dateStr);
      const afternoonTaken = dayReservations.some(r => r.slot === BookingSlot.AFTERNOON && r.date === dateStr);
      isFullDay = hasFullRange || (morningTaken && afternoonTaken);
      isPartiallyBooked = !isFullDay && (morningTaken || afternoonTaken);
    }

    return {
      isPast,
      isGlobalClosed,
      isFullDay,
      isPartiallyBooked,
      isBlocked: isPast || isGlobalClosed || isFullDay
    };
  }, [space, reservations]);

  // Check if a specific slot is available on a specific date
  const isSlotAvailable = useCallback((targetDate: string, targetSlot: BookingSlot) => {
    if (!space) return false;
    const status = checkDateStatus(targetDate);
    
    // If the day is completely blocked (Past, Global Closure, Full Day booking)
    if (status.isBlocked) return false;

    if (space.availableSlots && !space.availableSlots.includes(targetSlot)) return false;

    // Check for specific slot conflict
    const conflicts = reservations.some(r => {
      if (r.status === BookingStatus.CANCELLED || r.spaceId !== space.id) return false;
      if (r.date !== targetDate) return false;
      return r.slot === targetSlot;
    });

    return !conflicts;
  }, [space, reservations, checkDateStatus]);

  // Check availability for a date range
  const isRangeAvailable = useCallback((start: string, end: string) => {
    if (!start || !end) return false;
    const s = parseDateLocal(start);
    const e = parseDateLocal(end);
    s.setHours(0,0,0,0);
    e.setHours(0,0,0,0);
    
    // Iterate through every day in the range
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateLocal(d);
        const status = checkDateStatus(dateStr);
        // If any day in the range is blocked, the whole range is invalid
        if (status.isBlocked) return false;
    }
    return true;
  }, [checkDateStatus]);

  // --- RECURRENCE LOGIC ---
  const recurringDates = useMemo(() => {
    if (bookingType !== 'recurring' || !startDate || !recurrence.endDate || recurrence.daysOfWeek.length === 0) {
      return [];
    }

    const dates: string[] = [];
    const start = parseDateLocal(startDate);
    const end = parseDateLocal(recurrence.endDate);
    
    // Safety break
    if (end < start) return [];

    const current = new Date(start);
    // Limit to avoid infinite loops or massive arrays (e.g. 1 year max)
    const MAX_ITERATIONS = 365; 
    let count = 0;

    while (current <= end && count < MAX_ITERATIONS) {
      // getDay(): 0 = Sun, 1 = Mon, etc.
      if (recurrence.daysOfWeek.includes(current.getDay())) {
        dates.push(formatDateLocal(current));
      }
      current.setDate(current.getDate() + 1);
      count++;
    }
    
    return dates;
  }, [bookingType, startDate, recurrence]);

  // --- Computed Values ---

  const duration = useMemo(() => {
    if (bookingType === 'recurring') {
      return recurringDates.length; // Number of occurrences
    }
    if (!startDate) return 0;
    if (bookingType === 'single') return 1;
    if (!endDate) return 1;

    const start = parseDateLocal(startDate);
    const end = parseDateLocal(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive
  }, [startDate, endDate, bookingType, recurringDates]);

  const totalPrice = useMemo(() => {
    if (!space || space.pricing.isQuote) return null;
    
    if (bookingType === 'single') {
      if (slot === BookingSlot.FULL_DAY) return space.pricing.day || 0;
      return space.pricing.halfDay || 0;
    } else if (bookingType === 'recurring') {
       // For recurring, we assume per-day price * number of occurrences
       // If slot is half-day (not implemented in recurring UI yet, usually full day or slot specific)
       // Let's assume Recurring = Full Day for now based on simplicity, or use slot logic if added.
       const basePrice = slot === BookingSlot.FULL_DAY ? (space.pricing.day || 0) : (space.pricing.halfDay || 0);
       return basePrice * duration;
    } else {
      // Range
      return (space.pricing.day || 0) * duration;
    }
  }, [space, bookingType, slot, duration]);

  // --- Actions ---

  const handleDateClick = useCallback((dateStr: string) => {
    if (bookingType === 'single' || bookingType === 'recurring') {
      // For recurring, clicking date sets the START date
      setStartDate(dateStr);
      if (bookingType === 'single') setEndDate('');
    } else {
      // Range Logic
      if (!startDate || (startDate && endDate)) {
        // Start a new range
        setStartDate(dateStr);
        setEndDate('');
      } else {
        // Complete the range
        if (dateStr < startDate) {
          setStartDate(dateStr);
          setEndDate(startDate); // Swap
        } else {
          setEndDate(dateStr);
        }
      }
    }
  }, [bookingType, startDate, endDate]);

  const validateSelection = useCallback((): { isValid: boolean; error?: string } => {
    if (!space) return { isValid: false, error: "Espace introuvable" };

    if (bookingType === 'single') {
      if (!startDate) return { isValid: false, error: "Veuillez sélectionner une date." };
      if (!isSlotAvailable(startDate, slot)) return { isValid: false, error: "Ce créneau n'est pas disponible." };
    } else if (bookingType === 'range') {
      if (!startDate || !endDate) return { isValid: false, error: "Veuillez sélectionner une date de début et de fin." };
      if (!isRangeAvailable(startDate, endDate)) return { isValid: false, error: "Certains jours de la période sélectionnée ne sont pas disponibles." };
    } else if (bookingType === 'recurring') {
       if (!startDate) return { isValid: false, error: "Veuillez sélectionner une date de début." };
       if (!recurrence.endDate) return { isValid: false, error: "Veuillez sélectionner une date de fin de récurrence." };
       if (recurrence.daysOfWeek.length === 0) return { isValid: false, error: "Veuillez sélectionner au moins un jour de la semaine." };
       if (recurringDates.length === 0) return { isValid: false, error: "Aucune date ne correspond à vos critères." };
       
       // Check availability for EACH date in the recurrence
       const blockedDates = recurringDates.filter(d => !isSlotAvailable(d, slot));
       if (blockedDates.length > 0) {
         // Show max 3 blocked dates in error
         const formattedBlocked = blockedDates.slice(0, 3).join(', ');
         const suffix = blockedDates.length > 3 ? '...' : '';
         return { isValid: false, error: `Conflit de disponibilité pour : ${formattedBlocked}${suffix}.` };
       }
    }

    // Check Min Duration (Logic for Recurring treated as multiple single days OR total duration? Usually contract based. Let's apply min duration to total count for now)
    if (space.minDuration && duration < space.minDuration) {
        const label = bookingType === 'recurring' ? 'occurrences' : 'jours';
        return { isValid: false, error: `Le minimum pour cet espace est de ${space.minDuration} ${label}.` };
    }

    // Check Max Duration
    if (space.maxDuration && duration > space.maxDuration) {
        const label = bookingType === 'recurring' ? 'occurrences' : 'jours';
        return { isValid: false, error: `Le maximum pour cet espace est de ${space.maxDuration} ${label}.` };
    }

    return { isValid: true };
  }, [bookingType, startDate, endDate, slot, isSlotAvailable, isRangeAvailable, duration, space, recurrence, recurringDates]);

  return {
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
  };
};
