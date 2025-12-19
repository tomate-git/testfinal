export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    DONE = 'DONE',
    CANCELLED = 'CANCELLED',
}

export enum BookingSlot {
    MORNING = 'Matin (8h-12h)',
    AFTERNOON = 'Après-midi (13h-18h)',
    FULL_DAY = 'Journée Entière',
}

export interface Message {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
    type: 'contact' | 'devis';
    senderRole?: string;
    attachment?: string;
    attachmentName?: string;
    reactions?: Record<string, string>;
    pinned?: boolean;
    isDeleted?: boolean;
    editedAt?: string;
    readAt?: string;
    content?: string; // Some parts of AppContext use 'content' instead of 'message'
}
