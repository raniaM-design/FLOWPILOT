# ✅ Vérification complète de la configuration Google OAuth

## 🔍 Checklist de vérification

### 1. Variables d'environnement

#### En local (`.env.local`)

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
GOOGLE_CLIENT_ID=votre_client_id_complet.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_complet
```

⚠️ **Points importants :**
- Pas d'espaces autour du `=`
- Pas de guillemets autour des valeurs (ou utilisez des guillemets doubles si nécessaire)
- Le Client ID doit se terminer par `.apps.googleusercontent.com`
- Le Client Secret ne doit pas contenir d'espaces

**Vérification :**
```bash
# Vérifier que les variables sont bien chargées
npm run test:google-oauth
```

#### Sur Vercel

1. Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez :
   - `GOOGLE_CLIENT_ID` = votre Client ID complet
   - `GOOGLE_CLIENT_SECRET` = votre Client Secret complet
3. Sélectionnez **Production**, **Preview**, et **Development**
4. Cliquez sur **Save**

### 2. Configuration Google Cloud Console

#### Étape 1 : Vérifier le projet

1. Allez sur https://console.cloud.google.com/
2. Vérifiez que vous êtes dans le **bon projet**
3. Notez le **Project ID** (vous en aurez besoin)

#### Étape 2 : Activer les APIs

1. **APIs & Services** → **Library**
2. Recherchez et activez :
   - ✅ **Google+ API** (ou **Google Identity**)
   - ✅ **People API** (recommandé)

#### Étape 3 : Configurer l'écran de consentement OAuth

1. **APIs & Services** → **OAuth consent screen**
2. Remplissez :
   - **User Type** : External (ou Internal si G Suite)
   - **App name** : FlowPilot (ou votre nom)
   - **User support email** : Votre email
   - **Developer contact information** : Votre email
3. Cliquez sur **Save and Continue**
4. **Scopes** : Cliquez sur **Add or Remove Scopes**
   - Ajoutez : `.../auth/userinfo.email`
   - Ajoutez : `.../auth/userinfo.profile`
5. **Test users** (si en mode Testing) :
   - Ajoutez votre email et les emails des utilisateurs de test
6. Cliquez sur **Save and Continue** jusqu'à la fin

#### Étape 4 : Créer les identifiants OAuth

1. **APIs & Services** → **Credentials**
2. Cliquez sur **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Si c'est la première fois, configurez l'écran de consentement (voir étape 3)
4. **Application type** : Web application
5. **Name** : FlowPilot (ou votre nom)
6. **Authorized JavaScript origins** :
   ```
   http://localhost:3000
   https://votre-domaine.vercel.app
   ```
   ⚠️ **IMPORTANT** :
   - Pas de slash final
   - Pas de chemin après le domaine
   - `http://` pour local, `https://` pour production

7. **Authorized redirect URIs** :
   ```
   http://localhost:3000/api/auth/google/callback
   https://votre-domaine.vercel.app/api/auth/google/callback
   ```
   ⚠️ **IMPORTANT** :
   - Pas de slash final (`/callback` et non `/callback/`)
   - Le chemin doit être exact : `/api/auth/google/callback`
   - Pas d'espaces avant/après

8. Cliquez sur **CREATE**
9. **Copiez le Client ID et le Client Secret** (vous ne pourrez plus voir le secret après)

### 3. Vérification des URLs

#### Test en local

1. Démarrez le serveur :
   ```bash
   npm run dev
   ```

2. Allez sur http://localhost:3000/login

3. Cliquez sur "Continuer avec Google"

4. **Vérifiez l'URL dans la barre d'adresse** avant l'erreur :
   - Elle devrait contenir `redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fgoogle%2Fcallback`
   - Si l'URL est différente, c'est que la configuration Google Cloud Console ne correspond pas

#### Test en production

1. Déployez sur Vercel
2. Allez sur votre domaine Vercel
3. Testez la connexion Google
4. Vérifiez les logs Vercel pour voir les erreurs détaillées

### 4. Erreurs courantes et solutions

#### Erreur : "redirect_uri_mismatch"

**Cause :** L'URL de redirection dans Google Cloud Console ne correspond pas exactement à celle utilisée.

**Solution :**
1. Dans Google Cloud Console, vérifiez que l'URL est exactement :
   - `http://localhost:3000/api/auth/google/callback` (local)
   - `https://votre-domaine.vercel.app/api/auth/google/callback` (production)
2. Pas de slash final, pas d'espaces
3. Attendez 1-2 minutes après avoir sauvegardé pour que les changements soient propagés

#### Erreur : "invalid_client"

**Cause :** Client ID ou Client Secret incorrect.

**Solution :**
1. Vérifiez que vous utilisez le bon Client ID et Secret
2. Vérifiez qu'ils correspondent au bon projet Google Cloud
3. Vérifiez qu'il n'y a pas d'espaces dans les variables d'environnement

#### Erreur : "access_denied"

**Cause :** Problème avec l'écran de consentement OAuth.

**Solution :**
1. Si l'application est en mode "Testing", ajoutez votre email dans "Test users"
2. Vérifiez que l'écran de consentement est correctement configuré
3. Essayez de passer en "In Production" si possible

### 5. Test final

Après avoir tout configuré :

1. **En local :**
   ```bash
   npm run test:google-oauth
   ```
   Ce script vous dira exactement quelles URLs configurer.

2. **Redémarrez le serveur :**
   ```bash
   npm run dev
   ```

3. **Testez la connexion :**
   - Allez sur http://localhost:3000/login
   - Cliquez sur "Continuer avec Google"
   - Vous devriez être redirigé vers Google pour autoriser l'application

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs du serveur** :
   - Regardez la console où vous avez lancé `npm run dev`
   - Cherchez les logs `[auth/google]` pour voir les détails

2. **Vérifiez les logs Vercel** (si en production) :
   - Allez dans Vercel Dashboard → Deployments → [Dernier déploiement] → Functions
   - Cherchez les logs `[auth/google]`

3. **Créez un nouveau OAuth Client** :
   - Parfois, créer un nouveau client résout les problèmes
   - Supprimez l'ancien et créez-en un nouveau avec les mêmes paramètres

4. **Vérifiez que vous n'avez pas plusieurs projets Google Cloud** :
   - Assurez-vous d'utiliser le Client ID et Secret du bon projet

## 📞 Informations à fournir pour le support

Si vous avez besoin d'aide, fournissez :
- Le message d'erreur exact de Google
- Les logs du serveur (sans les secrets)
- L'URL de redirection utilisée (visible dans l'URL Google avant l'erreur)
- Le type d'environnement (local ou production)

