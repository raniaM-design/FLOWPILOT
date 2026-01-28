# Plan de modifications minimal pour supporter les comptes Microsoft personnels

## 📊 Analyse de l'implémentation actuelle

### Lib utilisée
**OAuth custom** (pas NextAuth, MSAL, ou Passport)
- Implémentation manuelle du flux OAuth 2.0 Authorization Code
- Utilisation directe des endpoints Microsoft OAuth v2.0

### Fichiers principaux

1. **Configuration OAuth** : `app/api/outlook/connect/route.ts`
2. **Callback OAuth** : `app/api/outlook/callback/route.ts`
3. **Client Graph API** : `lib/outlook/graph.ts`
4. **Stockage tokens** : `prisma/schema.prisma` → modèle `OutlookAccount`

### Authority/Issuer actuel
```
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
```

**Tenant actuel** : Tenant ID spécifique (`79eee8d7-0044-4841-bbf2-ab3b457dd5ce`)
- ❌ Ne supporte que les comptes de ce tenant Azure AD
- ❌ Ne supporte pas les comptes Microsoft personnels

### Scopes demandés
```
offline_access User.Read Calendars.Read openid profile email
```
✅ **Compatibles avec les comptes Microsoft personnels**

### Endpoints Graph API utilisés
1. `GET https://graph.microsoft.com/v1.0/me/calendarView` - Liste événements
2. `GET https://graph.microsoft.com/v1.0/me/events/{id}` - Détail événement
3. `POST https://login.microsoftonline.com/{TENANT}/oauth2/v2.0/token` - Refresh token

✅ **Tous compatibles avec les comptes Microsoft personnels**

### Stockage des tokens
- **Modèle** : `OutlookAccount` (Prisma)
- **Champs** : `accessToken`, `refreshToken`, `expiresAt`, `scope`, `tokenType`
- ✅ **Aucun changement nécessaire** (fonctionne pour tous les types de comptes)

---

## 🎯 Plan de modifications minimal (Option recommandée)

### Objectif
Supporter les comptes Microsoft personnels (@outlook.com, @hotmail.com, @live.com) avec **modifications minimales**.

### Solution : Utiliser `/common` comme tenant

**Avantages** :
- ✅ **Aucun changement de code** nécessaire
- ✅ Supporte **tous** les types de comptes (organisationnels + personnels)
- ✅ Standard Microsoft recommandé
- ✅ Modification uniquement de la configuration

---

## 📝 Modifications requises

### 1. Configuration Azure AD (1 seule modification)

**Dans Azure Portal** :
1. Allez dans votre App Registration
2. **Authentication** > **Supported account types**
3. Sélectionnez : **"Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox)"**
4. **Sauvegarder**

**Impact** : L'app devient multi-tenant et supporte les comptes personnels

### 2. Mise à jour `.env.local` (1 seule ligne)

**Avant** :
```env
MICROSOFT_TENANT_ID=79eee8d7-0044-4841-bbf2-ab3b457dd5ce
```

**Après** :
```env
MICROSOFT_TENANT_ID=common
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

---

## ✅ Aucun changement de code nécessaire

Le code actuel utilise déjà :
```typescript
const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
```

Donc il fonctionnera automatiquement avec `common` une fois `.env.local` mis à jour.

---

## 🔍 Vérifications post-migration

### 1. Tester avec un compte organisationnel
```
http://localhost:3000/api/outlook/connect
```
- ✅ Devrait toujours fonctionner
- ✅ Les tokens doivent être stockés correctement
- ✅ Les événements doivent être récupérés

### 2. Tester avec un compte Microsoft personnel
- Se connecter avec un compte @outlook.com, @hotmail.com, ou @live.com
- ✅ Devrait fonctionner de la même manière
- ✅ Les tokens doivent être stockés correctement
- ✅ Les événements doivent être récupérés

### 3. Vérifier les logs
```
[outlook] tenant: common
[outlook-oauth] authorize url: https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...
```

---

## 🚨 Points d'attention

1. **Consentement utilisateur** : Les comptes personnels devront donner leur consentement lors de la première connexion (comportement normal OAuth)

2. **Refresh token** : Fonctionne de la même manière pour les deux types de comptes (pas de changement nécessaire)

3. **Rate limiting** : Les limites Graph API peuvent être différentes pour les comptes personnels (vérifier la doc Microsoft si nécessaire)

4. **Permissions** : Les scopes actuels (`User.Read`, `Calendars.Read`) sont supportés pour les comptes personnels

---

## 📋 Checklist de migration

- [ ] Configurer l'app Azure AD comme multi-tenant
- [ ] Mettre à jour `.env.local` : `MICROSOFT_TENANT_ID=common`
- [ ] Redémarrer le serveur
- [ ] Tester avec un compte organisationnel (vérifier que ça fonctionne toujours)
- [ ] Tester avec un compte Microsoft personnel (@outlook.com)
- [ ] Vérifier que les tokens sont bien stockés dans `OutlookAccount`
- [ ] Vérifier que les événements sont bien récupérés via Graph API

---

## 🔄 Alternative : Détection automatique (Optionnel, plus complexe)

Si vous voulez permettre à l'utilisateur de choisir entre compte organisationnel et personnel :

### Modifications nécessaires

1. **Modifier `app/api/outlook/connect/route.ts`** :
```typescript
// Lire le paramètre account_type depuis query params
const accountType = request.nextUrl.searchParams.get("account_type") || "organization";

// Utiliser le bon tenant selon le type
const tenantId = accountType === "personal" 
  ? "consumers"  // Comptes personnels uniquement
  : (process.env.MICROSOFT_TENANT_ID || "common"); // Organisationnel ou common
```

2. **Modifier `app/app/integrations/outlook/page.tsx`** :
```typescript
// Ajouter un choix dans l'UI
<Button onClick={() => window.location.href = "/api/outlook/connect?account_type=personal"}>
  Connecter avec compte personnel
</Button>
```

**⚠️ Cette option est plus complexe et n'est pas recommandée** car `/common` supporte déjà les deux types de comptes.

---

## 📊 Résumé

**Modifications minimales** :
- ✅ 1 configuration Azure AD (5 minutes)
- ✅ 1 ligne dans `.env.local` (30 secondes)
- ✅ Redémarrer le serveur (1 minute)

**Total** : **~7 minutes** pour supporter les comptes Microsoft personnels

**Aucun changement de code nécessaire** ✅

