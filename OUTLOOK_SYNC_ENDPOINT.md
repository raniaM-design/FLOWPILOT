# Endpoint de synchronisation Outlook - Documentation

## 📋 Endpoint créé

**Route** : `POST /api/integrations/outlook/sync?range=default`

**Description** : Synchronise les événements Outlook depuis Microsoft Graph calendarView vers PILOTYS avec gestion de la pagination, normalisation des données, et anti-doublon.

---

## 🔐 Sécurité

- ✅ Authentification requise (vérifie `getCurrentUserId()`)
- ✅ Utilise `getValidMicrosoftAccessToken()` pour obtenir un token valide avec refresh automatique
- ✅ Gestion d'erreurs complète

---

## 📥 Requête

**Méthode** : `POST`

**Query Parameters** :
- `range` (optionnel) : 
  - `default` : now-30j à now+90j (par défaut)
  - `YYYY-MM-DD,YYYY-MM-DD` : Plage personnalisée

**Headers** :
- Cookie de session (géré automatiquement)

**Exemple** :
```bash
curl -X POST "http://localhost:3000/api/integrations/outlook/sync?range=default" \
  --cookie "session=..."
```

---

## 📤 Réponse de succès

**Status** : `200 OK`

**Body** :
```json
{
  "success": true,
  "range": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-04-01T23:59:59.999Z"
  },
  "statistics": {
    "totalFetched": 45,
    "nbImported": 12,
    "nbUpdated": 8,
    "nbSkipped": 20,
    "nbCancelled": 5,
    "nbErrors": 0
  },
  "errors": [],
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

---

## ❌ Réponses d'erreur

### 401 - Non authentifié

```json
{
  "error": "Unauthorized",
  "message": "Vous devez être connecté pour synchroniser Outlook"
}
```

### 404 - Compte Outlook non connecté

```json
{
  "error": "NotConnected",
  "message": "Aucun compte Outlook connecté",
  "hint": "Connectez votre compte Outlook d'abord"
}
```

### 400 - Range invalide

```json
{
  "error": "InvalidRange",
  "message": "Format de range invalide. Utilisez 'default' ou 'YYYY-MM-DD,YYYY-MM-DD'"
}
```

### 502 - Erreur Microsoft Graph

```json
{
  "error": "GraphAPIError",
  "message": "Erreur lors de la récupération des événements depuis Microsoft Graph",
  "details": "..."
}
```

### 500 - Erreur serveur interne

```json
{
  "error": "InternalServerError",
  "message": "Une erreur interne s'est produite lors de la synchronisation Outlook",
  "details": "..." // Uniquement en développement
}
```

---

## 🔍 Fonctionnalités implémentées

### 1. Pagination automatique

L'endpoint gère automatiquement la pagination Microsoft Graph via `@odata.nextLink` :
- Récupère jusqu'à 50 événements par page
- Continue jusqu'à ce qu'il n'y ait plus de page suivante
- Logs en développement pour suivre la progression

### 2. Normalisation des données

#### Timezone
- Utilise le header `Prefer: outlook.timezone="UTC"` pour normaliser en UTC
- Gère les événements all-day (midnight UTC)
- Convertit correctement les dates/heures

#### Participants
- Combine organisateur + participants
- Élimine les doublons
- Format : `email1@example.com, email2@example.com`

#### Contexte
- Combine organisateur, lieu, et lien de réunion en ligne
- Format : `Organisateur: email | Lieu: nom | Lien: url`

### 3. Anti-doublon

**Clé unique** : `userId + externalEventId` (déjà présent dans le modèle Prisma)

**Stratégie** :
- Si l'événement existe déjà :
  - Vérifie `lastModifiedDateTime` pour détecter les modifications
  - Skip si pas de modification
  - Update si modifié
- Si l'événement n'existe pas :
  - Crée un nouveau meeting

### 4. Gestion des événements annulés

- Détecte `isCancelled: true`
- Marque comme annulé dans la DB (`externalIsCancelled: true`)
- Compte dans `nbCancelled`
- Ne crée pas de nouveau meeting pour les événements annulés

### 5. Champs stockés

**Nouveaux champs ajoutés au modèle Meeting** :
- `externalICalUId` : iCalUId Outlook (pour détection doublons alternatifs)
- `externalLastModified` : lastModifiedDateTime Outlook
- `externalIsCancelled` : isCancelled Outlook
- `externalStartDateTime` : start.dateTime normalisé
- `externalEndDateTime` : end.dateTime normalisé

**Champs existants utilisés** :
- `externalEventId` : ID Outlook (clé unique)
- `externalProvider` : "outlook"
- `isSynced` : true après synchronisation

---

## 📊 Statistiques retournées

| Champ | Description |
|-------|-------------|
| `totalFetched` | Nombre total d'événements récupérés depuis Microsoft Graph |
| `nbImported` | Nombre de nouveaux meetings créés |
| `nbUpdated` | Nombre de meetings mis à jour |
| `nbSkipped` | Nombre d'événements ignorés (pas de modification) |
| `nbCancelled` | Nombre d'événements annulés détectés |
| `nbErrors` | Nombre d'erreurs lors du traitement |
| `errors` | Tableau des erreurs (si `nbErrors > 0`) |

---

## 🔄 Appel Microsoft Graph

### Endpoint utilisé

```
GET https://graph.microsoft.com/v1.0/me/calendarView
```

### Paramètres

- `startDateTime` : Date de début (ISO 8601)
- `endDateTime` : Date de fin (ISO 8601)
- `$top=50` : Limite par page
- `$orderby=start/dateTime` : Tri par date de début
- `$select=id,iCalUId,subject,start,end,isAllDay,organizer,attendees,onlineMeeting,location,lastModifiedDateTime,isCancelled,webLink`

### Headers

- `Authorization: Bearer {accessToken}`
- `Prefer: outlook.timezone="UTC"` : Normalise en UTC
- `Content-Type: application/json`

### Pagination

- Utilise `@odata.nextLink` pour récupérer les pages suivantes
- Continue jusqu'à ce que `@odata.nextLink` soit `null`

---

## 🧪 Tests

### Test manuel avec curl

```bash
# 1. Obtenir le cookie de session (via login)
# 2. Appeler l'endpoint de synchronisation
curl -X POST "http://localhost:3000/api/integrations/outlook/sync?range=default" \
  --cookie "session=VOTRE_SESSION_TOKEN"
```

### Test avec range personnalisé

```bash
curl -X POST "http://localhost:3000/api/integrations/outlook/sync?range=2024-01-01,2024-12-31" \
  --cookie "session=VOTRE_SESSION_TOKEN"
```

### Test depuis le navigateur

```javascript
fetch('/api/integrations/outlook/sync?range=default', {
  method: 'POST',
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 📝 Migration Prisma

**Migration créée** : `20260104094550_add_outlook_sync_fields`

**Champs ajoutés** :
- `externalICalUId String?`
- `externalLastModified DateTime?`
- `externalIsCancelled Boolean @default(false)`
- `externalStartDateTime DateTime?`
- `externalEndDateTime DateTime?`

**Index ajouté** :
- `@@index([externalICalUId])` : Pour recherche rapide par iCalUId

**À appliquer** :
```bash
npx prisma migrate dev
npx prisma generate
```

**Note** : Si `prisma generate` échoue avec une erreur de permissions (Windows), arrêter le serveur de dev, puis relancer `prisma generate`.

---

## 🔍 Logs

**Format** : `[outlook-sync]`

**Exemples** :
- `[outlook-sync] Starting sync for user {userId} from {startISO} to {endISO}`
- `[outlook-sync] Fetched {count} events from Microsoft Graph`
- `[outlook-sync] Fetched {count} events, more pages available` (pagination)
- `[outlook-sync] Error processing event {eventId}: {errorMessage}`

**Note** : Les tokens ne sont jamais loggés.

---

## ✅ Cas d'usage

1. **Synchronisation initiale** : Importer tous les événements Outlook existants
2. **Synchronisation incrémentale** : Mettre à jour les événements modifiés
3. **Synchronisation programmée** : Appeler périodiquement pour garder les données à jour
4. **Synchronisation manuelle** : Permettre à l'utilisateur de déclencher une sync

---

## 🚀 Améliorations futures

- [ ] Ajouter un endpoint de synchronisation incrémentale (delta query)
- [ ] Ajouter un endpoint de synchronisation unidirectionnelle (Outlook → PILOTYS uniquement)
- [ ] Ajouter un endpoint de synchronisation bidirectionnelle (Outlook ↔ PILOTYS)
- [ ] Ajouter un cache pour éviter trop d'appels Graph API
- [ ] Ajouter des métriques (temps de synchronisation, taux de succès)
- [ ] Ajouter un webhook pour synchronisation en temps réel

---

## 📝 Notes

- L'endpoint utilise `getValidMicrosoftAccessToken()` qui gère automatiquement le refresh du token
- Les événements sont normalisés en UTC pour éviter les problèmes de timezone
- La pagination est gérée automatiquement (jusqu'à épuisement des pages)
- Les événements annulés sont détectés et marqués, mais ne créent pas de nouveau meeting
- Les erreurs individuelles n'interrompent pas la synchronisation (collectées dans `errors[]`)

---

## 🔄 Intégration avec l'UI (futur)

L'endpoint est prêt pour être intégré dans l'UI. Exemple d'utilisation :

```typescript
async function syncOutlook() {
  try {
    const response = await fetch('/api/integrations/outlook/sync?range=default', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la synchronisation');
    }
    
    const data = await response.json();
    console.log('Synchronisation réussie:', data.statistics);
    // Afficher les résultats dans l'UI
  } catch (error) {
    console.error('Synchronisation échouée:', error);
    // Afficher l'erreur dans l'UI
  }
}
```

