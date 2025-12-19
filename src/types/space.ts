import { BookingSlot, BookingStatus } from './common';

export enum SpaceCategory {
    COMMERCE = 'Commerce',
    OFFICE = 'Bureau',
    CREATIVE = 'Créatif',
    EVENT = 'Événementiel',
    MEETING = 'Réunion',
    WELLNESS = 'Bien-être',
    COMMON = 'Commun',
    COWORKING = 'Coworking',
    OTHER = 'Other',
}

export enum BrochureType {
    PDF = 'PDF',
    WEB = 'WEB',
    IMAGE = 'IMAGE'
}

export interface RecurrenceConfig {
    frequency: 'weekly';
    daysOfWeek: number[];
    endDate: string;
}

export interface Pricing {
    halfDay?: number;
    day?: number;
    month?: number; // Approx monthly price
    hour?: number;
    isQuote?: boolean; // If true, price is "Sur devis"
    currency: string;
}

export interface Space {
    id: string;
    name: string;
    description: string;
    category: SpaceCategory;
    capacity: number; // People
    image: string;
    pricing: Pricing;
    minDuration?: number; // Minimum days required
    maxDuration?: number; // Maximum days allowed
    features: string[];
    availableSlots?: BookingSlot[]; // Optional restriction on slots
    showInCalendar?: boolean; // If true, reservations appear in public calendar
    autoApprove?: boolean; // If true, bookings are automatically confirmed

    // Documentation / Brochure
    brochureUrl?: string;
    brochureType?: BrochureType;
    brochureName?: string; // Filename for download
}

export interface Reservation {
    id: string;
    spaceId: string;
    userId: string;
    date: string; // Start Date ISO Date YYYY-MM-DD
    endDate?: string; // End Date ISO Date YYYY-MM-DD (Optional, defaults to same day)
    slot: BookingSlot; // Morning, Afternoon, Full Day
    status: BookingStatus;
    purpose?: string;
    attendees?: number;
    totalPrice?: number;
    unitNumber?: string;
    customTimeLabel?: string;
    isQuoteRequest?: boolean;
    createdAt: string;
    isGlobalClosure?: boolean;
    eventName?: string;
    eventDescription?: string;
    eventImage?: string;
    checkedInAt?: string;
    recurringGroupId?: string;
}
