# ⚡ Solution immédiate : Appliquer les migrations Prisma

## 🎯 Problème
Vous avez `DATABASE_URL` configurée mais recevez "La base de données n'est pas configurée" car **les tables n'existent pas encore**.

## ✅ Solution : Appliquer les migrations (2 minutes)

### Option 1 : Avec Vercel CLI (Recommandé)

```bash
# 1. Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# 2. Se connecter à Vercel
vercel login

# 3. Récupérer les variables d'environnement (inclut DATABASE_URL)
vercel env pull .env.local

# 4. Appliquer les migrations Prisma
npx prisma migrate deploy
```

### Option 2 : Manuellement avec votre DATABASE_URL Neon

```bash
# Remplacez par votre vraie DATABASE_URL de Neon
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require" npx prisma migrate deploy
```

**Où trouver votre DATABASE_URL Neon :**
1. Allez sur https://console.neon.tech
2. Cliquez sur votre projet
3. Cliquez sur **"Connection Details"**
4. Copiez la **Connection String**

### Option 3 : Si vous n'avez pas encore de migrations

Si vous obtenez "No migrations found", créez d'abord une migration :

```bash
# Avec votre DATABASE_URL
DATABASE_URL="votre_url_neon" npx prisma migrate dev --name init
```

Puis appliquez-la :

```bash
DATABASE_URL="votre_url_neon" npx prisma migrate deploy
```

## ✅ Vérification

Après avoir appliqué les migrations, vérifiez que les tables existent :

```bash
# Ouvrir Prisma Studio pour voir les tables
DATABASE_URL="votre_url_neon" npx prisma studio
```

Vous devriez voir les tables :
- ✅ User
- ✅ Project
- ✅ Decision
- ✅ ActionItem
- ✅ Meeting
- ✅ OutlookAccount
- etc.

## 🚀 Redéployer sur Vercel

Après avoir appliqué les migrations :

1. Allez sur **Vercel Dashboard** → Votre projet → **Deployments**
2. Cliquez sur **"Redeploy"** → **"Redeploy"**
3. Testez la création de compte - ça devrait fonctionner maintenant ! 🎉

## 🐛 Si ça ne fonctionne toujours pas

### Vérifier les logs Vercel

1. Allez dans **Vercel → Deployments → [Dernier déploiement] → Functions**
2. Cherchez les logs contenant `[auth/signup] Erreur DB`
3. Vérifiez le code d'erreur :
   - **P1003** = Tables n'existent pas → Appliquer migrations
   - **P1012** = Schéma invalide → Appliquer migrations
   - **P1001** = Base inaccessible → Vérifier DATABASE_URL

### Tester la connexion

```bash
DATABASE_URL="votre_url_neon" npm run db:check
```

Cela vous dira si les tables existent ou non.

