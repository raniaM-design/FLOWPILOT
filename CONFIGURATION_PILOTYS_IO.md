# 🔧 Configuration Google OAuth pour pilotys.io

## 🎯 Domaine de production

Votre domaine de production est : **`pilotys.io`**

## ✅ Configuration Google Cloud Console

### Étape 1 : Ajouter les URLs dans Google Cloud Console

1. Allez sur **https://console.cloud.google.com/**
2. **APIs & Services** > **Credentials**
3. Cliquez sur votre **OAuth 2.0 Client ID**
4. Dans **"Authorized JavaScript origins"**, ajoutez :
   ```
   http://localhost:3000
   https://pilotys.io
   https://www.pilotys.io
   ```
5. Dans **"Authorized redirect URIs"**, ajoutez :
   ```
   http://localhost:3000/api/auth/google/callback
   https://pilotys.io/api/auth/google/callback
   https://www.pilotys.io/api/auth/google/callback
   ```
6. Cliquez sur **Save**
7. Attendez 1-2 minutes pour la propagation

### Étape 2 : Configurer la variable d'environnement sur Vercel

Pour que l'application utilise le bon domaine en production :

1. Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez une nouvelle variable :
   - **Key** : `NEXT_PUBLIC_APP_URL`
   - **Value** : `https://pilotys.io`
   - **Environments** : Cochez **Production** uniquement (pas Preview ni Development)
3. Cliquez sur **Save**

### Étape 3 : Vérifier la configuration Vercel

Assurez-vous que votre domaine personnalisé est bien configuré :

1. **Vercel Dashboard** → Votre projet → **Settings** → **Domains**
2. Vérifiez que `pilotys.io` et `www.pilotys.io` sont bien listés
3. Si ce n'est pas le cas, ajoutez-les :
   - Cliquez sur **Add Domain**
   - Entrez `pilotys.io`
   - Suivez les instructions pour configurer les DNS

## 🔍 Comment ça fonctionne

Le code détecte automatiquement le domaine à utiliser dans cet ordre :

1. **`NEXT_PUBLIC_APP_URL`** (si défini) → Utilisé en production
2. **`VERCEL_URL`** (si défini) → Utilisé pour les previews Vercel
3. **Origin de la requête** → Fallback

En production avec `NEXT_PUBLIC_APP_URL=https://pilotys.io`, le code utilisera toujours `https://pilotys.io` pour les URLs OAuth, même si vous êtes sur une preview Vercel.

## 📋 Checklist

- [ ] URLs ajoutées dans Google Cloud Console :
  - [ ] `https://pilotys.io` (JavaScript origin)
  - [ ] `https://www.pilotys.io` (JavaScript origin)
  - [ ] `https://pilotys.io/api/auth/google/callback` (Redirect URI)
  - [ ] `https://www.pilotys.io/api/auth/google/callback` (Redirect URI)
- [ ] Variable `NEXT_PUBLIC_APP_URL=https://pilotys.io` ajoutée sur Vercel (Production uniquement)
- [ ] Domaine `pilotys.io` configuré dans Vercel → Settings → Domains
- [ ] Test de connexion Google OAuth sur `https://pilotys.io`

## 🚀 Après configuration

1. **Redéployez** votre application sur Vercel (ou attendez le prochain déploiement)
2. **Testez** la connexion Google OAuth sur `https://pilotys.io`
3. Les logs Vercel devraient maintenant montrer :
   ```
   computedOrigin: https://pilotys.io
   redirectUri: https://pilotys.io/api/auth/google/callback
   ```

## ⚠️ Notes importantes

- **Ne pas ajouter les URLs de preview Vercel** dans Google Cloud Console (elles changent à chaque déploiement)
- **Utiliser uniquement le domaine de production** (`pilotys.io`) pour une configuration stable
- Les previews Vercel utiliseront aussi `pilotys.io` si `NEXT_PUBLIC_APP_URL` est défini, ce qui est parfait pour les tests

