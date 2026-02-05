# 🔧 Guide de résolution - Connexion Outlook sur Vercel

## Problème
La connexion Outlook fonctionne en local mais pas sur Vercel, malgré les variables d'environnement configurées.

## ✅ Corrections appliquées

### 1. Amélioration de la gestion des cookies sécurisés
- Détection automatique de Vercel (`VERCEL === "1"`)
- Cookies sécurisés activés automatiquement sur Vercel (HTTPS requis)
- Logs de diagnostic améliorés pour faciliter le débogage

### 2. Amélioration de la détection de MICROSOFT_REDIRECT_URI
- Détection automatique via `VERCEL_URL` (priorité)
- Fallback sur `APP_URL` ou `NEXT_PUBLIC_APP_URL`
- Logs détaillés pour identifier quelle URL est utilisée

## 📋 Checklist de vérification sur Vercel

### Variables d'environnement requises

Dans **Vercel → Settings → Environment Variables**, vérifiez que vous avez :

```env
MICROSOFT_CLIENT_ID=votre_client_id_azure
MICROSOFT_CLIENT_SECRET=votre_client_secret_azure
MICROSOFT_TENANT_ID=common
MICROSOFT_SCOPES=openid profile offline_access User.Read Calendars.Read email
```

**⚠️ IMPORTANT** : `MICROSOFT_REDIRECT_URI` est **optionnel** maintenant car détecté automatiquement, MAIS il est **recommandé** de le définir explicitement pour éviter les problèmes.

### Option 1 : Définir MICROSOFT_REDIRECT_URI explicitement (RECOMMANDÉ)

```env
MICROSOFT_REDIRECT_URI=https://votre-domaine.vercel.app/api/outlook/callback
```

**Remplacez `votre-domaine.vercel.app` par votre domaine réel** :
- Si vous avez un domaine personnalisé : `https://votre-domaine.com/api/outlook/callback`
- Si vous utilisez le domaine Vercel : `https://votre-projet.vercel.app/api/outlook/callback`

### Option 2 : Laisser la détection automatique

Si vous ne définissez pas `MICROSOFT_REDIRECT_URI`, le code utilisera automatiquement :
1. `VERCEL_URL` (fourni automatiquement par Vercel)
2. `APP_URL` (si défini)
3. `NEXT_PUBLIC_APP_URL` (si défini)

**⚠️ ATTENTION** : Avec la détection automatique, `VERCEL_URL` peut changer entre les déploiements preview et production. Il est donc **recommandé** de définir `MICROSOFT_REDIRECT_URI` explicitement.

## 🔍 Diagnostic des problèmes

### Étape 1 : Vérifier les logs Vercel

1. Allez dans **Vercel → Votre projet → Deployments → [Dernier déploiement] → Functions**
2. Cherchez les logs contenant `[outlook-connect] Configuration:`
3. Vérifiez les valeurs suivantes :
   - `redirectUri` : Doit correspondre EXACTEMENT à celui dans Azure AD
   - `hasClientId` : Doit être `true`
   - `hasClientSecret` : Doit être `true`
   - `vercelUrl` : Doit être défini si vous utilisez la détection automatique

### Étape 2 : Vérifier la configuration Azure AD

Dans **Azure Portal → App Registration → Authentication → Redirect URIs**, vous devez avoir :

**URIs de redirection autorisés** :
- `https://votre-domaine.vercel.app/api/outlook/callback` (domaine Vercel)
- `https://votre-domaine.com/api/outlook/callback` (si domaine personnalisé)
- `http://localhost:3000/api/outlook/callback` (pour le développement local)

**⚠️ CRITIQUE** : L'URL doit correspondre **EXACTEMENT** (caractère par caractère) :
- ✅ Même protocole (`https://`)
- ✅ Même domaine
- ✅ Même chemin (`/api/outlook/callback`)
- ✅ Pas de trailing slash
- ✅ Même casse (minuscules recommandées)

### Étape 3 : Vérifier les cookies

Les logs contiennent maintenant des informations sur les cookies :
```
[outlook-connect] Cookie OAuth state défini: {
  secure: true/false,
  isVercel: true/false,
  ...
}
```

Sur Vercel, `secure` doit être `true` et `isVercel` doit être `true`.

### Étape 4 : Tester le flux complet

1. **Vider le cache du navigateur** (Ctrl+Shift+Delete)
2. **Se déconnecter** de Microsoft si vous êtes connecté
3. **Tester la connexion** depuis votre application
4. **Vérifier les logs Vercel** pour voir les détails de chaque étape

## 🐛 Problèmes courants et solutions

### Problème 1 : "missing_state_cookie"

**Symptôme** : Le callback ne trouve pas le cookie de state.

**Causes possibles** :
- Le cookie n'a pas été créé (erreur dans `/api/outlook/connect`)
- Le cookie a expiré (maxAge: 3600 = 1 heure)
- Le cookie n'est pas accessible (problème de domaine/path)

**Solution** :
1. Vérifier les logs de `/api/outlook/connect` pour voir si le cookie est créé
2. Vérifier que `secure: true` est bien défini sur Vercel
3. Vérifier que le domaine du cookie correspond au domaine de l'application

### Problème 2 : "invalid_state" ou "State mismatch"

**Symptôme** : Le state du callback ne correspond pas au cookie.

**Causes possibles** :
- Le cookie a été modifié ou corrompu
- Problème de synchronisation entre les requêtes
- Cookie non accessible à cause de problèmes de domaine

**Solution** :
1. Vérifier les logs pour voir les valeurs de `storedState` et `receivedState`
2. S'assurer que les cookies fonctionnent correctement sur Vercel
3. Vérifier que le domaine de l'application correspond au domaine du cookie

### Problème 3 : "AADSTS90013" ou "Invalid redirect_uri"

**Symptôme** : Microsoft rejette la requête OAuth.

**Causes possibles** :
- L'URL de redirection ne correspond pas exactement à celle dans Azure AD
- L'URL contient des caractères invalides ou un trailing slash

**Solution** :
1. Copier l'URL exacte depuis les logs Vercel (`redirectUri`)
2. Vérifier qu'elle correspond EXACTEMENT à celle dans Azure AD
3. S'assurer qu'il n'y a pas de trailing slash (`/api/outlook/callback` et non `/api/outlook/callback/`)

### Problème 4 : "token_exchange_failed"

**Symptôme** : L'échange du code contre le token échoue.

**Causes possibles** :
- `MICROSOFT_CLIENT_SECRET` expiré ou incorrect
- `MICROSOFT_REDIRECT_URI` différent entre `/connect` et `/callback`
- Scopes invalides

**Solution** :
1. Vérifier que `MICROSOFT_CLIENT_SECRET` est correct et non expiré
2. Vérifier que le `redirectUri` utilisé dans `/callback` correspond à celui utilisé dans `/connect`
3. Vérifier que les scopes sont valides dans Azure AD

## 📝 Configuration recommandée pour Vercel

### Variables d'environnement minimales

```env
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://votre-domaine.vercel.app/api/outlook/callback
MICROSOFT_SCOPES=openid profile offline_access User.Read Calendars.Read email
```

### Variables d'environnement optionnelles (pour améliorer la détection)

```env
APP_URL=https://votre-domaine.vercel.app
# OU
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

**Note** : `VERCEL_URL` est automatiquement fourni par Vercel, pas besoin de le définir.

## 🧪 Test après déploiement

1. **Déployer les modifications** sur Vercel
2. **Vérifier les logs** du déploiement pour voir les valeurs de configuration
3. **Tester la connexion Outlook** depuis l'application
4. **Vérifier les logs en temps réel** dans Vercel pour voir chaque étape du flux OAuth

## 📞 Support supplémentaire

Si le problème persiste après avoir vérifié tous les points ci-dessus :

1. **Copier les logs complets** de Vercel contenant :
   - `[outlook-connect] Configuration:`
   - `[outlook-connect] Cookie OAuth state défini:`
   - `[outlook-callback] state validation:`
   - `[outlook-callback] Configuration:`

2. **Vérifier l'URL de redirection exacte** utilisée dans les logs

3. **Comparer avec Azure AD** pour s'assurer qu'elle correspond exactement

4. **Vérifier que tous les caractères correspondent** (pas d'espaces, pas de trailing slash, etc.)

