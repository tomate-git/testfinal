import { User, Space, Reservation, Message, BrochureType } from './types';

// --- DATA MOVED INLINE TO FIX JSON IMPORT ISSUES ---

const userData = [
  {
    "id": "a1",
    "firstName": "LaFactory",
    "lastName": "Admin",
    "email": "lafactory.garges@gmail.com",
    "password": "admin",
    "role": "ADMIN",
    "type": "COMPANY",
    "companyName": "Maison de l'ESS"
  },
  {
    "id": "u1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "password": "user123",
    "role": "USER",
    "type": "INDIVIDUAL",
    "phone": "06 12 34 56 78"
  }
];

const spaceData = [
  {
    "id": "kiosque-1",
    "name": "Kiosque Gourmand N°1",
    "description": "Module individuel pour restaurateur, artisan ou créateur. Emplacement N°1 sur 5. Idéal pour lancer son activité.",
    "category": "Commerce",
    "capacity": 2,
    "image": "/galerie/kiosque.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 30,
    "features": ["Vente à emporter", "Visibilité", "Contrat flexible", "Électricité incluse"],
    "brochureType": "PDF",
    "brochureUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "brochureName": "presentation_kiosque.pdf"
  },
  {
    "id": "kiosque-2",
    "name": "Kiosque Gourmand N°2",
    "description": "Module individuel pour restaurateur, artisan ou créateur. Emplacement N°2 sur 5. Idéal pour lancer son activité.",
    "category": "Commerce",
    "capacity": 2,
    "image": "/galerie/kiosque-2.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 30,
    "features": ["Vente à emporter", "Visibilité", "Contrat flexible", "Électricité incluse"]
  },
  {
    "id": "kiosque-3",
    "name": "Kiosque Gourmand N°3",
    "description": "Module individuel pour restaurateur, artisan ou créateur. Emplacement N°3 sur 5. Idéal pour lancer son activité.",
    "category": "Commerce",
    "capacity": 2,
    "image": "/galerie/kiosque-3.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 30,
    "features": ["Vente à emporter", "Visibilité", "Contrat flexible", "Électricité incluse"]
  },
  {
    "id": "kiosque-4",
    "name": "Kiosque Gourmand N°4",
    "description": "Module individuel pour restaurateur, artisan ou créateur. Emplacement N°4 sur 5. Idéal pour lancer son activité.",
    "category": "Commerce",
    "capacity": 2,
    "image": "/galerie/kiosque-vue-ensemble.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 30,
    "features": ["Vente à emporter", "Visibilité", "Contrat flexible", "Électricité incluse"]
  },
  {
    "id": "kiosque-5",
    "name": "Kiosque Gourmand N°5",
    "description": "Module individuel pour restaurateur, artisan ou créateur. Emplacement N°5 sur 5. Idéal pour lancer son activité.",
    "category": "Commerce",
    "capacity": 2,
    "image": "/galerie/kiosque-2.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 30,
    "features": ["Vente à emporter", "Visibilité", "Contrat flexible", "Électricité incluse"]
  },
  {
    "id": "container-1",
    "name": "Container Pro N°1",
    "description": "Bureau vitré individuel, moderne et confortable. Unité N°1 sur 3. Parfait pour recevoir des clients.",
    "category": "Bureau",
    "capacity": 4,
    "image": "/galerie/container-pro.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 1,
    "features": ["Lumière naturelle", "Isolation thermique", "Prises pro", "Wifi Haut Débit"]
  },
  {
    "id": "container-2",
    "name": "Container Pro N°2",
    "description": "Bureau vitré individuel, moderne et confortable. Unité N°2 sur 3. Parfait pour recevoir des clients.",
    "category": "Bureau",
    "capacity": 4,
    "image": "/galerie/container-pro.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 1,
    "features": ["Lumière naturelle", "Isolation thermique", "Prises pro", "Wifi Haut Débit"]
  },
  {
    "id": "container-3",
    "name": "Container Pro N°3",
    "description": "Bureau vitré individuel, moderne et confortable. Unité N°3 sur 3. Parfait pour recevoir des clients.",
    "category": "Bureau",
    "capacity": 4,
    "image": "/galerie/container-pro.jpg",
    "pricing": { "day": 25, "month": 550, "currency": "€" },
    "minDuration": 1,
    "features": ["Lumière naturelle", "Isolation thermique", "Prises pro", "Wifi Haut Débit"]
  },
  {
    "id": "studio-creatif",
    "name": "Studio Créatif",
    "description": "Studio insonorisé pour podcasts, musique, interviews.",
    "category": "Créatif",
    "capacity": 5,
    "image": "/galerie/studio.jpg",
    "pricing": { "halfDay": 100, "day": 180, "isQuote": true, "currency": "€" },
    "features": ["Insonorisation", "Matériel audio", "Table ronde"]
  },
  {
    "id": "espace-media",
    "name": "Espace Média",
    "description": "Espace modulable pour shootings, tournages, visuels pro.",
    "category": "Créatif",
    "capacity": 10,
    "image": "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?q=80&w=800&auto=format&fit=crop",
    "pricing": { "halfDay": 100, "day": 180, "isQuote": true, "currency": "€" },
    "features": ["Fond vert", "Éclairage studio", "Modulable"]
  },
  {
    "id": "espace-beaute",
    "name": "Espace Beauté & Bien-être",
    "description": "Salle dédiée aux soins, maquillage, massages.",
    "category": "Bien-être",
    "capacity": 3,
    "image": "/galerie/espace-beaute.jpg",
    "pricing": { "day": 15, "month": 300, "currency": "€" },
    "features": ["Point d'eau", "Ambiance zen", "Privatif"]
  },
  {
    "id": "green-room",
    "name": "Green Room",
    "description": "Salle événementielle gazonnée pour conférences et team building.",
    "category": "Événementiel",
    "capacity": 50,
    "image": "/galerie/green-room.jpg",
    "pricing": { "halfDay": 100, "day": 180, "isQuote": true, "currency": "€" },
    "features": ["Projecteur", "Sonorisation", "Espace atypique"]
  },
  {
    "id": "salle-focus",
    "name": "Salle Focus",
    "description": "Salle fermée lumineuse pour réunions et formations.",
    "category": "Réunion",
    "capacity": 12,
    "image": "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=800&auto=format&fit=crop",
    "pricing": { "halfDay": 20, "day": 35, "month": 600, "currency": "€" },
    "features": ["Tableau blanc", "Wifi HD", "Écran TV"]
  },
  {
    "id": "open-zone",
    "name": "Open Zone",
    "description": "Espaces ouverts pour ateliers, expos, animations.",
    "category": "Commun",
    "capacity": 30,
    "image": "/galerie/coworking.jpg",
    "pricing": { "halfDay": 15, "day": 25, "month": 450, "currency": "€" },
    "features": ["Mobilier mobile", "Espace ouvert", "Convivial"]
  },
  {
    "id": "communaute",
    "name": "Espace Communautaire",
    "description": "Zones communes et salons partagés.",
    "category": "Commun",
    "capacity": 20,
    "image": "/galerie/espace-communautaire-1.jpg",
    "pricing": { "currency": "€", "day": 0 },
    "features": ["Accès libre", "Détente", "Réseautage"]
  }
];

const autherData = {
  "reservations": [
    {
      "id": "r1",
      "spaceId": "salle-focus",
      "userId": "u1",
      "date": "2025-02-17",
      "slot": "Matin (8h-12h)",
      "status": "CONFIRMED",
      "createdAt": "2025-02-17T10:00:00.000Z"
    }
  ],
  "messages": []
};

// Using cast to unknown then to Type to match the expected interfaces strictly
export const INITIAL_USERS: User[] = userData as unknown as User[];
export const INITIAL_SPACES: Space[] = spaceData as unknown as Space[];
export const INITIAL_AUTHER = autherData as unknown as { reservations: Reservation[], messages: Message[] };
