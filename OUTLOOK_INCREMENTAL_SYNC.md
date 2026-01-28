# Synchronisation incrémentale Outlook - Documentation

## 📋 Endpoint créé

**Route** : `POST /api/integrations/outlook/sync/incremental?range=default`

**Description** : Synchronise les événements Outlook de manière incrémentale via Microsoft Graph delta queries. Récupère seulement les changements depuis la dernière synchronisation.

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
curl -X POST "http://localhost:3000/api/integrations/outlook/sync/incremental?range=default" \
  --cookie "session=..."
```

---

## 📤 Réponse de succès

**Status** : `200 OK`

**Body** :
```json
{
  "success": true,
  "syncType": "incremental",
  "range": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-04-01T23:59:59.999Z"
  },
  "statistics": {
    "totalFetched": 12,
    "created": 3,
    "updated": 5,
    "deleted": 4,
    "errors": 0
  },
  "errors": [],
  "hasDeltaLink": true,
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

---

## ❌ Réponses d'erreur

Identiques à l'endpoint de synchronisation complète (`/sync`).

---

## 🔍 Fonctionnalités implémentées

### 1. Delta Queries Microsoft Graph

L'endpoint utilise `/me/calendarView/delta` pour récupérer seulement les changements :

**Première synchronisation** :
- Utilise `/me/calendarView/delta?startDateTime=...&endDateTime=...`
- Récupère tous les événements dans la plage
- Stocke le `deltaLink` retourné par Microsoft Graph

**Synchronisations suivantes** :
- Utilise le `deltaLink` stocké en DB
- Récupère seulement les événements modifiés/supprimés/créés depuis la dernière sync
- Met à jour le `deltaLink` pour la prochaine sync

### 2. Stockage du deltaLink

**Modèle Prisma** : `OutlookSyncState`

**Champs** :
- `userId` : ID de l'utilisateur (unique)
- `deltaLink` : Delta link Microsoft Graph pour la prochaine sync
- `lastSyncAt` : Date de la dernière synchronisation
- `syncRangeStart` : Plage de sync (start)
- `syncRangeEnd` : Plage de sync (end)

**Stratégie** :
- Créé automatiquement lors de la première sync
- Mis à jour à chaque sync avec le nouveau `deltaLink`
- Permet de reprendre la sync incrémentale même après redémarrage

### 3. Gestion des suppressions

**Tombstones** :
- Microsoft Graph retourne seulement l'`id` pour les événements supprimés
- Détecté par l'absence de `subject`, `start`, `end`
- **Action** : Supprime le meeting de la DB

**Annulations** :
- Détecté par `isCancelled: true`
- **Action** : Marque comme annulé (`externalIsCancelled: true`) ou supprime selon le cas

### 4. Gestion des modifications

**Détection** :
- Les événements modifiés sont retournés dans le delta avec toutes leurs données
- Comparaison via `lastModifiedDateTime` si disponible

**Action** :
- Si l'événement existe : Mise à jour complète
- Si l'événement n'existe pas : Création

### 5. Statistiques retournées

| Champ | Description |
|-------|-------------|
| `syncType` | `"initial"` ou `"incremental"` |
| `totalFetched` | Nombre total d'événements récupérés depuis Microsoft Graph |
| `created` | Nombre de nouveaux meetings créés |
| `updated` | Nombre de meetings mis à jour |
| `deleted` | Nombre de meetings supprimés/annulés |
| `errors` | Nombre d'erreurs lors du traitement |
| `hasDeltaLink` | Indique si un deltaLink a été stocké pour la prochaine sync |

---

## 🔄 Appel Microsoft Graph

### Endpoint utilisé

**Première sync** :
```
GET https://graph.microsoft.com/v1.0/me/calendarView/delta?startDateTime=...&endDateTime=...
```

**Syncs suivantes** :
```
GET {deltaLink}
```

### Paramètres (première sync uniquement)

- `startDateTime` : Date de début (ISO 8601)
- `endDateTime` : Date de fin (ISO 8601)
- `$top=50` : Limite par page
- `$orderby=start/dateTime` : Tri par date de début
- `$select=id,iCalUId,subject,start,end,isAllDay,organizer,attendees,onlineMeeting,location,lastModifiedDateTime,isCancelled,webLink`

### Headers

- `Authorization: Bearer {accessToken}`
- `Prefer: outlook.timezone="UTC"` : Normalise en UTC
- `Content-Type: application/json`

### Réponse Microsoft Graph

**Format** :
```json
{
  "@odata.context": "...",
  "value": [
    {
      "id": "...",
      "subject": "...",
      "start": { "dateTime": "...", "timeZone": "..." },
      "end": { "dateTime": "...", "timeZone": "..." },
      ...
    }
  ],
  "@odata.nextLink": "...", // Si plus de pages
  "@odata.deltaLink": "..." // Pour la prochaine sync incrémentale
}
```

**Tombstone (suppression)** :
```json
{
  "id": "event-id-deleted",
  "@removed": {
    "reason": "deleted"
  }
}
```

---

## 🧪 Tests

### Test manuel avec curl

```bash
# Première sync (initial)
curl -X POST "http://localhost:3000/api/integrations/outlook/sync/incremental?range=default" \
  --cookie "session=VOTRE_SESSION_TOKEN"

# Syncs suivantes (incrémentales)
curl -X POST "http://localhost:3000/api/integrations/outlook/sync/incremental?range=default" \
  --cookie "session=VOTRE_SESSION_TOKEN"
```

### Test depuis le navigateur

```javascript
fetch('/api/integrations/outlook/sync/incremental?range=default', {
  method: 'POST',
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 📝 Migration Prisma

**Migration créée** : `20260104094550_add_outlook_sync_state` (ou similaire)

**Modèle créé** : `OutlookSyncState`

**Champs** :
- `id String @id @default(cuid())`
- `userId String @unique`
- `deltaLink String?`
- `lastSyncAt DateTime?`
- `syncRangeStart DateTime?`
- `syncRangeEnd DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

**Relation** :
- `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`

**À appliquer** :
```bash
npx prisma migrate dev
npx prisma generate
```

---

## 🔍 Logs

**Format** : `[outlook-sync-incremental]`

**Exemples** :
- `[outlook-sync-incremental] Starting initial sync for user {userId}`
- `[outlook-sync-incremental] Starting incremental sync for user {userId}`
- `[outlook-sync-incremental] Fetched {count} delta events from Microsoft Graph`
- `[outlook-sync-incremental] Fetched {count} delta events, more pages available`
- `[outlook-sync-incremental] Error processing event {eventId}: {errorMessage}`

**Note** : Les tokens ne sont jamais loggés.

---

## ✅ Cas d'usage

1. **Synchronisation initiale** : Première sync avec `/delta` (récupère tous les événements)
2. **Synchronisation incrémentale** : Syncs suivantes avec `deltaLink` (seulement les changements)
3. **Synchronisation programmée** : Appeler périodiquement pour garder les données à jour efficacement
4. **Récupération après erreur** : Le `deltaLink` permet de reprendre la sync même après interruption

---

## 🚀 Avantages de la sync incrémentale

### Performance
- ✅ Récupère seulement les changements (beaucoup plus rapide)
- ✅ Réduit la charge sur Microsoft Graph API
- ✅ Réduit la charge sur la DB (moins d'upserts)

### Fiabilité
- ✅ Détecte les suppressions (tombstones)
- ✅ Détecte les annulations (`isCancelled`)
- ✅ Gère les modifications via `lastModifiedDateTime`

### Efficacité
- ✅ Moins de données transférées
- ✅ Moins de traitements DB
- ✅ Meilleure expérience utilisateur (sync rapide)

---

## 🔄 Comparaison avec sync complète

| Aspect | Sync complète (`/sync`) | Sync incrémentale (`/sync/incremental`) |
|--------|-------------------------|------------------------------------------|
| **Endpoint Graph** | `/calendarView` | `/calendarView/delta` |
| **Données récupérées** | Tous les événements | Seulement les changements |
| **Performance** | Plus lent | Plus rapide |
| **Utilisation** | Première sync, reset | Syncs régulières |
| **Stockage** | Aucun | `deltaLink` en DB |

---

## 📝 Notes importantes

1. **Première sync** : Utilise `/delta` avec `startDateTime`/`endDateTime` (comme une sync complète)
2. **Syncs suivantes** : Utilise le `deltaLink` stocké (seulement les changements)
3. **Reset** : Pour réinitialiser, supprimer l'entrée `OutlookSyncState` pour l'utilisateur
4. **Plage de sync** : La plage (`startDateTime`/`endDateTime`) est stockée mais le `deltaLink` peut couvrir une plage différente selon Microsoft Graph
5. **Tombstones** : Les événements supprimés sont détectés et supprimés de la DB
6. **Annulations** : Les événements annulés sont marqués ou supprimés selon le cas

---

## 🔄 Intégration avec l'UI (futur)

L'endpoint est prêt pour être intégré dans l'UI. Exemple d'utilisation :

```typescript
async function syncOutlookIncremental() {
  try {
    const response = await fetch('/api/integrations/outlook/sync/incremental?range=default', {
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

---

## 🚀 Améliorations futures

- [ ] Ajouter un endpoint pour réinitialiser la sync (supprimer `OutlookSyncState`)
- [ ] Ajouter un endpoint pour forcer une sync complète (ignorer `deltaLink`)
- [ ] Ajouter des métriques (temps de synchronisation, taux de succès)
- [ ] Ajouter un webhook pour synchronisation en temps réel
- [ ] Ajouter un endpoint pour vérifier l'état de la sync (`lastSyncAt`, `hasDeltaLink`)

