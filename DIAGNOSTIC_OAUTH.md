# 🔍 Diagnostic OAuth - Vérifier les variables d'environnement

## 🎯 Problème

Google OAuth utilise toujours `flowpilot-app.vercel.app` au lieu de `pilotys.io`.

## ✅ Solution : Vérifier les variables d'environnement

### Étape 1 : Accéder à la route de diagnostic

Une fois déployé, accédez à :
```
https://votre-domaine.vercel.app/api/debug/oauth-env
```

Ou sur votre domaine de production :
```
https://pilotys.io/api/debug/oauth-env
```

Cette route vous montrera :
- Quelles variables d'environnement sont disponibles
- Quelle URL est calculée pour OAuth
- Quelle variable est utilisée

### Étape 2 : Vérifier la réponse

La réponse devrait ressembler à :

```json
{
  "environment": {
    "APP_URL": "https://pilotys.io",
    "NEXT_PUBLIC_APP_URL": "❌ Non défini",
    "VERCEL_URL": "flowpilot-app.vercel.app",
    "NODE_ENV": "production",
    "VERCEL": "1"
  },
  "computed": {
    "origin": "https://pilotys.io",
    "redirectUri": "https://pilotys.io/api/auth/google/callback",
    "usedVariable": "APP_URL"
  },
  "recommendation": "✅ Configuration correcte - utilise le domaine personnalisé"
}
```

### Si `APP_URL` ou `NEXT_PUBLIC_APP_URL` est "❌ Non défini"

Cela signifie que la variable n'est pas configurée sur Vercel. Suivez ces étapes :

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Vérifiez si `APP_URL` ou `NEXT_PUBLIC_APP_URL` existe
3. Si elle n'existe pas, ajoutez-la :
   - **Key** : `APP_URL`
   - **Value** : `https://pilotys.io`
   - **Environments** : ✅ **Production** uniquement
4. **Redéployez** l'application (Deployments → Redeploy)

### Si la variable existe mais `computed.origin` est toujours `flowpilot-app.vercel.app`

Cela peut signifier :
1. La variable n'est pas dans le bon environnement (Production vs Preview)
2. Le déploiement n'a pas été fait après l'ajout de la variable
3. Il y a un problème de cache

**Solution** :
1. Vérifiez que la variable est bien dans **Production**
2. Redéployez complètement l'application
3. Attendez quelques minutes pour la propagation

## 📋 Checklist de vérification

- [ ] Route `/api/debug/oauth-env` accessible
- [ ] `APP_URL` ou `NEXT_PUBLIC_APP_URL` est défini dans la réponse
- [ ] `computed.origin` est `https://pilotys.io`
- [ ] `computed.redirectUri` est `https://pilotys.io/api/auth/google/callback`
- [ ] Les logs Vercel montrent `✅ Utilisation du domaine personnalisé: https://pilotys.io`
- [ ] Google OAuth utilise bien `pilotys.io` dans l'URL de redirection

## 🔍 Vérifier les logs Vercel

Dans les logs Vercel (Functions → Logs), vous devriez voir :

```
[auth/google] 🔍 Variables d'environnement disponibles: {
  APP_URL: https://pilotys.io
  ...
}
[auth/google] ✅ Utilisation du domaine personnalisé: https://pilotys.io
```

Si vous voyez :
```
[auth/google] ⚠️ Utilisation de VERCEL_URL (fallback): https://flowpilot-app.vercel.app
```

Cela signifie que `APP_URL` n'est pas défini et il faut l'ajouter sur Vercel.

