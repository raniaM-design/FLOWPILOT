# 🔧 Corriger NEXT_PUBLIC_APP_URL sur Vercel

## ❌ Problème identifié

La variable `NEXT_PUBLIC_APP_URL` est définie à `https://flowpilot-app.vercel.app` au lieu de `https://pilotys.io`.

## ✅ Solution

### 1. Corriger sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **Pilotys**
3. Allez dans **Settings** → **Environment Variables**
4. Recherchez `NEXT_PUBLIC_APP_URL`
5. Modifiez la valeur pour **Production** :
   ```
   NEXT_PUBLIC_APP_URL=https://pilotys.io
   ```

### 2. Vérifier APP_URL

Assurez-vous que `APP_URL` est également correctement configuré :
```
APP_URL=https://pilotys.io
```

**Note :** Le code priorise maintenant `APP_URL` avant `NEXT_PUBLIC_APP_URL`, mais il est recommandé de corriger les deux pour la cohérence.

### 3. Redéployer

Après avoir modifié les variables d'environnement :

1. **Option 1 : Redéploiement automatique**
   - Vercel redéploiera automatiquement si vous avez activé "Redeploy" lors de la modification

2. **Option 2 : Redéploiement manuel**
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** du dernier déploiement
   - Sélectionnez **Redeploy**

### 4. Vérifier la configuration

Après le redéploiement, vérifiez que la configuration est correcte :

1. Visitez : `https://pilotys.io/api/debug/resend-env`
2. Vérifiez que :
   - `APP_URL`: `https://pilotys.io`
   - `NEXT_PUBLIC_APP_URL`: `https://pilotys.io` (ou supprimé si non nécessaire)

### 5. Tester les emails

1. Testez la réinitialisation de mot de passe
2. Vérifiez que les liens dans l'email pointent vers `https://pilotys.io/...` et non vers `https://flowpilot-app.vercel.app/...`

## 📋 Configuration recommandée sur Vercel

Pour **Production** :

```
APP_URL=https://pilotys.io
NEXT_PUBLIC_APP_URL=https://pilotys.io
EMAIL_FROM=no-reply@pilotys.io
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 💡 Notes importantes

- **Priorité dans le code** : `APP_URL` > `NEXT_PUBLIC_APP_URL` > `VERCEL_URL`
- **Domaine de production** : Utilisez toujours `pilotys.io` pour la production
- **Environnements** : Configurez ces variables pour **Production**, **Preview** et **Development** selon vos besoins

