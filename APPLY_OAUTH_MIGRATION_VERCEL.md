# 🔧 Appliquer la migration OAuth sur Vercel

## Problème
L'erreur "La base de données n'existe pas" peut apparaître si les champs OAuth (`authProvider`, `providerId`) n'ont pas été ajoutés à la base de données de production.

## ✅ Solution : Appliquer la migration sur Vercel

### Option 1 : Via le script (Recommandé)

Le script `db:add-oauth-fields` peut être exécuté avec la DATABASE_URL de production :

```bash
# 1. Récupérer les variables d'environnement Vercel
vercel env pull .env.local

# 2. Appliquer les champs OAuth
npm run db:add-oauth-fields
```

### Option 2 : Via Vercel CLI

```bash
# 1. Se connecter à Vercel
vercel login

# 2. Récupérer les variables d'environnement
vercel env pull .env.local

# 3. Appliquer les migrations Prisma
npx prisma migrate deploy

# 4. Ajouter les champs OAuth manuellement
npm run db:add-oauth-fields
```

### Option 3 : Via SQL direct (Neon Console)

Si vous utilisez Neon, vous pouvez appliquer les modifications directement :

1. Allez sur https://console.neon.tech
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Exécutez ces requêtes SQL :

```sql
-- Rendre passwordHash optionnel
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Ajouter authProvider si manquant
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" TEXT;

-- Ajouter providerId si manquant
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "providerId" TEXT;

-- Créer l'index composite
CREATE INDEX IF NOT EXISTS "User_authProvider_providerId_idx" ON "User"("authProvider", "providerId");

-- Créer la contrainte unique composite
CREATE UNIQUE INDEX IF NOT EXISTS "User_authProvider_providerId_key" 
ON "User"("authProvider", "providerId") 
WHERE "authProvider" IS NOT NULL AND "providerId" IS NOT NULL;
```

## ✅ Vérification

Après avoir appliqué les migrations, vérifiez que les colonnes existent :

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User' 
AND table_schema = 'public'
AND column_name IN ('passwordHash', 'authProvider', 'providerId');
```

Vous devriez voir :
- `passwordHash` : `text`, `YES` (nullable)
- `authProvider` : `text`, `YES` (nullable)
- `providerId` : `text`, `YES` (nullable)

## 🚀 Redéployer sur Vercel

Après avoir appliqué les migrations :

1. Allez sur **Vercel Dashboard** → Votre projet → **Deployments**
2. Cliquez sur **"Redeploy"** → **"Redeploy"**
3. Testez la connexion Google OAuth - ça devrait fonctionner maintenant ! 🎉

## 📝 Note importante

Si vous avez déjà des utilisateurs dans votre base de données :
- Les utilisateurs existants auront `authProvider = null` et `passwordHash` non null
- Les nouveaux utilisateurs créés via Google OAuth auront `authProvider = "google"` et `passwordHash = null`
- Les nouveaux utilisateurs créés via email/mot de passe auront `authProvider = "password"` et `passwordHash` non null

