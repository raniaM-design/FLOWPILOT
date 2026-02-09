# 🔧 Résolution de l'erreur Google OAuth "Demande non valide"

## 🎯 Problème
Erreur Google : **"Accès bloqué : la demande de cette appli n'est pas valide"**

Cette erreur indique généralement un problème de configuration dans Google Cloud Console.

## ✅ Solutions

### 1. Vérifier les URLs de redirection (REDIRECT URI)

**C'est la cause la plus fréquente !**

Dans Google Cloud Console :

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur votre **OAuth 2.0 Client ID**
3. Vérifiez la section **"Authorized redirect URIs"**

Vous devez avoir EXACTEMENT ces URLs (sans slash final, avec le bon protocole) :

**Pour le développement local :**
```
http://localhost:3000/api/auth/google/callback
```

**Pour la production (Vercel) :**
```
https://votre-domaine.vercel.app/api/auth/google/callback
```

⚠️ **Points importants :**
- Pas de slash final (`/callback` et non `/callback/`)
- `http://` pour local, `https://` pour production
- Le chemin doit être exact : `/api/auth/google/callback`
- Pas d'espaces avant/après

### 2. Vérifier les origines JavaScript autorisées

Dans la même page OAuth Client :

**Pour le développement local :**
```
http://localhost:3000
```

**Pour la production :**
```
https://votre-domaine.vercel.app
```

⚠️ **Points importants :**
- Pas de slash final
- Pas de chemin après le domaine
- `http://` pour local, `https://` pour production

### 3. Vérifier l'écran de consentement OAuth

1. Allez dans **APIs & Services** > **OAuth consent screen**
2. Vérifiez que :
   - Le type d'application est **"External"** (ou "Internal" si vous avez G Suite)
   - L'email de support est renseigné
   - Les domaines autorisés sont corrects
   - L'application est en mode **"Testing"** ou **"In Production"**

Si l'application est en mode "Testing" :
- Seuls les utilisateurs de test peuvent se connecter
- Ajoutez votre email dans **"Test users"**

### 4. Vérifier les variables d'environnement

**En local (`.env.local`) :**
```env
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
```

**Sur Vercel :**
1. Allez dans **Settings** > **Environment Variables**
2. Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis
3. Vérifiez qu'ils correspondent au bon projet Google Cloud

### 5. Vérifier que les APIs sont activées

Dans **APIs & Services** > **Library**, vérifiez que ces APIs sont activées :
- ✅ **Google+ API** (ou **Google Identity**)
- ✅ **People API** (optionnel mais recommandé)

### 6. Vérifier le format du Client ID et Secret

- **Client ID** : doit se terminer par `.apps.googleusercontent.com`
- **Client Secret** : doit être une chaîne de caractères (pas d'espaces)

## 🔍 Diagnostic étape par étape

### Étape 1 : Vérifier l'URL de redirection dans les logs

Quand vous cliquez sur "Continuer avec Google", regardez l'URL dans la barre d'adresse du navigateur avant l'erreur. Elle devrait ressembler à :

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fgoogle%2Fcallback&...
```

Vérifiez que `redirect_uri` correspond exactement à ce que vous avez configuré dans Google Cloud Console.

### Étape 2 : Tester avec l'URL complète

Dans Google Cloud Console, essayez d'ajouter les deux URLs (avec et sans trailing slash) pour voir laquelle fonctionne :

```
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/auth/google/callback/
```

### Étape 3 : Vérifier les erreurs détaillées

Cliquez sur "les détails de l'erreur" dans la page d'erreur Google pour voir le code d'erreur exact :
- `redirect_uri_mismatch` = URL de redirection incorrecte
- `invalid_client` = Client ID ou Secret incorrect
- `access_denied` = Problème avec l'écran de consentement

## 🚀 Solution rapide

1. **Dans Google Cloud Console** :
   - Allez dans **Credentials** > Votre OAuth Client
   - Supprimez toutes les URLs de redirection existantes
   - Ajoutez UNIQUEMENT : `http://localhost:3000/api/auth/google/callback`
   - Sauvegardez

2. **Redémarrez votre serveur local** :
   ```bash
   npm run dev
   ```

3. **Testez à nouveau** la connexion Google

4. **Pour la production**, ajoutez aussi :
   - `https://votre-domaine.vercel.app/api/auth/google/callback`

## 📝 Checklist complète

- [ ] URLs de redirection exactes dans Google Cloud Console
- [ ] Origines JavaScript autorisées correctes
- [ ] Écran de consentement OAuth configuré
- [ ] APIs Google activées (Google+ API ou Google Identity)
- [ ] Variables d'environnement définies (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- [ ] Client ID et Secret corrects (vérifier qu'ils correspondent au bon projet)
- [ ] Pas d'espaces ou de caractères spéciaux dans les URLs
- [ ] Utilisation de `http://` pour local et `https://` pour production

## 🆘 Si le problème persiste

1. Créez un **nouveau OAuth Client ID** dans Google Cloud Console
2. Copiez le nouveau Client ID et Secret
3. Mettez à jour les variables d'environnement
4. Testez à nouveau

Ou contactez le support Google Cloud si l'erreur persiste après avoir vérifié tous les points ci-dessus.

