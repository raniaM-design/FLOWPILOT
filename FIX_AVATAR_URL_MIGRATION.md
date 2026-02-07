# 🔧 Correction - Colonne avatarUrl manquante

## 🎯 Problème

L'erreur suivante apparaît dans les logs Vercel :
```
Invalid `prisma.user.findUnique()` invocation:
The column `User.avatarUrl` does not exist in the current database.
```

## 🔍 Cause

La migration `20260207171146_add_user_avatar_and_updated_at` qui ajoute la colonne `avatarUrl` n'a pas été appliquée à la base de données de production.

## ✅ Solution

### Option 1 : Appliquer la migration manuellement (Recommandé)

#### Via Vercel CLI :

```bash
# 1. Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Récupérer les variables d'environnement
vercel env pull .env.local

# 4. Appliquer les migrations
npm run db:deploy
```

#### Directement avec votre DATABASE_URL :

```bash
# Remplacez par votre vraie DATABASE_URL Neon
DATABASE_URL="postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-REEL-ID.eu-central-1.aws.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
```

**Où trouver votre DATABASE_URL Neon** :
1. Allez sur https://console.neon.tech
2. Cliquez sur votre projet
3. Allez dans **"Connection Details"**
4. Copiez la **Connection String** complète

### Option 2 : Via Neon Console (SQL direct)

1. Allez sur https://console.neon.tech
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Exécutez cette requête SQL :

```sql
-- Ajouter la colonne avatarUrl si elle n'existe pas
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Ajouter la colonne updatedAt si elle n'existe pas
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

### Option 3 : Redéployer sur Vercel

Après avoir appliqué la migration manuellement :

1. Sur Vercel Dashboard, allez dans **Deployments**
2. Cliquez sur **Redeploy** pour le dernier déploiement
3. Vérifiez les logs pour confirmer que la migration a été appliquée

## 🔍 Vérification

Pour vérifier que la colonne existe :

```sql
-- Dans Neon SQL Editor
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name IN ('avatarUrl', 'updatedAt');
```

Vous devriez voir :
- `avatarUrl` (TEXT, nullable)
- `updatedAt` (TIMESTAMP, NOT NULL)

## 📋 Checklist

- [ ] Migration appliquée manuellement (Option 1 ou 2)
- [ ] Colonnes vérifiées dans la base de données
- [ ] Application redéployée sur Vercel
- [ ] Erreur disparue dans les logs Vercel

## 🆘 Si le problème persiste

1. **Vérifiez les logs Vercel** :
   - Deployments → [Dernier déploiement] → Functions → Runtime Logs
   - Cherchez les logs `[app/layout]` pour voir l'erreur exacte

2. **Vérifiez que DATABASE_URL est correcte** :
   ```bash
   vercel env pull .env.local
   cat .env.local | grep DATABASE_URL
   ```

3. **Testez la connexion** :
   ```bash
   npm run db:check
   ```

## 💡 Note

Le code a été amélioré pour gérer gracieusement l'absence de `avatarUrl` en production. Si la colonne n'existe pas, l'application continuera de fonctionner avec `avatarUrl = null` jusqu'à ce que la migration soit appliquée.

