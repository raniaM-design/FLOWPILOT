# 🔧 Correction de l'erreur redirect_uri Azure AD

## 🎯 Problème
```
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid. 
The expected value is a URI which matches a redirect URI registered for this client application.
```

## ✅ Solution

Le `redirect_uri` utilisé doit correspondre **EXACTEMENT** à celui enregistré dans Azure AD.

### Étape 1 : Vérifier le redirect_uri utilisé par votre application

**Option A : Vérifier les logs Vercel**

1. **Vercel Dashboard** → Votre projet → **Deployments** → Dernier déploiement
2. **Functions** → Runtime Logs
3. Cherchez `[outlook-connect] Redirect URI utilisé:`
4. **Copiez cette URL exacte**

**Option B : Vérifier via l'endpoint de debug**

Allez sur :
```
https://votre-app.vercel.app/api/_debug/env
```

Regardez la valeur de `MICROSOFT_REDIRECT_URI` ou les variables `VERCEL_URL`, `APP_URL`.

### Étape 2 : Vérifier le redirect_uri dans Azure AD

1. Allez sur **https://portal.azure.com**
2. **Azure Active Directory** → **App registrations** → Votre application
3. **Authentication** → **Redirect URIs**
4. **Vérifiez la liste** des redirect URIs enregistrés

### Étape 3 : Comparer et corriger

**Le redirect_uri doit correspondre EXACTEMENT** :
- ✅ Même protocole (`https://` ou `http://`)
- ✅ Même domaine (exactement le même)
- ✅ Même chemin (`/api/outlook/callback`)
- ✅ Pas de trailing slash (`/api/outlook/callback` pas `/api/outlook/callback/`)
- ✅ Pas de port si non spécifié dans Azure AD

**Exemples de formats courants sur Vercel** :
```
https://votre-app.vercel.app/api/outlook/callback
https://votre-domaine.com/api/outlook/callback
```

### Étape 4 : Ajouter le redirect_uri dans Azure AD (si manquant)

1. **Azure Portal** → **App registrations** → Votre application
2. **Authentication** → **Add a platform** → **Web**
3. **Redirect URIs** → Cliquez sur **"Add URI"**
4. **Collez l'URL exacte** utilisée par votre application (celle des logs Vercel)
5. Cliquez sur **"Save"**

### Étape 5 : Configurer MICROSOFT_REDIRECT_URI sur Vercel (recommandé)

Pour éviter les problèmes avec les URLs de preview, configurez explicitement :

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez `MICROSOFT_REDIRECT_URI` avec la valeur exacte de votre domaine de production :
   ```
   https://votre-domaine.com/api/outlook/callback
   ```
   Ou si vous utilisez le domaine Vercel :
   ```
   https://votre-app.vercel.app/api/outlook/callback
   ```
3. **⚠️ IMPORTANT** : Utilisez le même domaine que celui configuré dans Azure AD
4. Cliquez sur **"Save"**

### Étape 6 : Gérer les URLs de preview (optionnel)

Si vous voulez supporter les preview deployments sur Vercel :

1. Dans Azure AD, ajoutez aussi :
   ```
   https://*.vercel.app/api/outlook/callback
   ```
   (Note : Azure AD ne supporte pas les wildcards, vous devrez ajouter chaque preview URL manuellement, ou utiliser uniquement le domaine de production)

2. Ou mieux : Utilisez uniquement le domaine de production dans `MICROSOFT_REDIRECT_URI` sur Vercel

## 🔍 Diagnostic

### Vérifier le redirect_uri utilisé

**Dans les logs Vercel**, cherchez :
```
[outlook-connect] Redirect URI utilisé: https://...
```

Cette URL doit correspondre **EXACTEMENT** à celle dans Azure AD.

### Erreurs courantes

#### ❌ Trailing slash
- **Azure AD** : `https://app.com/api/outlook/callback`
- **Utilisé** : `https://app.com/api/outlook/callback/`
- **Solution** : Retirer le trailing slash ou l'ajouter dans Azure AD

#### ❌ Protocole différent
- **Azure AD** : `https://app.com/api/outlook/callback`
- **Utilisé** : `http://app.com/api/outlook/callback`
- **Solution** : Utiliser `https://` dans les deux

#### ❌ Domaine différent
- **Azure AD** : `https://app.com/api/outlook/callback`
- **Utilisé** : `https://app-preview.vercel.app/api/outlook/callback`
- **Solution** : Ajouter le domaine preview dans Azure AD ou utiliser uniquement le domaine de production

#### ❌ Port différent
- **Azure AD** : `https://app.com/api/outlook/callback`
- **Utilisé** : `https://app.com:443/api/outlook/callback`
- **Solution** : Ne pas inclure le port dans Azure AD

## 📋 Checklist

- [ ] Redirect URI utilisé identifié dans les logs Vercel
- [ ] Redirect URI vérifié dans Azure AD (App registrations → Authentication)
- [ ] Les deux correspondent EXACTEMENT (protocole, domaine, chemin, pas de trailing slash)
- [ ] `MICROSOFT_REDIRECT_URI` configuré sur Vercel avec la bonne valeur
- [ ] Application redéployée sur Vercel
- [ ] Test de connexion Outlook effectué

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs Vercel** pour voir le redirect_uri exact utilisé
2. **Vérifiez Azure AD** pour voir tous les redirect URIs enregistrés
3. **Comparez caractère par caractère** les deux URLs
4. **Partagez-moi** :
   - Le redirect_uri utilisé (des logs Vercel)
   - Les redirect URIs enregistrés dans Azure AD (sans révéler d'informations sensibles)

