# 🆕 Créer une nouvelle base de données Neon (Solution rapide)

## 🎯 Problème
Vous n'avez pas accès à la base de données Neon actuelle (identifiants expirés ou base supprimée).

## ✅ Solution : Créer une nouvelle base de données Neon

### Étape 1 : Créer un nouveau projet Neon (5 minutes)

1. Allez sur **https://neon.tech**
2. Connectez-vous à votre compte
3. Cliquez sur **"Create Project"**
4. Remplissez les informations :
   - **Project name** : `flowpilot` (ou un autre nom)
   - **Region** : Choisissez une région proche (ex: `eu-central-1`)
   - **PostgreSQL version** : Laissez la version par défaut (généralement 15 ou 16)
5. Cliquez sur **"Create Project"**

### Étape 2 : Récupérer la Connection String (1 minute)

1. Dans le dashboard Neon, cliquez sur votre nouveau projet
2. Cliquez sur **"Connection Details"** ou **"Connection String"**
3. Sélectionnez **"Connection string"** (pas "Connection pooling")
4. **Copiez la Connection String** complète qui ressemble à :
   ```
   postgresql://neondb_owner:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Étape 3 : Mettre à jour `.env.local` (1 minute)

Ouvrez `.env.local` et remplacez `DATABASE_URL` par la nouvelle :

```env
DATABASE_URL="postgresql://neondb_owner:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

**⚠️ IMPORTANT** :
- Tout sur **une seule ligne** (pas de saut de ligne)
- Utilisez des guillemets doubles `"`

### Étape 4 : Appliquer les migrations (2 minutes)

```bash
npm run db:deploy
```

Cela créera toutes les tables nécessaires dans votre nouvelle base de données.

### Étape 5 : Vérifier que ça fonctionne

```bash
npm run db:check
```

Vous devriez voir :
- ✅ Connexion réussie
- ✅ Tables créées (User, Project, etc.)

### Étape 6 : Mettre à jour DATABASE_URL sur Vercel

1. Allez sur **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Trouvez `DATABASE_URL` ou créez-la si elle n'existe pas
3. **Value** : Collez la nouvelle Connection String de Neon
4. Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **"Save"**

### Étape 7 : Redéployer sur Vercel

1. Allez sur **Vercel Dashboard** → **Deployments** → **Redeploy**
2. Attendez que le déploiement se termine
3. Testez la création de compte

## ✅ Vérification finale

### Vérifier les tables avec Prisma Studio

```bash
npx prisma studio
```

Cela ouvrira Prisma Studio dans votre navigateur. Vous devriez voir toutes les tables vides (prêtes à être utilisées).

### Vérifier l'état des migrations

```bash
npx prisma migrate status
```

Cela devrait indiquer que toutes les migrations sont appliquées.

## 📝 Checklist

- [ ] Nouveau projet Neon créé
- [ ] Connection String copiée depuis Neon
- [ ] `.env.local` mis à jour avec la nouvelle DATABASE_URL
- [ ] Migrations appliquées (`npm run db:deploy`)
- [ ] Connexion testée (`npm run db:check`)
- [ ] DATABASE_URL mise à jour sur Vercel
- [ ] Redéploiement effectué sur Vercel

## 🆘 Si vous avez des données importantes dans l'ancienne base

Si vous aviez des données dans l'ancienne base de données et que vous voulez les récupérer :

1. **Essayez de vous connecter à l'ancienne base** avec l'ancienne DATABASE_URL
2. **Exportez les données** si possible
3. **Importez-les dans la nouvelle base** après avoir créé les tables

Sinon, vous devrez recommencer avec une base vide (ce qui est normal pour un nouveau projet).

## 💡 Astuce

Pour éviter ce problème à l'avenir :
- **Notez votre Connection String** dans un endroit sûr
- **Ne régénérez pas le mot de passe** sauf si nécessaire
- **Utilisez des variables d'environnement** plutôt que de hardcoder les URLs

