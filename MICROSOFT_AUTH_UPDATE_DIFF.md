# Modifications pour supporter comptes pro + comptes Microsoft personnels

## 📋 Résumé des modifications

**Objectif** : Utiliser `/common` comme authority par défaut pour supporter à la fois les comptes professionnels et les comptes Microsoft personnels.

**Impact** : Aucun changement de comportement pour les comptes pro existants, ajout du support pour les comptes personnels.

---

## 🔧 Modifications de code

### 1. `app/api/outlook/connect/route.ts`

#### Modification 1 : Commentaire mis à jour
```diff
-    // IMPORTANT: Si l'app n'est pas multi-tenant, utiliser le tenant ID spécifique (pas "common")
+    // IMPORTANT: Utiliser "common" pour supporter comptes pro + comptes Microsoft personnels
+    // Si MICROSOFT_TENANT_ID est défini, l'utiliser (pour compatibilité), sinon utiliser "common"
     const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
```

#### Modification 2 : Scopes par défaut réorganisés
```diff
-    const scopesRaw = process.env.MICROSOFT_SCOPES || "offline_access User.Read Calendars.Read openid profile email";
+    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
+    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
+    const scopesRaw = process.env.MICROSOFT_SCOPES || defaultScopes;
     const scopes = scopesRaw.trim().replace(/^["']|["']$/g, "");
```

**Note** : L'ordre des scopes a été réorganisé pour mettre `openid` et `profile` en premier (recommandation Microsoft).

#### Modification 3 : Log mis à jour
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

### 2. `app/api/outlook/callback/route.ts`

#### Modification 1 : Commentaire mis à jour
```diff
-    // IMPORTANT: Utiliser le même tenant que dans /connect (pas "common" si app non multi-tenant)
+    // IMPORTANT: Utiliser le même tenant que dans /connect ("common" pour comptes pro + personnels)
     const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
```

#### Modification 2 : Scopes par défaut réorganisés
```diff
-    const scopesRaw = process.env.MICROSOFT_SCOPES || "offline_access User.Read Calendars.Read openid profile email";
+    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
+    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
+    const scopesRaw = process.env.MICROSOFT_SCOPES || defaultScopes;
     const scopes = scopesRaw.trim().replace(/^["']|["']$/g, "");
```

---

### 3. `lib/outlook/graph.ts`

#### Modification 1 : Commentaire mis à jour
```diff
-    // IMPORTANT: Utiliser le même tenant que dans les autres endpoints
+    // IMPORTANT: Utiliser le même tenant que dans les autres endpoints ("common" pour comptes pro + personnels)
     const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
```

#### Modification 2 : Scopes par défaut réorganisés
```diff
-    const scopes = process.env.MICROSOFT_SCOPES || "offline_access User.Read Calendars.Read openid profile email";
+    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
+    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
+    const scopes = process.env.MICROSOFT_SCOPES || defaultScopes;
```

---

## 🔐 Variables d'environnement

### Configuration recommandée (comptes pro + personnels)

**Fichier** : `.env.local`

```env
# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook/callback
MICROSOFT_SCOPES=openid profile offline_access User.Read Calendars.Read email
```

### Variables détaillées

| Variable | Description | Valeur recommandée | Obligatoire |
|----------|-------------|-------------------|-------------|
| `MICROSOFT_CLIENT_ID` | Application (client) ID depuis Azure AD | UUID | ✅ Oui |
| `MICROSOFT_CLIENT_SECRET` | Client secret depuis Azure AD | String | ✅ Oui |
| `MICROSOFT_TENANT_ID` | Tenant ID ou "common" | `common` (pour pro + personnels) | ⚠️ Optionnel (défaut: `common`) |
| `MICROSOFT_REDIRECT_URI` | URI de redirection OAuth | `http://localhost:3000/api/outlook/callback` (dev) | ⚠️ Optionnel (défaut: `http://localhost:3000/api/outlook/callback`) |
| `MICROSOFT_SCOPES` | Scopes OAuth demandés | `openid profile offline_access User.Read Calendars.Read email` | ⚠️ Optionnel (défaut: voir ci-dessus) |

### Notes importantes

1. **`MICROSOFT_TENANT_ID=common`** :
   - ✅ Supporte comptes professionnels (tous les tenants Azure AD)
   - ✅ Supporte comptes Microsoft personnels (@outlook.com, @hotmail.com, @live.com)
   - ⚠️ Nécessite que l'app Azure AD soit configurée comme multi-tenant

2. **`MICROSOFT_SCOPES`** :
   - Si non défini, utilise les scopes par défaut : `openid profile offline_access User.Read Calendars.Read email`
   - L'ordre recommandé : `openid profile` en premier, puis `offline_access`, puis les permissions spécifiques
   - Tous les scopes sont compatibles avec les comptes pro et personnels

3. **Compatibilité** :
   - Si `MICROSOFT_TENANT_ID` n'est pas défini → utilise `common` (support pro + personnels)
   - Si `MICROSOFT_TENANT_ID` est défini avec un tenant ID spécifique → utilise ce tenant uniquement (compatibilité avec config existante)

---

## 📝 Configuration Azure AD requise

Pour que `/common` fonctionne, l'app Azure AD **doit** être configurée comme multi-tenant :

1. **Azure Portal** > **App Registration** > Votre app
2. **Authentication** > **Supported account types**
3. Sélectionner : **"Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox)"**
4. **Sauvegarder**

---

## ✅ Vérifications post-modification

### 1. Vérifier les endpoints utilisés

Les endpoints OAuth v2.0 sont déjà utilisés :
- ✅ Authorize : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- ✅ Token : `https://login.microsoftonline.com/common/oauth2/v2.0/token`

### 2. Vérifier les scopes

Les scopes requis sont présents :
- ✅ `openid` : Authentification OpenID Connect
- ✅ `profile` : Informations de profil
- ✅ `offline_access` : Refresh token
- ✅ `User.Read` : Lecture du profil utilisateur
- ✅ `Calendars.Read` : Lecture du calendrier
- ✅ `email` : Adresse email

### 3. Tester avec un compte professionnel

```
http://localhost:3000/api/outlook/connect
```
- ✅ Devrait fonctionner comme avant
- ✅ Tokens stockés correctement
- ✅ Événements récupérés correctement

### 4. Tester avec un compte Microsoft personnel

- Se connecter avec un compte @outlook.com, @hotmail.com, ou @live.com
- ✅ Devrait fonctionner de la même manière
- ✅ Tokens stockés correctement
- ✅ Événements récupérés correctement

---

## 🔄 Compatibilité avec l'existant

### Comptes professionnels existants

✅ **Aucun impact** :
- Les tokens existants continuent de fonctionner
- Le refresh token fonctionne de la même manière
- Les endpoints Graph API sont identiques

### Migration progressive

Si vous avez déjà des comptes connectés avec un tenant spécifique :

1. **Option A (Recommandée)** : Utiliser `/common` pour tous
   - Mettre à jour `.env.local` : `MICROSOFT_TENANT_ID=common`
   - Les nouveaux logins utiliseront `/common`
   - Les tokens existants continuent de fonctionner jusqu'à expiration

2. **Option B** : Garder le tenant spécifique temporairement
   - Garder `MICROSOFT_TENANT_ID=<tenant-id>` dans `.env.local`
   - Les nouveaux logins utiliseront le tenant spécifique
   - Migrer progressivement vers `/common` plus tard

---

## 📊 Résumé des modifications

| Fichier | Lignes modifiées | Type de modification |
|---------|-----------------|---------------------|
| `app/api/outlook/connect/route.ts` | 3 | Commentaires + scopes par défaut + log |
| `app/api/outlook/callback/route.ts` | 2 | Commentaires + scopes par défaut |
| `lib/outlook/graph.ts` | 2 | Commentaires + scopes par défaut |
| `.env.local` | 1 | `MICROSOFT_TENANT_ID=common` |

**Total** : 7 lignes modifiées dans 3 fichiers + 1 variable d'environnement

---

## 🚀 Déploiement

1. **Appliquer les modifications de code** (déjà fait)
2. **Mettre à jour `.env.local`** :
   ```env
   MICROSOFT_TENANT_ID=common
   ```
3. **Configurer Azure AD** comme multi-tenant (voir section ci-dessus)
4. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```
5. **Tester** avec un compte professionnel et un compte personnel

---

## ✅ Résultat attendu

- ✅ `/api/outlook/connect` redirige vers `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- ✅ Les comptes professionnels peuvent se connecter
- ✅ Les comptes Microsoft personnels peuvent se connecter
- ✅ Les tokens sont stockés correctement pour les deux types de comptes
- ✅ Les événements sont récupérés correctement pour les deux types de comptes

