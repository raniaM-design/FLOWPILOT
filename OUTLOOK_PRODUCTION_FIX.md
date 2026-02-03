# Guide de résolution - Connexion Outlook en production

## Erreur : AADSTS90013 - Invalid input received from the user

Cette erreur se produit généralement lorsque les paramètres OAuth envoyés à Microsoft sont invalides ou ne correspondent pas à la configuration Azure AD.

## ✅ Checklist de vérification

### 1. Variables d'environnement Vercel

Vérifiez que ces variables sont définies dans **Vercel → Settings → Environment Variables** :

```env
MICROSOFT_CLIENT_ID=votre_client_id_azure
MICROSOFT_CLIENT_SECRET=votre_client_secret_azure
MICROSOFT_TENANT_ID=common
MICROSOFT_SCOPES=openid profile offline_access User.Read Calendars.Read email
MICROSOFT_REDIRECT_URI=https://votre-domaine.vercel.app/api/outlook/callback
```

**⚠️ IMPORTANT** : 
- `MICROSOFT_REDIRECT_URI` doit être l'URL **exacte** de votre domaine de production
- Pas de trailing slash (`/api/outlook/callback` et non `/api/outlook/callback/`)
- Utiliser `https://` (pas `http://`)

### 2. Configuration Azure AD - Redirect URIs

Dans **Azure Portal → App Registration → Authentication → Redirect URIs**, vous devez avoir :

**URIs de redirection autorisés** :
- `https://votre-domaine.vercel.app/api/outlook/callback`
- `https://votre-domaine-production.vercel.app/api/outlook/callback` (si vous avez un domaine personnalisé)
- `http://localhost:3000/api/outlook/callback` (pour le développement local)

**⚠️ CRITIQUE** : L'URL doit correspondre **EXACTEMENT** (caractère par caractère) :
- ✅ Même protocole (`https://`)
- ✅ Même domaine
- ✅ Même chemin (`/api/outlook/callback`)
- ✅ Pas de trailing slash
- ✅ Même casse (minuscules recommandées)

### 3. Configuration Azure AD - Application Type

Vérifiez que votre application Azure AD est configurée correctement :

1. **Azure Portal → App Registration → Overview**
   - Vérifiez que l'**Application (client) ID** correspond à `MICROSOFT_CLIENT_ID`
   - Vérifiez que l'application est **multi-tenant** si vous utilisez `MICROSOFT_TENANT_ID=common`

2. **Azure Portal → App Registration → Authentication**
   - **Supported account types** : 
     - Si vous utilisez `MICROSOFT_TENANT_ID=common` → Sélectionnez **"Accounts in any organizational directory and personal Microsoft accounts"**
     - Sinon → Sélectionnez **"Accounts in this organizational directory only"**

### 4. Vérification des logs Vercel

Après le déploiement, vérifiez les logs Vercel pour voir l'URL de redirection utilisée :

1. Allez dans **Vercel → Votre projet → Deployments → [Dernier déploiement] → Functions**
2. Cherchez les logs contenant `[outlook-connect] Configuration:`
3. Vérifiez que `redirectUri` correspond exactement à celui configuré dans Azure AD

### 5. Test manuel de l'URL OAuth

Pour diagnostiquer le problème, vous pouvez tester l'URL OAuth manuellement :

1. Appelez `/api/outlook/connect` depuis votre application
2. Copiez l'URL complète depuis la barre d'adresse du navigateur (avant la redirection vers Microsoft)
3. Vérifiez les paramètres dans l'URL :
   - `client_id` : doit être votre Application (client) ID Azure
   - `redirect_uri` : doit correspondre exactement à celui dans Azure AD
   - `scope` : doit contenir les scopes valides séparés par des espaces
   - `state` : doit être présent

## 🔧 Solutions courantes

### Solution 1 : Redirect URI ne correspond pas

**Symptôme** : Erreur `AADSTS90013` immédiatement après le clic sur "Se connecter"

**Solution** :
1. Vérifiez l'URL exacte dans les logs Vercel
2. Copiez cette URL exacte
3. Ajoutez-la dans Azure AD → Authentication → Redirect URIs
4. Redéployez l'application

### Solution 2 : Application non multi-tenant

**Symptôme** : Erreur `AADSTS50194` ou `AADSTS90013` avec message sur `/common`

**Solution** :
1. Azure Portal → App Registration → Authentication
2. Changez **Supported account types** vers **"Accounts in any organizational directory and personal Microsoft accounts"**
3. OU utilisez votre Tenant ID spécifique au lieu de `common` dans `MICROSOFT_TENANT_ID`

### Solution 3 : Client Secret expiré

**Symptôme** : Erreur lors de l'échange du code contre le token

**Solution** :
1. Azure Portal → App Registration → Certificates & secrets
2. Créez un nouveau **Client secret**
3. Mettez à jour `MICROSOFT_CLIENT_SECRET` dans Vercel
4. Redéployez l'application

### Solution 4 : Scopes invalides

**Symptôme** : Erreur `AADSTS90013` avec message sur les permissions

**Solution** :
1. Vérifiez que les scopes dans `MICROSOFT_SCOPES` sont valides
2. Azure Portal → App Registration → API permissions
3. Vérifiez que les permissions suivantes sont ajoutées :
   - `User.Read` (delegated)
   - `Calendars.Read` (delegated)
   - `offline_access` (delegated)
   - `openid`, `profile`, `email` (delegated)

## 📝 Format attendu des variables

### MICROSOFT_CLIENT_ID
- Format : UUID (ex: `2d149257-da1b-40a6-bd62-322a7d09a7f6`)
- Où trouver : Azure Portal → App Registration → Overview → Application (client) ID

### MICROSOFT_CLIENT_SECRET
- Format : Chaîne aléatoire générée par Azure
- Où trouver : Azure Portal → App Registration → Certificates & secrets → Client secrets

### MICROSOFT_TENANT_ID
- Format : `common` OU UUID du tenant
- Recommandation : `common` (supporte comptes pro + personnels)

### MICROSOFT_REDIRECT_URI
- Format : URL complète avec protocole
- Exemple production : `https://votre-domaine.vercel.app/api/outlook/callback`
- Exemple développement : `http://localhost:3000/api/outlook/callback`

### MICROSOFT_SCOPES
- Format : Scopes séparés par des espaces (pas de guillemets)
- Exemple : `openid profile offline_access User.Read Calendars.Read email`

## 🧪 Test après correction

1. **Vider le cache du navigateur** (Ctrl+Shift+Delete)
2. **Se déconnecter** de Microsoft si vous êtes connecté
3. **Tester la connexion** depuis votre application
4. **Vérifier les logs Vercel** pour voir les détails de la configuration

## 📞 Support

Si le problème persiste après avoir vérifié tous les points ci-dessus :

1. Copiez les logs Vercel contenant `[outlook-connect] Configuration:`
2. Vérifiez l'URL de redirection exacte utilisée
3. Comparez-la avec celle configurée dans Azure AD
4. Vérifiez que tous les caractères correspondent exactement

