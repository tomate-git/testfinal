# Architecture de Connexion Supabase

## Paramètres & Sécurité
- Variables côté client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Variables côté serveur: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TOKEN`, `PORT`.
- Le client utilise l’anon key; les opérations administratives passent par le serveur avec la service role key.

## Initialisation
- Client: `services/supabaseClient.ts` crée le client depuis les `VITE_*`.
- Serveur: `server.js` crée un client avec `SUPABASE_SERVICE_ROLE_KEY` pour les routes admin.

Références de code:
- `services/supabaseClient.ts:3-5` lecture des variables `VITE_*`, `services/supabaseClient.ts:48` export du client (fallback stub si non configuré)
- `server.js:14-16` création du client serveur avec `SUPABASE_SERVICE_ROLE_KEY`

## Services CRUD
- Centralisés dans `data/api.ts` pour `users`, `spaces`, `reservations`, `messages`, `notifications`.
- Mappings camelCase/snake_case gérés pour compatibilité.
- `spaces.update` privilégie l’API admin (`server.js`) quand `VITE_ADMIN_API_BASE` et `VITE_ADMIN_TOKEN` sont présents.

Références de code:
- `data/api.ts:115-143` récupération des espaces via API admin si configurée
- `data/api.ts:185-230` mise à jour d’un espace avec fallback API admin
- `data/api.ts:317-336` mise à jour du statut d’une réservation (admin PATCH ou Supabase direct)

## Realtime
- Abonnements configurés dans `context/AppContext.tsx` via un canal unique pour `spaces`, `reservations`, `messages`, `notifications`.
- Chaque changement déclenche `refreshData()` pour synchronisation immédiate du frontend.

Références de code:
- `context/AppContext.tsx:72-83` création du canal et abonnements `postgres_changes`
- `context/AppContext.tsx:99-110` implémentation de `refreshData()`

## Autorisations (RLS)
- Script: `scripts/createPolicies.js` lit `.env` et applique les policies.
- Lecture publique activée; mise à jour des `spaces` retirée côté public pour passer via endpoint admin.
- Recommandation: intégrer Supabase Auth pour lier les écritures à l’utilisateur.

## Validation
- Client: `services/validation.ts` vérifie les payloads avant envoi.
- Serveur: validation stricte pour `PUT/PATCH /api/admin/spaces/:id`.

## Journalisation
- Client: `services/logger.ts` fournit des logs horodatés avec scope.
- Serveur: logging minimal intégré dans `server.js` pour les erreurs et validations.

## Tests
- `scripts/testRealtime.js`: vérifie la réception des événements realtime.
- `scripts/verifySpacesUpdate.js`: vérifie la persistance d’une mise à jour d’espace.

## Configuration d’Espace
- Les modifications depuis l’interface appellent `api.spaces.update`.
- Si l’API admin est configurée (`VITE_ADMIN_API_BASE`, `VITE_ADMIN_TOKEN`), l’update passe par `server.js` et se reflète en temps réel.

## Endpoints Admin (serveur)
- `server.js:110-131` `GET /api/admin/stats` (protégé par `x-admin-token`)
- `server.js:134-144` `GET /api/admin/spaces` (protégé)
- `server.js:146-170` `PUT/PATCH /api/admin/spaces/:id` (validation payload)
- `server.js:172-197` `PATCH /api/admin/reservations/:id`

## Erreurs fréquentes
- `supabase_not_configured`: vérifiez `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` côté client et `SUPABASE_SERVICE_ROLE_KEY` côté serveur.
- `forbidden` (403): l’en-tête `x-admin-token` ne correspond pas à `ADMIN_TOKEN` du serveur.
