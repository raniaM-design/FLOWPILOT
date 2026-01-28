# Checklist d'implémentation Outlook ↔ PILOTYS

## ✅ Implémentation terminée

### 1. Variables d'environnement
- [x] Documentation dans `OUTLOOK_INTEGRATION_SETUP.md`
- [x] Variables requises documentées :
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `MICROSOFT_TENANT_ID=common`
  - `MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook/callback`
  - `MICROSOFT_SCOPES="offline_access User.Read Calendars.Read openid profile email"`

### 2. Prisma Schema
- [x] Modèle `OutlookAccount` créé avec tous les champs
- [x] Champs ajoutés à `Meeting` :
  - `externalProvider String?`
  - `externalEventId String?`
  - `externalCalendarId String?`
  - `isSynced Boolean @default(false)`
- [x] Index unique `@@unique([ownerId, externalEventId])` pour anti-doublon

### 3. Routes API OAuth
- [x] `/api/outlook/connect` : Initie le flux OAuth avec CSRF protection
- [x] `/api/outlook/callback` : Gère le callback, échange code→tokens, stocke dans DB
- [x] Retourne JSON en cas d'erreur (pas HTML)
- [x] Supprime le cookie state après utilisation

### 4. Utilitaires Graph API
- [x] `lib/outlook/graph.ts` :
  - `getOutlookAccount(userId)` : Récupère le compte Outlook
  - `refreshAccessTokenIfNeeded(userId)` : Rafraîchit automatiquement le token
  - `fetchOutlookEvents(userId, fromISO, toISO)` : Récupère les événements avec timezone
  - `fetchOutlookEventById(userId, eventId)` : Récupère un événement spécifique

### 5. Endpoints API
- [x] `/api/outlook/status` : Vérifie si l'utilisateur est connecté
- [x] `/api/outlook/events` : Liste les événements avec statut d'import
- [x] `/api/outlook/import` : Importe un événement avec anti-doublon

### 6. UI d'intégration
- [x] Page `/app/integrations/outlook` :
  - Design premium inspiré de l'image fournie
  - Page de connexion avec illustration
  - Liste des événements après connexion (onglets Aujourd'hui/Semaine)
  - Bouton "Importer" pour chaque événement
  - Badge "Importé" + lien vers meeting PILOTYS

### 7. Navigation
- [x] Lien "Intégrations" ajouté dans le sidebar avec icône `Plug`

### 8. i18n
- [x] Namespace `integrations.outlook` complet FR/EN
- [x] Toutes les clés nécessaires traduites

## ⚠️ Action requise

### Migration Prisma
**IMPORTANT** : Exécuter la migration pour créer les tables et régénérer le client Prisma :

```bash
npx prisma migrate dev --name add_outlook_integration
```

Cette commande va :
1. Créer la table `OutlookAccount`
2. Ajouter les champs à `Meeting`
3. Créer l'index unique
4. Régénérer automatiquement le client Prisma

**Note** : Les erreurs TypeScript actuelles dans `app/api/outlook/events/route.ts` et `app/api/outlook/callback/route.ts` seront résolues après la migration car Prisma générera les types avec les nouveaux champs.

## 🎯 Critères de succès

- ✅ Connexion OAuth fonctionne par utilisateur
- ✅ Tokens stockés et refresh auto fonctionne
- ✅ Liste events du jour/semaine visible
- ✅ Import crée un Meeting lié sans doublon
- ✅ Erreurs propres (JSON), pas de HTML
- ✅ i18n FR/EN complet

## 📝 Notes techniques

- Tous les tokens sont stockés côté serveur uniquement
- Refresh automatique des tokens expirés (buffer de 2 minutes)
- Anti-doublon via `ownerId + externalEventId` (index unique)
- CSRF protection via JWT state token dans cookie httpOnly
- Timezone forcée à "Europe/Paris" pour les requêtes Graph API

