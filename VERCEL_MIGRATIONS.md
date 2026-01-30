# 🔧 Guide : Appliquer les migrations Prisma sur Vercel

## Problème

L'erreur "Erreur de connexion à la base de données" peut être causée par des migrations Prisma non appliquées sur la base de données de production.

## Solution : Appliquer les migrations sur Vercel

### Option 1 : Via la commande de build Vercel (Recommandé)

1. **Dans Vercel Dashboard** :
   - Allez dans **Settings > Build & Development Settings**
   - Modifiez **Build Command** pour :
     ```bash
     prisma generate && prisma migrate deploy && next build
     ```
   - Ou utilisez le script npm :
     ```bash
     npm run vercel-build
     ```

2. **Redeploy** votre application pour appliquer les migrations

### Option 2 : Via Vercel CLI (Alternative)

Si vous avez Vercel CLI installé localement :

```bash
# Se connecter à Vercel
vercel login

# Appliquer les migrations directement
vercel env pull .env.local
npx prisma migrate deploy
```

### Option 3 : Via le terminal Vercel (Temporaire)

1. Dans Vercel Dashboard, allez dans votre déploiement
2. Cliquez sur **View Function Logs** > **Runtime Logs**
3. Utilisez le terminal intégré (si disponible) pour exécuter :
   ```bash
   npx prisma migrate deploy
   ```

## Vérification

Après avoir appliqué les migrations, vérifiez que les tables existent :

```bash
# En local avec la même DATABASE_URL que Vercel
npm run db:check
```

Ou connectez-vous directement à votre base de données PostgreSQL et vérifiez :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Vous devriez voir :
- `User`
- `Project`
- `Decision`
- `ActionItem`
- `Meeting`
- `OutlookAccount`
- `OutlookSyncState`

## Variables d'environnement requises sur Vercel

Assurez-vous que ces variables sont configurées dans **Settings > Environment Variables** :

- ✅ `DATABASE_URL` : URL PostgreSQL complète
- ✅ `FLOWPILOT_JWT_SECRET` : Secret JWT (32+ caractères)

## Dépannage

### Erreur : "Migration failed"

Si les migrations échouent, vérifiez :
1. Que `DATABASE_URL` est correcte
2. Que l'utilisateur de la base de données a les permissions nécessaires
3. Que les migrations précédentes ont été appliquées

### Erreur : "Table already exists"

Si une table existe déjà mais avec un schéma différent :
1. Utilisez `prisma db push` pour synchroniser (⚠️ peut perdre des données)
2. Ou créez une nouvelle migration pour modifier le schéma

### Erreur : "Can't reach database"

Vérifiez :
1. Que la base de données est accessible depuis Internet
2. Que le firewall autorise les connexions depuis Vercel
3. Que l'URL de connexion est correcte

## Commandes utiles

```bash
# Vérifier la connexion
npm run db:check

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations (production)
npm run db:deploy

# Créer une nouvelle migration (développement)
npm run db:migrate
```

