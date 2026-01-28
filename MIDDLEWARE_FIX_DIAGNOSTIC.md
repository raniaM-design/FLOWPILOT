# 🔧 Diagnostic et correctif du middleware 500 en production

## 📊 Diagnostic exact du problème

### **Problème identifié**

Le middleware plantait avec une erreur `500: MIDDLEWARE_INVOCATION_FAILED` sur Vercel lorsque `FLOWPILOT_JWT_SECRET` était manquant ou mal configuré.

### **Cause racine**

1. **`getJwtSecret()` lançait une exception synchrone** si `FLOWPILOT_JWT_SECRET` était manquant en production
2. Cette exception était lancée **AVANT** le try/catch de `verifySessionToken()`
3. Même si le middleware avait un try/catch (`safeReadSession()`), l'exception pouvait remonter et crasher le middleware Vercel

### **Chaîne d'appel problématique**

```
middleware() 
  → safeReadSession() [try/catch]
    → readSessionCookie() [pas de try/catch avant le fix]
      → verifySessionToken() [try/catch]
        → getJwtSecret() [LANÇAIT UNE EXCEPTION ❌]
```

---

## ✅ Correctif appliqué

### **1. Modification de `getJwtSecret()`**

**Avant** : Lançait une exception si la clé manquait en production
```typescript
if (!envSecret && process.env.NODE_ENV === "production") {
  throw new Error("FLOWPILOT_JWT_SECRET environment variable is required");
}
```

**Après** : Retourne `null` au lieu de lancer une exception
```typescript
if (!envSecret) {
  if (process.env.NODE_ENV === "production") {
    console.error("[JWT] FLOWPILOT_JWT_SECRET is missing in production");
    return null; // ✅ Pas d'exception, retourne null
  }
  // Fallback dev...
}
```

### **2. Renforcement de `verifySessionToken()`**

- Vérifie si `getJwtSecret()` retourne `null`
- Retourne `null` (token invalide) au lieu de crasher
- Try/catch amélioré avec logging en dev uniquement

### **3. Ajout de try/catch dans `readSessionCookie()`**

- Double sécurité : try/catch explicite même si `verifySessionToken()` ne lance plus d'exception
- Logging en dev uniquement pour éviter le spam en production

### **4. Le middleware reste protégé**

Le middleware a déjà un `safeReadSession()` avec try/catch, mais maintenant les fonctions sous-jacentes ne lancent plus d'exceptions non gérées.

---

## 🔐 Variables d'environnement requises

### **OBLIGATOIRE pour le middleware**

```env
FLOWPILOT_JWT_SECRET="votre-secret-jwt-tres-long-et-aleatoire-minimum-32-caracteres"
```

**Génération du secret** :
```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Ou utiliser** : https://randomkeygen.com/ (générer une clé de 32+ caractères)

---

### **Autres variables d'environnement (pour l'application complète)**

```env
# Base de données
DATABASE_URL="postgresql://..."

# Microsoft Outlook (optionnel)
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."
MICROSOFT_TENANT_ID="common"
MICROSOFT_REDIRECT_URI="https://votre-domaine.vercel.app/api/outlook/callback"
MICROSOFT_SCOPES="openid profile offline_access User.Read Calendars.Read email"
MICROSOFT_TOKEN_ENCRYPTION_KEY="..."

# URL de l'application
APP_URL="https://votre-domaine.vercel.app"
```

---

## 🧪 Tests à effectuer

### **Test 1 : Build local**

```bash
npm run build
```

**Résultat attendu** : ✅ Build réussi sans erreur

---

### **Test 2 : Test local avec FLOWPILOT_JWT_SECRET manquant**

1. **Supprimer temporairement** `FLOWPILOT_JWT_SECRET` de `.env.local`
2. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```
3. **Tester les routes protégées** :
   - `http://localhost:3000/app` → Doit rediriger vers `/login` (pas de crash)
   - `http://localhost:3000/api/projects` → Doit retourner `401 Unauthorized` (pas de crash)

**Résultat attendu** : ✅ Pas de crash, redirection/401 normale

---

### **Test 3 : Test local avec FLOWPILOT_JWT_SECRET présent**

1. **Ajouter** `FLOWPILOT_JWT_SECRET` dans `.env.local`
2. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```
3. **Tester le login** :
   - Créer un compte via `/signup`
   - Se connecter via `/login`
   - Accéder à `/app` → Doit afficher le dashboard

**Résultat attendu** : ✅ Login et accès au dashboard fonctionnels

---

### **Test 4 : Test en production (Vercel)**

#### **4.1 Vérifier la variable d'environnement**

1. Aller sur **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Vérifier que `FLOWPILOT_JWT_SECRET` est bien configurée pour **Production**
3. Si absente, l'ajouter et **redéployer**

#### **4.2 Tester les routes protégées**

1. **Sans être connecté** :
   - `https://votre-domaine.vercel.app/app` → Doit rediriger vers `/login` (pas de 500)
   - `https://votre-domaine.vercel.app/api/projects` → Doit retourner `401 Unauthorized` (pas de 500)

2. **Après connexion** :
   - Se connecter via `/login`
   - Accéder à `/app` → Doit afficher le dashboard
   - Appeler une API → Doit fonctionner normalement

**Résultat attendu** : ✅ Pas de 500, comportement normal

---

### **Test 5 : Vérifier les logs Vercel**

1. Aller sur **Vercel Dashboard** → Votre projet → **Deployments** → Dernier déploiement → **Logs**
2. Chercher les erreurs `[JWT]` ou `[middleware]`

**Si `FLOWPILOT_JWT_SECRET` est manquant** :
- Vous devriez voir : `[JWT] FLOWPILOT_JWT_SECRET is missing in production`
- Mais **pas de crash** : le middleware doit retourner 401 ou rediriger

**Si `FLOWPILOT_JWT_SECRET` est présent** :
- Pas d'erreur `[JWT]` dans les logs
- Les requêtes authentifiées fonctionnent normalement

---

## 📋 Checklist post-fix

- [ ] `npm run build` passe sans erreur
- [ ] Test local sans `FLOWPILOT_JWT_SECRET` : pas de crash
- [ ] Test local avec `FLOWPILOT_JWT_SECRET` : login fonctionne
- [ ] Variable `FLOWPILOT_JWT_SECRET` configurée dans Vercel (Production)
- [ ] Redéploiement Vercel effectué
- [ ] Test production sans connexion : pas de 500
- [ ] Test production avec connexion : dashboard accessible
- [ ] Logs Vercel vérifiés : pas d'erreur critique

---

## 🔍 Points de sécurité

### **Pourquoi `signSessionToken()` lance encore une exception ?**

`signSessionToken()` est utilisé uniquement lors du **login/signup**, pas dans le middleware. Si la clé manque lors du login, c'est une erreur critique qui doit être visible (exception). Le middleware ne doit jamais crasher, mais le login peut échouer si la config est incorrecte.

### **Pourquoi `verifySessionToken()` ne lance jamais d'exception ?**

`verifySessionToken()` est appelé dans le **middleware** pour chaque requête. Si elle lançait une exception, cela crasherait le middleware. En retournant `null`, le middleware peut gérer gracieusement (401 ou redirection).

---

## 🚀 Déploiement

1. **Commit les changements** :
   ```bash
   git add lib/flowpilot-auth/jwt.ts lib/flowpilot-auth/session.ts
   git commit -m "fix: middleware 500 - gestion gracieuse des erreurs JWT"
   git push
   ```

2. **Vérifier Vercel** :
   - Le déploiement automatique devrait se déclencher
   - Vérifier que `FLOWPILOT_JWT_SECRET` est bien configurée dans les variables d'environnement

3. **Tester en production** après le déploiement

---

## 📝 Notes importantes

- ✅ Le middleware ne crashera plus même si `FLOWPILOT_JWT_SECRET` est manquant
- ✅ Les utilisateurs non connectés seront redirigés vers `/login` (comportement attendu)
- ✅ Les API non authentifiées retourneront `401 Unauthorized` (comportement attendu)
- ⚠️ Si `FLOWPILOT_JWT_SECRET` est manquant, **aucun utilisateur ne pourra se connecter** (erreur au login)
- ⚠️ Les tokens existants deviendront invalides si vous changez `FLOWPILOT_JWT_SECRET` (déconnexion automatique)

