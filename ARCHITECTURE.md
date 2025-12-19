# Architecture Technique - ESS SITE V3

Ce document décrit l'architecture technique du projet pour faciliter la maintenance et le développement futur.

## 🏗️ Architecture Globale

Le projet est une **Single Page Application (SPA)** construite avec React, communiquant avec deux backends distincts :

1.  **Supabase (Cloud)** :
    - Gère les données dynamiques et sécurisées.
    - **Authentification** : Gestion des utilisateurs (Table `users`).
    - **Base de Données** :
        - `reservations` : Demandes de réservation.
        - `messages` : Formulaire de contact.
        - `notifications` : Système de notification interne.
    - **Realtime** : Mises à jour en temps réel pour le dashboard admin.

2.  **Serveur Admin Local (Node.js/Express)** :
    - Gère le contenu statique/public modifiable.
    - **Fichier de Données** : `front end data/content.json`.
    - **Rôle** : Permet à l'administrateur de modifier les textes, images et configurations des espaces sans toucher au code ni à la base de données de production pour ces éléments purement "visuels".
    - **API** : Expose des endpoints REST sur le port `8080`.

## 🔄 Flux de Données

### Affichage Public (Home, Espaces)
- Le Frontend appelle `GET http://localhost:8080/api/public/content` (via `data/api.ts`).
- Les images sont servies statiquement depuis `public/` ou `public/uploads/`.

### Authentification & Réservation
- Le Frontend utilise le SDK Supabase pour se connecter (`auth`).
- Les réservations sont écrites directement dans Supabase via le SDK.

### Administration
- **Lecture** : Combine les données de Supabase (réservations) et du serveur local (espaces/événements).
- **Écriture** :
    - **Espaces/Événements** : Envoie des requêtes PUT/POST au serveur local (`adminServer.js`), qui met à jour `content.json`.
    - **Uploads** : Envoie les fichiers au serveur local via Multer.

## 📁 Structure des Données (`content.json`)

```json
{
  "spaces": [
    {
      "id": "uuid",
      "name": "Nom",
      "description": "...",
      "image": "/uploads/image.jpg",
      "pricing": { ... },
      "features": [ ... ]
    }
  ],
  "events": [
    {
      "id": "evt-timestamp",
      "eventName": "Titre",
      "date": "ISOString",
      "eventImage": "/uploads/image.jpg"
    }
  ]
}
```

## 🛠️ Stack Technique

- **Frontend** : Vite, React, TailwindCSS, Lucide React (Icônes).
- **Backend Local** : Express, Multer, Cors.
- **Base de Données** : PostgreSQL (via Supabase).
- **Langage** : TypeScript (Frontend), JavaScript (Scripts serveur).

## 🔒 Sécurité

- **Supabase** : RLS (Row Level Security) activé pour protéger les données utilisateurs.
- **Serveur Admin** : Protégé par un token (`x-admin-token`) défini dans le fichier `.env`. Ce token doit correspondre entre le client et le serveur.
