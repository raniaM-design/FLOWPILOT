# ⚡ Démarrage rapide : Configurer la base de données pour Vercel

## 🎯 Solution la plus rapide : Neon (5 minutes)

### Étape 1 : Créer une base de données Neon (2 minutes)

1. Allez sur **https://neon.tech** et créez un compte (gratuit)
2. Cliquez sur **"Create Project"**
3. Choisissez un nom (ex: `flowpilot`) et une région
4. Cliquez sur **"Create Project"**

### Étape 2 : Copier la connection string (1 minute)

1. Dans le dashboard Neon, cliquez sur votre projet
2. Cliquez sur **"Connection Details"**
3. Copiez la **Connection String** (elle commence par `postgresql://`)

### Étape 3 : Ajouter sur Vercel (1 minute)

1. Allez sur **Vercel** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. **Name** : `DATABASE_URL`
4. **Value** : Collez la connection string de Neon
5. Cochez **Production**, **Preview**, et **Development**
6. Cliquez sur **"Save"**

### Étape 4 : Appliquer les migrations (1 minute)

Depuis votre terminal local :

```bash
# Remplacez par votre connection string Neon
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require" npx prisma migrate deploy
```

### Étape 5 : Redéployer sur Vercel

1. Allez sur **Vercel Dashboard** → Votre projet → **Deployments**
2. Cliquez sur **"Redeploy"** → **"Redeploy"**

C'est tout ! 🎉

---

## 🔐 Générer FLOWPILOT_JWT_SECRET

Si vous n'avez pas encore `FLOWPILOT_JWT_SECRET` :

1. Allez sur **Vercel** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. **Name** : `FLOWPILOT_JWT_SECRET`
4. **Value** : Générez un secret avec :
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```
   Ou utilisez : https://generate-secret.vercel.app/32
5. Cochez **Production**, **Preview**, et **Development**
6. Cliquez sur **"Save"**

---

## ✅ Vérification

Après le redéploiement, testez :

1. Allez sur votre application déployée
2. Essayez de créer un compte
3. Si ça fonctionne, tout est configuré ! ✅

---

## 🆘 Besoin d'aide ?

Consultez le guide complet : `SETUP_DATABASE_VERCEL.md`

