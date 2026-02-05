# 🔑 Obtenir une nouvelle Connection String Neon

## 🎯 Problème
L'authentification échoue (P1000) car les identifiants Neon dans DATABASE_URL ne sont plus valides.

## ✅ Solution : Obtenir une nouvelle Connection String

### Option 1 : Régénérer le mot de passe du projet existant

1. Allez sur **https://console.neon.tech**
2. Cliquez sur votre projet `ep-lively-unit-agr9gjbq`
3. Allez dans **"Settings"** ou **"Connection Details"**
4. Cherchez **"Reset Password"** ou **"Regenerate Connection String"**
5. Cliquez pour régénérer
6. **Copiez la nouvelle Connection String** complète

### Option 2 : Créer un nouveau projet Neon (si l'ancien ne fonctionne plus)

1. Allez sur **https://neon.tech**
2. Cliquez sur **"Create Project"**
3. Remplissez :
   - **Name** : `flowpilot` (ou autre)
   - **Region** : `eu-central-1` (ou proche de vous)
4. Cliquez sur **"Create Project"**
5. **Copiez la Connection String** depuis **"Connection Details"**

## 📋 Format de la Connection String

La Connection String doit ressembler à :
```
postgresql://neondb_owner:NOUVEAU_MOT_DE_PASSE@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

## 🔧 Mettre à jour .env.local

Une fois que vous avez la nouvelle Connection String :

1. Ouvrez `.env.local` à la racine du projet
2. Remplacez la ligne `DATABASE_URL` par :
   ```env
   DATABASE_URL="postgresql://neondb_owner:NOUVEAU_MOT_DE_PASSE@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
3. **⚠️ IMPORTANT** : Tout sur **une seule ligne**, pas de saut de ligne
4. Sauvegardez le fichier

## 🚀 Appliquer automatiquement

Après avoir mis à jour `.env.local`, exécutez :

```bash
# Corriger le format si nécessaire
node scripts/fix-env-local.js

# Vérifier la connexion
npm run db:check

# Appliquer les migrations
npm run db:deploy
```

## 📝 Mettre à jour sur Vercel

N'oubliez pas de mettre à jour DATABASE_URL sur Vercel aussi :

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Trouvez `DATABASE_URL`
3. Cliquez sur **"Edit"**
4. Collez la **nouvelle Connection String**
5. Cliquez sur **"Save"**
6. **Redéployez** votre application

## ✅ Vérification

Après avoir mis à jour :

```bash
npm run db:check
```

Vous devriez voir :
- ✅ Connexion réussie
- ✅ Tables existantes (ou prêtes à être créées)

