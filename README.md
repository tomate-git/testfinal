# ESS SITE V3

Bienvenue sur le projet **ESS SITE V3**. Ce projet est une application web de gestion d'espaces et d'événements, conçue pour offrir une expérience utilisateur fluide et une administration simplifiée.

## 📋 Vue d'ensemble

Le projet est construit avec :
- **Frontend** : React, TypeScript, Tailwind CSS.
- **Backend (Hybride)** :
    - **Supabase** : Authentification, Réservations, Messages, Notifications.
    - **Serveur Admin Local** (`scripts/adminServer.js`) : Gestion du contenu public (Espaces, Événements) et upload d'images.
- **Données** : Les données publiques sont stockées dans `front end data/content.json` pour une modification facile et rapide.

## 🚀 Installation

Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé.

1.  Clonez le dépôt (si ce n'est pas déjà fait).
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Configurez les variables d'environnement dans un fichier `.env` à la racine (voir `.env.example` si disponible, sinon demandez les clés à l'administrateur).

## 🛠️ Démarrage

Le projet nécessite de lancer deux processus en parallèle : le frontend et le serveur d'administration.

### 1. Démarrer le Frontend
Pour lancer l'application en mode développement :
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

### 2. Démarrer le Serveur Admin
Pour permettre la gestion des contenus (espaces, événements, images) :
```bash
npm run admin
```
Le serveur écoutera sur `http://localhost:8080`.

> **Note** : Si vous modifiez des espaces ou des événements via l'interface admin, assurez-vous que ce serveur est lancé.

## 📂 Structure du Projet

- **`src/`** : Code source principal.
    - **`components/`** : Composants React réutilisables.
        - **`layout/`** : Navbar, Footer, etc.
        - **`admin/`** : Composants de l'interface d'administration.
    - **`pages/`** : Pages de l'application (Home, Admin, etc.).
    - **`context/`** : Gestion de l'état global (AppContext).
    - **`types/`** : Définitions TypeScript (divisées par domaine).
    - **`hooks/`**, **`services/`**, **`utils/`**, **`data/`**.
- **`scripts/`** : Scripts utilitaires et serveur d'administration (`adminServer.js`).
- **`front end data/`** : Contient `content.json` (Données publiques).
- **`public/`** : Ressources statiques.

