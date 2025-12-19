import { Reservation } from '../types';

export const reservationsData: any[] = [
  {
    "id": "r1",
    "spaceId": "salle-numerique",
    "userId": "u1",
    "date": "2025-02-17",
    "slot": "Matin (8h-12h)",
    "status": "CONFIRMED",
    "createdAt": "2025-02-17T10:00:00.000Z"
  },
  {
    "id": "r-demo-event",
    "spaceId": "salle-numerique",
    "userId": "u1",
    "date": "2025-03-10",
    "slot": "Journée Entière",
    "status": "CONFIRMED",
    "createdAt": "2025-02-20T10:00:00.000Z",
    "eventName": "Vernissage Exposition",
    "eventDescription": "Découverte des artistes locaux autour d'un cocktail.",
    "eventImage": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
  }
];
