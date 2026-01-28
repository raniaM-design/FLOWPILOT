# Analyse de l'implémentation OAuth Microsoft/Outlook

## 📋 Résumé exécutif

**Lib utilisée** : **OAuth custom** (pas NextAuth, MSAL, ou Passport)
- Implémentation manuelle du flux OAuth 2.0 Authorization Code
- Utilisation directe des endpoints Microsoft OAuth v2.0
- Client Graph API custom avec refresh token automatique

## 🔍 Fichiers principaux

### 1. Configuration OAuth
- **Fichier** : `app/api/outlook/connect/route.ts`
- **Rôle** : Initie le flux OAuth, génère le state CSRF, redirige vers Microsoft
- **Authority/Issuer** : `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`
- **Tenant** : `process.env.MICROSOFT_TENANT_ID` (actuellement : tenant ID spécifique)

### 2. Callback OAuth
- **Fichier** : `app/api/outlook/callback/route.ts`
- **Rôle** : Reçoit le code, échange contre tokens, stocke en DB
- **Token endpoint** : `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`

### 3. Client Graph API
- **Fichier** : `lib/outlook/graph.ts`
- **Rôle** : Utilitaires pour appeler Microsoft Graph API
- **Fonctions** :
  - `getOutlookAccount(userId)` : Récupère le compte depuis DB
  - `refreshAccessTokenIfNeeded(userId)` : Rafraîchit automatiquement le token
  - `fetchOutlookEvents(userId, fromISO, toISO)` : Liste les événements
  - `fetchOutlookEventById(userId, eventId)` : Détail d'un événement

### 4. Stockage des tokens
- **Modèle Prisma** : `OutlookAccount`
- **Champs** :
  - `accessToken` : Token d'accès (string)
  - `refreshToken` : Token de rafraîchissement (string)
  - `expiresAt` : Date d'expiration (DateTime)
  - `scope` : Scopes accordés (string?)
  - `tokenType` : Type de token (string?, default "Bearer")

## 🔐 Configuration actuelle

### Authority/Issuer
```
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
```

**Tenant actuel** : Tenant ID spécifique (UUID, ex: `79eee8d7-0044-4841-bbf2-ab3b457dd5ce`)
- ❌ Ne supporte **que** les comptes de ce tenant Azure AD
- ❌ Ne supporte **pas** les comptes Microsoft personnels (@outlook.com, @hotmail.com, @live.com)

### Scopes demandés
```typescript
"offline_access User.Read Calendars.Read openid profile email"
```

**Détail des scopes** :
- `offline_access` : Pour obtenir un refresh_token
- `User.Read` : Lecture du profil utilisateur
- `Calendars.Read` : Lecture du calendrier
- `openid` : Authentification OpenID Connect
- `profile` : Informations de profil
- `email` : Adresse email

✅ **Ces scopes sont compatibles avec les comptes Microsoft personnels**

### Endpoints Graph API utilisés

1. **Liste des événements** :
   ```
   GET https://graph.microsoft.com/v1.0/me/calendarView
   Query params: startDateTime, endDateTime, $orderby, $select
   ```

2. **Détail d'un événement** :
   ```
   GET https://graph.microsoft.com/v1.0/me/events/{eventId}
   Query params: $select
   ```

3. **Refresh token** :
   ```
   POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
   Body: grant_type=refresh_token, refresh_token=...
   ```

## 🎯 Plan de modifications pour supporter les comptes Microsoft personnels

### Option 1 : Utiliser `/common` (Recommandé)

**Avantages** :
- Supporte **tous** les types de comptes (organisationnels + personnels)
- Pas de changement de code nécessaire
- Un seul endpoint à gérer

**Modifications requises** :

#### 1. Configuration Azure AD
- Dans Azure Portal > App Registration > Authentication
- Changer "Supported account types" vers :
  **"Accounts in any organizational directory and personal Microsoft accounts"**
- Sauvegarder

#### 2. Mise à jour `.env.local`
```env
# Remplacer le tenant ID spécifique par "common"
MICROSOFT_TENANT_ID=common
```

#### 3. Aucun changement de code nécessaire
Le code actuel utilise déjà `process.env.MICROSOFT_TENANT_ID || "common"`, donc il fonctionnera automatiquement.

**Fichiers à modifier** : Aucun (seulement `.env.local`)

---

### Option 2 : Utiliser `/consumers` (Comptes personnels uniquement)

**Avantages** :
- Spécialisé pour les comptes personnels
- Plus restrictif (sécurité)

**Modifications requises** :

#### 1. Configuration Azure AD
- Même configuration que Option 1 (multi-tenant)

#### 2. Mise à jour `.env.local`
```env
MICROSOFT_TENANT_ID=consumers
```

#### 3. Aucun changement de code nécessaire
Le code fonctionnera avec `consumers` comme tenant.

**Fichiers à modifier** : Aucun (seulement `.env.local`)

---

### Option 3 : Détection automatique du type de compte (Avancé)

**Avantages** :
- Supporte les deux types de comptes
- Détection automatique

**Modifications requises** :

#### 1. Modifier `app/api/outlook/connect/route.ts`
```typescript
// Détecter si l'utilisateur veut utiliser un compte personnel
const accountType = searchParams.get("account_type") || "organization"; // "organization" | "personal"

// Utiliser le bon tenant selon le type
const tenantId = accountType === "personal" 
  ? "consumers" 
  : (process.env.MICROSOFT_TENANT_ID || "common");
```

#### 2. Ajouter un choix dans l'UI
- Ajouter un bouton "Compte personnel" dans `/app/integrations/outlook/page.tsx`
- Rediriger vers `/api/outlook/connect?account_type=personal`

**Fichiers à modifier** :
- `app/api/outlook/connect/route.ts`
- `app/app/integrations/outlook/page.tsx`

---

## ✅ Recommandation : Option 1 (`/common`)

**Pourquoi** :
- ✅ Modification minimale (seulement `.env.local` + config Azure)
- ✅ Supporte tous les types de comptes
- ✅ Pas de changement de code
- ✅ Standard Microsoft recommandé

**Étapes** :
1. Configurer l'app Azure AD comme multi-tenant
2. Changer `MICROSOFT_TENANT_ID=common` dans `.env.local`
3. Redémarrer le serveur
4. Tester avec un compte Microsoft personnel

## 🔍 Vérifications nécessaires

### Scopes compatibles
✅ Les scopes actuels fonctionnent avec les comptes personnels :
- `User.Read` : ✅ Supporté
- `Calendars.Read` : ✅ Supporté
- `offline_access` : ✅ Supporté

### Endpoints Graph API
✅ Les endpoints utilisés fonctionnent avec les comptes personnels :
- `/me/calendarView` : ✅ Supporté
- `/me/events/{id}` : ✅ Supporté

### Stockage des tokens
✅ Le modèle `OutlookAccount` fonctionne pour tous les types de comptes (pas de changement nécessaire)

## 📝 Checklist de migration

- [ ] Configurer l'app Azure AD comme multi-tenant
- [ ] Mettre à jour `.env.local` avec `MICROSOFT_TENANT_ID=common`
- [ ] Redémarrer le serveur
- [ ] Tester avec un compte organisationnel (vérifier que ça fonctionne toujours)
- [ ] Tester avec un compte Microsoft personnel (@outlook.com)
- [ ] Vérifier que les tokens sont bien stockés
- [ ] Vérifier que les événements sont bien récupérés

## 🚨 Points d'attention

1. **Consentement utilisateur** : Les comptes personnels devront donner leur consentement lors de la première connexion
2. **Refresh token** : Le refresh token fonctionne de la même manière pour les deux types de comptes
3. **Rate limiting** : Les limites Graph API peuvent être différentes pour les comptes personnels
4. **Permissions** : Certaines permissions peuvent ne pas être disponibles pour les comptes personnels (vérifier la doc Microsoft)

