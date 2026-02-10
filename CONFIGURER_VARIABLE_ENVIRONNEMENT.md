# 🔧 Configurer la variable d'environnement pour pilotys.io

## 🎯 Problème

Même si vous avez retiré `flowpilot-app.vercel.app` de Vercel, Google OAuth utilise encore ce domaine car la variable d'environnement `NEXT_PUBLIC_APP_URL` ou `APP_URL` n'est pas configurée.

## ✅ Solution : Ajouter la variable sur Vercel

### Option 1 : Utiliser `APP_URL` (Recommandé pour les routes API)

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. Remplissez :
   - **Key** : `APP_URL`
   - **Value** : `https://pilotys.io`
   - **Environments** : ✅ **Production** uniquement
4. Cliquez sur **Save**

### Option 2 : Utiliser `NEXT_PUBLIC_APP_URL` (Alternative)

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. Remplissez :
   - **Key** : `NEXT_PUBLIC_APP_URL`
   - **Value** : `https://pilotys.io`
   - **Environments** : ✅ **Production** uniquement
4. Cliquez sur **Save**

## 🚀 Redéployer l'application

**IMPORTANT** : Après avoir ajouté la variable, vous devez redéployer :

1. **Vercel Dashboard** → Votre projet → **Deployments**
2. Cliquez sur **"..."** (trois points) sur le dernier déploiement
3. Cliquez sur **"Redeploy"**
4. Ou poussez un nouveau commit vers votre dépôt

## 🔍 Vérification

Après le redéploiement, les logs Vercel devraient afficher :

```
[auth/google] 🔍 Détection de l'origin: {
  appUrl: https://pilotys.io
  computedOrigin: https://pilotys.io
  ...
}
```

Et Google OAuth devrait utiliser :
```
https://pilotys.io/api/auth/google/callback
```

## 📋 Configuration Google Cloud Console

Une fois que la variable est configurée et déployée, assurez-vous d'avoir ces URLs dans Google Cloud Console :

**Authorized JavaScript origins :**
```
http://localhost:3000
https://pilotys.io
https://www.pilotys.io
```

**Authorized redirect URIs :**
```
http://localhost:3000/api/auth/google/callback
https://pilotys.io/api/auth/google/callback
https://www.pilotys.io/api/auth/google/callback
```

Vous pouvez supprimer toutes les URLs Vercel (`flowpilot-app.vercel.app`, etc.) de Google Cloud Console une fois que tout fonctionne avec `pilotys.io`.

## ⚠️ Note importante

- Les variables d'environnement ne sont prises en compte qu'après un **redéploiement**
- Si vous testez sur une preview Vercel, la variable doit aussi être ajoutée pour l'environnement **Preview**
- Pour la production uniquement, ajoutez-la uniquement pour **Production**

