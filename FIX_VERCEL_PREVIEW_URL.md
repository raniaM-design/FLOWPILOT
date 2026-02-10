# 🔧 Correction : Erreur redirect_uri_mismatch sur Vercel Preview

## 🎯 Problème identifié

L'erreur `redirect_uri_mismatch` se produit parce que Vercel utilise une URL de **preview** (avec un hash) :
```
https://pilotys-7s1p3fezu-raniam-designs-projects.vercel.app/api/auth/google/callback
```

Cette URL n'est pas dans la liste des URLs autorisées dans Google Cloud Console.

## ✅ Solution immédiate

### Option 1 : Ajouter l'URL de preview dans Google Cloud Console (Temporaire)

1. Allez sur https://console.cloud.google.com/
2. **APIs & Services** > **Credentials**
3. Cliquez sur votre **OAuth 2.0 Client ID**
4. Dans **Authorized redirect URIs**, ajoutez :
   ```
   https://pilotys-7s1p3fezu-raniam-designs-projects.vercel.app/api/auth/google/callback
   ```
5. Cliquez sur **Save**

⚠️ **Note** : Cette URL changera à chaque nouveau déploiement preview. Ce n'est pas une solution durable.

### Option 2 : Utiliser uniquement le domaine de production (Recommandé)

Pour éviter ce problème, configurez Google OAuth pour utiliser uniquement le domaine de production :

1. Dans Google Cloud Console, gardez uniquement :
   - **Authorized JavaScript origins** :
     ```
     https://votre-domaine-production.vercel.app
     ```
   - **Authorized redirect URIs** :
     ```
     https://votre-domaine-production.vercel.app/api/auth/google/callback
     ```

2. Pour tester en local, ajoutez aussi :
   ```
   http://localhost:3000/api/auth/google/callback
   ```

3. Les previews Vercel ne pourront pas utiliser Google OAuth, mais la production fonctionnera.

### Option 3 : Utiliser un domaine personnalisé (Meilleure solution)

Si vous avez un domaine personnalisé configuré sur Vercel :

1. Configurez votre domaine personnalisé dans Vercel
2. Dans Google Cloud Console, utilisez uniquement votre domaine personnalisé :
   ```
   https://votre-domaine.com/api/auth/google/callback
   ```
3. Toutes les previews et la production utiliseront ce domaine.

## 🔍 Comment trouver votre domaine de production Vercel

1. Allez dans **Vercel Dashboard** → Votre projet
2. Allez dans **Settings** → **Domains**
3. Vous verrez :
   - **Production Domain** : `votre-projet.vercel.app` (domaine principal)
   - **Preview Domains** : `votre-projet-git-xxx.vercel.app` (domaines de preview)

## 📝 Configuration recommandée dans Google Cloud Console

Pour une configuration complète, ajoutez ces URLs :

**Authorized JavaScript origins :**
```
http://localhost:3000
https://votre-projet.vercel.app
https://votre-domaine-personnalise.com
```

**Authorized redirect URIs :**
```
http://localhost:3000/api/auth/google/callback
https://votre-projet.vercel.app/api/auth/google/callback
https://votre-domaine-personnalise.com/api/auth/google/callback
```

## 🚀 Solution technique : Détecter l'environnement

Le code pourrait être amélioré pour détecter si on est en preview ou production et utiliser le bon domaine. Cependant, Google OAuth nécessite que toutes les URLs soient pré-enregistrées, donc la meilleure solution reste d'utiliser un domaine fixe (production ou personnalisé).

## ⚠️ Important

- Les URLs de preview Vercel changent à chaque déploiement
- Google OAuth nécessite que toutes les URLs soient pré-enregistrées
- Il n'est pas pratique d'ajouter chaque URL de preview manuellement
- **Solution recommandée** : Utiliser uniquement le domaine de production ou un domaine personnalisé

