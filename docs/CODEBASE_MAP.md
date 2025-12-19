# Cartographie du Code (Codebase Map)

Ce document détaille l'utilité de chaque fichier du projet et les relations entre eux. Il sert de référence pour comprendre la structure et le fonctionnement de l'application.

## 📂 Racine du Projet

- **`index.html`** : Point d'entrée HTML de l'application. Charge `src/main.tsx`.
- **`package.json`** : Définit les dépendances (React, Vite, Supabase, etc.) et les scripts (`dev`, `admin`, `build`).
- **`vite.config.ts`** : Configuration de Vite (bundler), gestion des plugins et des alias de chemin.
- **`tsconfig.json`** : Configuration TypeScript.

## 📂 `src/` (Code Source Principal)

C'est ici que réside toute la logique frontend de l'application.

### 🚀 Point d'Entrée
- **`main.tsx`** : Initialise React et monte l'application dans le DOM (`#root`). Importe `index.css` pour les styles globaux.
- **`App.tsx`** : Composant racine.
    - Configure le routeur (`react-router-dom`).
    - Enveloppe l'application avec `AppProvider` (Gestion d'état).
    - Définit la structure globale (Navbar, Contenu, Footer).
    - Gère le Lazy Loading des pages Admin.

### 🎨 `src/components/`
Composants réutilisables de l'interface.

#### `layout/`
- **`Navbar.tsx`** : Barre de navigation principale. S'adapte selon l'état de connexion (Admin/User).
- **`Footer.tsx`** : Pied de page de l'application.
- **`LoadingScreen.tsx`** : Écran de chargement affiché pendant les transitions ou le chargement initial.

#### `admin/`
Composants spécifiques au tableau de bord administrateur.
- **`AdminSidebar.tsx`** : Menu latéral de navigation pour l'admin.
- **`AdminSpaces.tsx`** : Gestion des espaces (liste, modification).
- **`AdminEvents.tsx`** : Gestion des événements (ajout, modification, suppression).
- **`AdminReservations.tsx`** : Calendrier et liste des demandes de réservation.
- **`AdminMessages.tsx`** : Boîte de réception des messages de contact.
- **`modals/`** :
    - **`AdminEditSpaceModal.tsx`** : Formulaire modal pour modifier un espace (upload images, config).
    - **`AdminEventModal.tsx`** : Formulaire modal pour créer/éditer un événement.

### 📄 `src/pages/`
Les pages principales accessibles via le routeur.
- **`Home.tsx`** : Page d'accueil. Affiche la frise des événements et la galerie des espaces.
- **`Catalog.tsx`** : Liste complète des espaces disponibles.
- **`Booking.tsx`** : Page de réservation pour un espace spécifique.
- **`Contact.tsx`** : Formulaire de contact et demande de devis.
- **`Login.tsx`** : Page de connexion et d'inscription.
- **`AdminDashboard.tsx`** : Page principale de l'administration (protégée).
- **`AdminCheckin.tsx`** : Interface simplifiée pour le pointage (QR Code).

### 🧠 `src/context/`
- **`AppContext.tsx`** : Cœur de la gestion d'état (State Management).
    - Utilise React Context API.
    - Expose : `user`, `spaces`, `events`, `reservations`, `messages`.
    - Fournit les fonctions : `login`, `register`, `logout`, `refreshData`.
    - Charge les données initiales depuis l'API.

### 🛠️ `src/data/` & `src/services/`
- **`data/api.ts`** : Couche d'abstraction API.
    - Centralise tous les appels vers Supabase et le Serveur Admin.
    - Contient les objets `api.auth`, `api.spaces`, `api.events`, etc.
- **`services/supabase.ts`** : Initialisation du client Supabase.

### 🏷️ `src/types/`
Définitions TypeScript pour garantir le typage fort.
- **`index.ts`** : Exporte tous les types.
- **`user.ts`** : Types liés aux utilisateurs (`User`, `UserRole`).
- **`space.ts`** : Types pour les espaces (`Space`, `Pricing`) et réservations.
- **`event.ts`** : Type `AppEvent`.
- **`common.ts`** : Types partagés (`AppNotification`, `BookingStatus`).

## 📂 `scripts/` (Backend & Utilitaires)

- **`adminServer.js`** : Serveur Node.js (Express).
    - **Rôle** : Gère le contenu statique public (Espaces, Événements) pour éviter de surcharger la base de données avec des données purement CMS.
    - **Endpoints** :
        - `GET /api/public/content` : Sert le fichier `content.json`.
        - `POST /api/admin/upload` : Gère l'upload d'images via Multer.
        - `POST /api/admin/spaces` : Met à jour les espaces.
        - `POST /api/admin/events` : Met à jour les événements.
    - **Sécurité** : Vérifie le header `x-admin-token`.

## 📂 `front end data/`

- **`content.json`** : Base de données JSON locale.
    - Contient la liste des `spaces` et `events`.
    - Modifié par `adminServer.js`, lu par le Frontend.

## 🔄 Relations Clés

1.  **Frontend -> API** : `Home.tsx` utilise `useApp()` qui appelle `api.spaces.getAll()` dans `api.ts`.
2.  **API -> Serveur** : `api.spaces.getAll()` fait un fetch vers `http://localhost:8080/api/public/content`.
3.  **Admin -> Upload** : `AdminEditSpaceModal.tsx` envoie un `FormData` vers `http://localhost:8080/api/admin/upload`.
4.  **Auth** : `AppContext` utilise `supabase.auth` pour gérer les sessions utilisateurs.
