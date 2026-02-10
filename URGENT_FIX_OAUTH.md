# ⚠️ Correction urgente : OAuth utilise encore flowpilot-app.vercel.app

## 🎯 Problème actuel

L'erreur montre que l'URL utilisée est :
```
https://flowpilot-app.vercel.app/api/auth/google/callback
```

Au lieu de :
```
https://pilotys.io/api/auth/google/callback
```

## ✅ Solution immédiate (2 options)

### Option 1 : Ajouter temporairement l'URL Vercel dans Google Cloud Console

**En attendant que `NEXT_PUBLIC_APP_URL` soit déployé**, ajoutez cette URL dans Google Cloud Console :

1. Allez sur **https://console.cloud.google.com/**
2. **APIs & Services** > **Credentials**
3. Cliquez sur votre **OAuth 2.0 Client ID**
4. Dans **"Authorized redirect URIs"**, ajoutez :
   ```
   https://flowpilot-app.vercel.app/api/auth/google/callback
   ```
5. Dans **"Authorized JavaScript origins"**, ajoutez :
   ```
   https://flowpilot-app.vercel.app
   ```
6. Cliquez sur **Save**

⚠️ **Note** : C'est temporaire. Une fois `NEXT_PUBLIC_APP_URL` configuré, cette URL ne sera plus nécessaire.

### Option 2 : Configurer `NEXT_PUBLIC_APP_URL` sur Vercel (Solution définitive)

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez :
   - **Key** : `NEXT_PUBLIC_APP_URL`
   - **Value** : `https://pilotys.io`
   - **Environments** : ✅ **Production** uniquement
3. Cliquez sur **Save**
4. **Redéployez** votre application :
   - Allez dans **Deployments**
   - Cliquez sur **Redeploy** sur le dernier déploiement
   - Ou poussez un nouveau commit

## 🔍 Vérification

Après avoir ajouté `NEXT_PUBLIC_APP_URL` et redéployé, les logs Vercel devraient afficher :

```
[auth/google] Configuration OAuth: {
  computedOrigin: https://pilotys.io
  redirectUri: https://pilotys.io/api/auth/google/callback
  nextPublicAppUrl: https://pilotys.io
}
```

## 📋 Configuration Google Cloud Console complète

Une fois que `NEXT_PUBLIC_APP_URL` est configuré, gardez uniquement ces URLs dans Google Cloud Console :

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

Vous pouvez supprimer les URLs Vercel (`flowpilot-app.vercel.app` et autres previews) une fois que tout fonctionne avec `pilotys.io`.

