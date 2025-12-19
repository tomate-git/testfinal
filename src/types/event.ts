export interface AppEvent {
    id: string;
    eventName: string;
    date: string; // ISO String
    endDate?: string; // ISO String
    customTimeLabel?: string;
    eventImage?: string;
    description?: string;
    eventDescription?: string; // Alias or specific description
    location?: string;
    spaceId?: string;
    spaceIds?: string[];
}
