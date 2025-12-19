import { Space, SpaceCategory } from '../types';

export const spacesData: Space[] = [
  {
    id: 'kiosque-4',
    name: 'Kiosques Gourmands',
    description: 'Module individuel pour restaurateur, artisan ou créateur. Emplacement N°4 sur 5. Idéal pour lancer son activité.',
    capacity: 2,
    image: '/galerie/kiosque-vue-ensemble.jpg',
    pricing: {
      day: 25,
      month: 550,
      currency: '€'
    },
    features: ['Vente à emporter', 'Visibilité', 'Contrat flexible', 'Électricité incluse'],
    category: SpaceCategory.COMMERCE,
    showInCalendar: true
  },
  {
    id: 'container-3',
    name: 'Containers Pro',
    description: 'Bureau vitré individuel, moderne et confortable. Unité N°3 sur 3. Parfait pour recevoir des clients.',
    capacity: 4,
    image: '/galerie/container-pro.jpg',
    pricing: {
      day: 0,
      currency: '€'
    },
    features: ['Climatisation', 'Grand écran', 'Accès sécurisé'],
    category: SpaceCategory.OFFICE,
    showInCalendar: true,
    autoApprove: false
  },
  {
    id: 'studio-creatif',
    name: 'Studio Créatif – Espace Média',
    description: 'Studio insonorisé pour podcasts, musique, interviews.',
    capacity: 5,
    image: '/galerie/studio.jpg',
    pricing: {
      halfDay: 100,
      day: 180,
      isQuote: true,
      currency: '€'
    },
    features: ['Insonorisation', 'Matériel audio', 'Table ronde'],
    category: SpaceCategory.CREATIVE,
    showInCalendar: true
  },
  {
    id: 'espace-beaute',
    name: 'Espace Beauté & Bien-Être',
    description: 'Salle dédiée aux soins, maquillage, massages.',
    capacity: 3,
    image: '/galerie/espace-beaute.jpg',
    pricing: {
      day: 15,
      month: 300,
      currency: '€'
    },
    features: ['Point d\'eau', 'Ambiance zen', 'Privatif'],
    category: SpaceCategory.WELLNESS,
    showInCalendar: true
  },
  {
    id: 'green-room',
    name: 'Green Room – Salle Événementielle & Conférences',
    description: 'Salle événementielle gazonnée pour conférences et team building.',
    capacity: 50,
    image: '/galerie/green-room.jpg',
    pricing: {
      halfDay: 100,
      day: 180,
      isQuote: true,
      currency: '€'
    },
    features: ['Projecteur', 'Sonorisation', 'Espace atypique'],
    category: SpaceCategory.EVENT,
    showInCalendar: true
  },
  {
    id: 'salle-numerique',
    name: 'Salle Numérique – Réunions & Formations',
    description: 'Salle fermée lumineuse pour réunions et formations.',
    capacity: 12,
    image: '/galerie/salle focus.jpg',
    pricing: {
      day: 35,
      month: 600,
      currency: '€'
    },
    features: ['Wifi HD', 'Écran TV', 'Tableau blanc'],
    category: SpaceCategory.MEETING,
    showInCalendar: true
  },
  {
    id: 'open-zone',
    name: 'Open Zone – Ateliers Collaboratifs & Coworking',
    description: 'Espaces ouverts pour ateliers, expos, animations.',
    capacity: 30,
    image: '/galerie/open zone.jpg',
    pricing: {
      halfDay: 15,
      day: 25,
      month: 450,
      currency: '€'
    },
    features: ['Mobilier mobile', 'Espace ouvert', 'Convivial'],
    category: SpaceCategory.COMMON,
    showInCalendar: true
  },
  {
    id: 'espaces-coworking',
    name: 'Espaces coworking',
    description: 'Un espace de travail partagé convivial et tout équipé.',
    capacity: 20,
    image: '/galerie/espace coworking.jpg',
    pricing: {
      day: 15,
      month: 200,
      currency: '€'
    },
    features: ['Wifi Haut Débit', 'Café illimité', 'Imprimante'],
    category: SpaceCategory.COWORKING,
    showInCalendar: true
  }
];
