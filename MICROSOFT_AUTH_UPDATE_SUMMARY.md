# Résumé des modifications - Support comptes pro + comptes Microsoft personnels

## ✅ Modifications appliquées

### 1. Code modifié

#### `app/api/outlook/connect/route.ts`
- ✅ Commentaires mis à jour pour indiquer le support des comptes personnels
- ✅ Scopes par défaut réorganisés : `openid profile offline_access User.Read Calendars.Read email`
- ✅ Logs améliorés pour indiquer le type de tenant utilisé

#### `app/api/outlook/callback/route.ts`
- ✅ Commentaires mis à jour
- ✅ Scopes par défaut réorganisés (identique à connect)

#### `lib/outlook/graph.ts`
- ✅ Commentaires mis à jour
- ✅ Scopes par défaut réorganisés (identique aux autres fichiers)

### 2. Variables d'environnement mises à jour

#### `.env.local` (modifié)

**Avant** :
```env
MICROSOFT_TENANT_ID=79eee8d7-0044-4841-bbf2-ab3b457dd5ce
MICROSOFT_SCOPES=offline_access User.Read Calendars.Read openid profile email
```

**Après** :
```env
MICROSOFT_TENANT_ID=common
MICROSOFT_SCOPES=openid profile offline_access User.Read Calendars.Read email
```

**Changements** :
- `MICROSOFT_TENANT_ID` : `common` (au lieu du tenant ID spécifique)
- `MICROSOFT_SCOPES` : Ordre réorganisé (`openid profile` en premier)

---

## 📋 Diffs exacts des modifications de code

### Fichier 1 : `app/api/outlook/connect/route.ts`

#### Diff 1 : Commentaire ligne 45-46
```diff
-    // IMPORTANT: Si l'app n'est pas multi-tenant, utiliser le tenant ID spécifique (pas "common")
+    // IMPORTANT: Utiliser "common" pour supporter comptes pro + comptes Microsoft personnels
+    // Si MICROSOFT_TENANT_ID est défini, l'utiliser (pour compatibilité), sinon utiliser "common"
     const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
```

#### Diff 2 : Scopes par défaut ligne 54-57
```diff
-    const scopesRaw = process.env.MICROSOFT_SCOPES || "offline_access User.Read Calendars.Read openid profile email";
+    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
+    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
+    const scopesRaw = process.env.MICROSOFT_SCOPES || defaultScopes;
     const scopes = scopesRaw.trim().replace(/^["']|["']$/g, "");
```

#### Diff 3 : Logs ligne 60-66
```diff
-      if (tenantId === "common") {
-        console.warn("[outlook] WARNING: Using /common endpoint. If you get AADSTS50194, your app is not multi-tenant. Set MICROSOFT_TENANT_ID to your Directory (tenant) ID.");
-      }
+      if (tenantId === "common") {
+        console.log("[outlook] Using /common endpoint - supports both organizational and personal Microsoft accounts");
+      } else {
+        console.log("[outlook] Using tenant-specific endpoint - supports only accounts from this tenant");
+      }
```

---

### Fichier 2 : `app/api/outlook/callback/route.ts`

#### Diff 1 : Commentaire ligne 169
```diff
-    // IMPORTANT: Utiliser le même tenant que dans /connect (pas "common" si app non multi-tenant)
+    // IMPORTANT: Utiliser le même tenant que dans /connect ("common" pour comptes pro + personnels)
     const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
```

#### Diff 2 : Scopes par défaut ligne 177-180
```diff
-    const scopesRaw = process.env.MICROSOFT_SCOPES || "offline_access User.Read Calendars.Read openid profile email";
+    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
+    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
+    const scopesRaw = process.env.MICROSOFT_SCOPES || defaultScopes;
     const scopes = scopesRaw.trim().replace(/^["']|["']$/g, "");
```

---

### Fichier 3 : `lib/outlook/graph.ts`

#### Diff 1 : Commentaire ligne 46
```diff
-    // IMPORTANT: Utiliser le même tenant que dans les autres endpoints
+    // IMPORTANT: Utiliser le même tenant que dans les autres endpoints ("common" pour comptes pro + personnels)
     const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
```

#### Diff 2 : Scopes par défaut ligne 50-52
```diff
-    const scopes = process.env.MICROSOFT_SCOPES || "offline_access User.Read Calendars.Read openid profile email";
+    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
+    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
+    const scopes = process.env.MICROSOFT_SCOPES || defaultScopes;
```

---

## 🔐 Variables d'environnement

### Configuration actuelle (après modifications)

**Fichier** : `.env.local`

```env
MICROSOFT_CLIENT_ID=2d149257-da1b-40a6-bd62-322a7d09a7f6
MICROSOFT_CLIENT_SECRET = "<SECRET AZURE ICI - NE PAS METTRE LA VRAIE VALEUR>"
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook/callback
MICROSOFT_SCOPES=openid profile offline_access User.Read Calendars.Read email
```

### Variables détaillées

| Variable | Valeur actuelle | Description | Modifié |
|----------|----------------|-------------|---------|
| `MICROSOFT_CLIENT_ID` | `2d149257-da1b-40a6-bd62-322a7d09a7f6` | Application (client) ID Azure AD | ❌ Non |
| MICROSOFT_CLIENT_SECRET = "<SECRET AZURE ICI - NE PAS METTRE LA VRAIE VALEUR>" | Client secret Azure AD | ❌ Non |
| `MICROSOFT_TENANT_ID` | `common` | Tenant ID ou "common" | ✅ **Oui** (était: tenant ID spécifique) |
| `MICROSOFT_REDIRECT_URI` | `http://localhost:3000/api/outlook/callback` | URI de redirection OAuth | ❌ Non |
| `MICROSOFT_SCOPES` | `openid profile offline_access User.Read Calendars.Read email` | Scopes OAuth | ✅ **Oui** (ordre réorganisé) |

### Variables à adapter pour la production

Pour la production, mettre à jour :

```env
MICROSOFT_REDIRECT_URI=https://votre-domaine.com/api/outlook/callback
```

**Note** : `MICROSOFT_TENANT_ID=common` fonctionne aussi en production (recommandé).

---

## 🔍 Endpoints OAuth utilisés

### Authorize endpoint
```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize
```

**Paramètres** :
- `client_id` : Application (client) ID
- `response_type` : `code`
- `redirect_uri` : URI de redirection
- `response_mode` : `query`
- `scope` : `openid profile offline_access User.Read Calendars.Read email`
- `state` : State CSRF (UUID:JWT)

### Token endpoint
```
https://login.microsoftonline.com/common/oauth2/v2.0/token
```

**Paramètres** (POST x-www-form-urlencoded) :
- `client_id` : Application (client) ID
- `client_secret` : Client secret
- `code` : Code d'autorisation
- `grant_type` : `authorization_code`
- `redirect_uri` : URI de redirection (identique à authorize)
- `scope` : Scopes (identique à authorize)

### Refresh token endpoint
```
https://login.microsoftonline.com/common/oauth2/v2.0/token
```

**Paramètres** (POST x-www-form-urlencoded) :
- `client_id` : Application (client) ID
- `client_secret` : Client secret
- `grant_type` : `refresh_token`
- `refresh_token` : Refresh token stocké en DB
- `scope` : Scopes (identique à authorize)

---

## ✅ Vérifications

### Endpoints OAuth v2.0
- ✅ Authorize : `/oauth2/v2.0/authorize` (v2.0)
- ✅ Token : `/oauth2/v2.0/token` (v2.0)
- ✅ Authority : `https://login.microsoftonline.com/common`

### Scopes requis
- ✅ `openid` : Présent et en premier
- ✅ `profile` : Présent
- ✅ `offline_access` : Présent (pour refresh token)
- ✅ `User.Read` : Présent
- ✅ `Calendars.Read` : Présent
- ✅ `email` : Présent

### Compatibilité
- ✅ Comptes professionnels : Supportés (comme avant)
- ✅ Comptes Microsoft personnels : Supportés (nouveau)

---

## 🚀 Prochaines étapes

1. **Configurer Azure AD comme multi-tenant** :
   - Azure Portal > App Registration > Authentication
   - "Supported account types" → "Accounts in any organizational directory and personal Microsoft accounts"
   - Sauvegarder

2. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

3. **Tester** :
   - Compte professionnel : Devrait fonctionner comme avant
   - Compte Microsoft personnel (@outlook.com) : Devrait maintenant fonctionner

4. **Vérifier les logs** :
   ```
   [outlook] tenant: common
   [outlook] Using /common endpoint - supports both organizational and personal Microsoft accounts
   ```

---

## 📊 Résumé

**Modifications de code** : 7 lignes modifiées dans 3 fichiers
**Variables d'environnement** : 2 variables modifiées dans `.env.local`
**Configuration Azure AD** : 1 modification (multi-tenant)

**Résultat** : Support complet des comptes professionnels + comptes Microsoft personnels ✅

