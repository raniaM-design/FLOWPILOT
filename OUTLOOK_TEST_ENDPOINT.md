# Endpoint de test Outlook - Documentation

## 📋 Endpoint créé

**Route** : `GET /api/integrations/outlook/test`

**Description** : Endpoint sécurisé pour tester l'intégration Outlook. Vérifie que l'authentification et les appels Microsoft Graph API fonctionnent correctement.

---

## 🔐 Sécurité

- ✅ Authentification requise (vérifie `getCurrentUserId()`)
- ✅ Utilise `getValidMicrosoftAccessToken()` pour obtenir un token valide avec refresh automatique
- ✅ Gestion d'erreurs complète avec messages clairs

---

## 📥 Requête

**Méthode** : `GET`

**Headers** :
- Cookie de session (géré automatiquement par `getCurrentUserId()`)

**Exemple** :
```bash
curl -X GET http://localhost:3000/api/integrations/outlook/test \
  --cookie "session=..."
```

---

## 📤 Réponse de succès

**Status** : `200 OK`

**Body** :
```json
{
  "success": true,
  "user": {
    "displayName": "John Doe",
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "john.doe@example.com"
  },
  "events": {
    "count": 3,
    "sample": [
      {
        "id": "event-id-1",
        "subject": "Réunion équipe",
        "start": "2024-01-15T10:00:00Z",
        "end": "2024-01-15T11:00:00Z"
      },
      {
        "id": "event-id-2",
        "subject": "Point projet",
        "start": "2024-01-16T14:00:00Z",
        "end": "2024-01-16T15:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

---

## ❌ Réponses d'erreur

### 401 - Non authentifié

```json
{
  "error": "Unauthorized",
  "message": "Vous devez être connecté pour tester l'intégration Outlook"
}
```

### 404 - Compte Outlook non connecté

```json
{
  "error": "NotConnected",
  "message": "Aucun compte Outlook connecté. Veuillez d'abord connecter votre compte Outlook.",
  "hint": "Allez sur /app/integrations/outlook pour connecter votre compte"
}
```

### 401 - Token invalide (Microsoft Graph)

```json
{
  "error": "Unauthorized",
  "message": "Token d'accès invalide ou expiré",
  "details": "Microsoft Graph a rejeté le token",
  "hint": "Essayez de vous reconnecter à Outlook"
}
```

### 403 - Permissions insuffisantes

```json
{
  "error": "Forbidden",
  "message": "Permissions insuffisantes pour accéder à votre calendrier",
  "details": "Le token n'a pas les permissions 'Calendars.Read'",
  "hint": "Vérifiez que les scopes 'Calendars.Read' sont accordés"
}
```

### 429 - Rate limiting

```json
{
  "error": "RateLimited",
  "message": "Trop de requêtes vers Microsoft Graph. Veuillez réessayer plus tard.",
  "retryAfter": 60,
  "hint": "Attendez 60 secondes avant de réessayer"
}
```

### 502 - Erreur Microsoft Graph (5xx)

```json
{
  "error": "MicrosoftGraphError",
  "message": "Erreur serveur Microsoft Graph",
  "status": 503,
  "details": "Service temporairement indisponible",
  "hint": "Réessayez dans quelques instants"
}
```

### 500 - Erreur serveur interne

```json
{
  "error": "InternalServerError",
  "message": "Une erreur interne s'est produite lors du test de l'intégration Outlook",
  "details": "..." // Uniquement en développement
}
```

---

## 🔍 Appels Microsoft Graph effectués

### 1. GET `/me`
**Objectif** : Récupérer les informations de l'utilisateur Microsoft

**Endpoint** : `https://graph.microsoft.com/v1.0/me`

**Scopes requis** : `User.Read`

**Données utilisées** :
- `displayName` : Nom d'affichage
- `id` : ID Microsoft (objectId)
- `mail` ou `userPrincipalName` : Email

---

### 2. GET `/me/calendar/events`
**Objectif** : Récupérer les événements du calendrier (7 prochains jours)

**Endpoint** : `https://graph.microsoft.com/v1.0/me/calendar/events`

**Paramètres** :
- `$top=5` : Limite à 5 événements
- `$filter=start/dateTime ge '{today}' and start/dateTime le '{nextWeek}'` : Événements des 7 prochains jours
- `$orderby=start/dateTime` : Tri par date de début
- `$select=id,subject,start,end` : Sélection des champs

**Scopes requis** : `Calendars.Read`

**Données utilisées** :
- `id` : ID de l'événement
- `subject` : Titre de l'événement
- `start.dateTime` : Date/heure de début
- `end.dateTime` : Date/heure de fin

---

## 🧪 Tests

### Test manuel avec curl

```bash
# 1. Obtenir le cookie de session (via login)
# 2. Appeler l'endpoint de test
curl -X GET http://localhost:3000/api/integrations/outlook/test \
  --cookie "session=VOTRE_SESSION_TOKEN"
```

### Test depuis le navigateur

1. Se connecter à PILOTYS
2. Ouvrir la console développeur (F12)
3. Exécuter :
```javascript
fetch('/api/integrations/outlook/test', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test depuis l'interface

Ajouter un bouton "Tester la connexion" sur la page `/app/integrations/outlook` qui appelle cet endpoint.

---

## 📊 Logs

**Format** : `[outlook-test]`

**Exemples** :
- `[outlook-test] Failed to get access token for user {userId}: {error}`
- `[outlook-test] Microsoft Graph error for user {userId}: {status} {errorText}`
- `[outlook-test] Unexpected server error: {errorMessage}`

**Note** : Les tokens ne sont jamais loggés.

---

## ✅ Cas d'usage

1. **Vérification de connexion** : Vérifier qu'un compte Outlook est bien connecté
2. **Test de permissions** : Vérifier que les scopes sont correctement accordés
3. **Debug** : Diagnostiquer les problèmes d'intégration Outlook
4. **Monitoring** : Surveiller la santé de l'intégration Outlook

---

## 🔄 Intégration avec l'UI

### Exemple d'utilisation dans un composant React

```typescript
async function testOutlookConnection() {
  try {
    const response = await fetch('/api/integrations/outlook/test', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du test');
    }
    
    const data = await response.json();
    console.log('Test réussi:', data);
    // Afficher les résultats dans l'UI
  } catch (error) {
    console.error('Test échoué:', error);
    // Afficher l'erreur dans l'UI
  }
}
```

---

## 🚀 Améliorations futures

- [ ] Ajouter un cache pour éviter trop d'appels Graph API
- [ ] Ajouter des métriques (temps de réponse, taux de succès)
- [ ] Ajouter un endpoint de test simplifié (sans événements)
- [ ] Ajouter un endpoint de test complet (avec plus d'informations)

---

## 📝 Notes

- L'endpoint utilise `getValidMicrosoftAccessToken()` qui gère automatiquement le refresh du token
- Les événements sont filtrés pour les 7 prochains jours uniquement
- Seulement 5 événements sont retournés (échantillon)
- Les erreurs sont détaillées pour faciliter le debug

