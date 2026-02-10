# 🔧 Résolution de l'erreur Google 500

## 🎯 Problème

Vous rencontrez une erreur **500** de Google lors de la tentative de connexion OAuth. Cette erreur indique un problème côté serveur Google.

## 🔍 Causes possibles

### 1. Panne temporaire de Google (le plus probable)

Une erreur 500 peut être causée par une panne temporaire des services Google. Dans ce cas :
- **Solution** : Attendez quelques minutes et réessayez
- **Vérification** : Consultez [Google Cloud Status](https://status.cloud.google.com/) pour vérifier les pannes connues

### 2. URL d'autorisation mal formée

Si l'URL générée contient des caractères invalides ou des paramètres incorrects, Google peut retourner une erreur 500.

**Vérifications à faire :**

1. **Vérifier les logs Vercel** pour voir l'URL générée :
   ```
   [auth/google] URL d'autorisation générée: https://accounts.google.com/o/oauth2/v2/auth?...
   ```

2. **Vérifier que le Client ID est valide** :
   - Le Client ID doit commencer par un nombre et se terminer par `.apps.googleusercontent.com`
   - Exemple : `123456789-abcdefghijklmnop.apps.googleusercontent.com`

3. **Vérifier que les scopes sont corrects** :
   - Les scopes utilisés sont :
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Ces scopes doivent être activés dans Google Cloud Console

### 3. Problème avec le paramètre `state`

Le paramètre `state` que nous générons peut parfois causer des problèmes si :
- Il est trop long (nous générons 64 caractères hexadécimaux, ce qui est normal)
- Il contient des caractères spéciaux (nous utilisons `randomBytes().toString("hex")`, donc seulement 0-9 et a-f)

**Vérification** : Le code génère un state de 64 caractères hexadécimaux, ce qui est conforme aux spécifications OAuth 2.0.

### 4. Problème avec `prompt: "consent"`

Le paramètre `prompt: "consent"` peut parfois causer des problèmes si :
- L'application est en mode "Testing" et l'utilisateur n'est pas dans la liste des testeurs
- L'écran de consentement n'est pas correctement configuré

**Solution** :
1. Vérifiez que votre email est dans la liste des "Test users" si l'app est en mode "Testing"
2. Ou passez l'application en mode "In Production"

### 5. Problème avec `access_type: "offline"`

Le paramètre `access_type: "offline"` demande un refresh token. Si l'application n'a pas les permissions nécessaires, cela peut causer une erreur 500.

**Solution** : Vérifiez que l'écran de consentement OAuth est correctement configuré dans Google Cloud Console.

## ✅ Solutions à essayer

### Solution 1 : Vérifier les logs Vercel

1. Allez sur **Vercel Dashboard** → Votre projet → **Deployments** → Cliquez sur le dernier déploiement
2. Ouvrez l'onglet **Functions** ou **Logs**
3. Cherchez les logs commençant par `[auth/google]`
4. Vérifiez l'URL générée et les paramètres

### Solution 2 : Simplifier temporairement l'URL d'autorisation

Si le problème persiste, essayons de simplifier les paramètres :

```typescript
// Dans app/api/auth/google/route.ts
const authUrl = oauth2Client.generateAuthUrl({
  scope: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
  state: state,
  // Retirer temporairement prompt et access_type pour tester
});
```

### Solution 3 : Vérifier la configuration Google Cloud Console

1. **APIs & Services** > **OAuth consent screen**
   - Vérifiez que l'application est en mode "Testing" ou "In Production"
   - Vérifiez que votre email est dans "Test users" si en mode "Testing"
   - Vérifiez que l'email de support est renseigné

2. **APIs & Services** > **Credentials** > Votre OAuth 2.0 Client ID
   - Vérifiez que le Client ID est actif
   - Vérifiez que les "Authorized redirect URIs" sont correctes
   - Vérifiez que les "Authorized JavaScript origins" sont correctes

### Solution 4 : Tester avec un Client ID de test

Créez un nouveau Client ID OAuth dans Google Cloud Console pour tester si le problème vient du Client ID actuel.

## 🔍 Diagnostic

Pour diagnostiquer le problème, ajoutez ce log dans `app/api/auth/google/route.ts` :

```typescript
console.log("[auth/google] 🔍 URL complète d'autorisation:", authUrl);
console.log("[auth/google] 🔍 Paramètres de l'URL:", {
  stateLength: state.length,
  statePreview: state.substring(0, 20) + "...",
  clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + "...",
  redirectUri,
});
```

## 📞 Si le problème persiste

1. **Vérifiez les logs Vercel** pour voir l'URL exacte générée
2. **Testez l'URL manuellement** dans un navigateur (remplacez les valeurs sensibles)
3. **Vérifiez le statut Google Cloud** : https://status.cloud.google.com/
4. **Contactez le support Google** si l'erreur 500 persiste après plusieurs heures

## ⚠️ Note importante

Une erreur 500 de Google est généralement **temporaire** et se résout d'elle-même. Si vous avez récemment modifié la configuration OAuth, attendez 5-10 minutes pour que les changements soient propagés avant de réessayer.

