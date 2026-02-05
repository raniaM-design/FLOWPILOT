# 🔧 Guide de résolution - Erreur de base de données lors de la création de compte sur Vercel

## Problème
L'erreur "Erreur de configuration de la base de données. Veuillez contacter le support." apparaît lors de la création de compte sur Vercel.

## 🔍 Diagnostic

### Étape 1 : Vérifier les logs Vercel

1. Allez dans **Vercel → Votre projet → Deployments → [Dernier déploiement] → Functions**
2. Cherchez les logs contenant `[auth/signup] Erreur DB`
3. Vérifiez les informations suivantes dans les logs :
   - `code` : Code d'erreur Prisma (P1000, P1001, P1003, P1012, etc.)
   - `hasDatabaseUrl` : Doit être `true`
   - `isPostgres` : Doit être `true` en production
   - `isSqlite` : Doit être `false` en production

### Étape 2 : Vérifier DATABASE_URL sur Vercel

Dans **Vercel → Settings → Environment Variables**, vérifiez que `DATABASE_URL` est définie avec le bon format :

**Format attendu pour PostgreSQL (production) :**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Exemples selon le fournisseur :**

#### Neon
```env
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

#### Supabase
```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?schema=public"
```

#### Railway
```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway?schema=public"
```

**⚠️ IMPORTANT** :
- L'URL doit commencer par `postgresql://` ou `postgres://`
- Ne pas utiliser SQLite (`file:./prisma/dev.db`) en production sur Vercel
- Vérifier que les identifiants (user, password) sont corrects
- Vérifier que le host et le port sont accessibles depuis Vercel

### Étape 3 : Vérifier les migrations Prisma

Les migrations doivent être appliquées sur la base de données de production.

#### Option 1 : Via le script de build (automatique)

Le script `vercel-build` inclut `scripts/safe-migrate.js` qui devrait appliquer les migrations automatiquement.

#### Option 2 : Manuellement

Si les migrations ne sont pas appliquées automatiquement :

1. **Installer Prisma CLI** (si pas déjà fait) :
   ```bash
   npm install -g prisma
   ```

2. **Appliquer les migrations** :
   ```bash
   DATABASE_URL="votre_url_production" npx prisma migrate deploy
   ```

   Ou depuis votre machine locale avec la DATABASE_URL de production :
   ```bash
   npx prisma migrate deploy
   ```

### Étape 4 : Vérifier que la base de données existe

Si vous obtenez l'erreur `P1003` (database does not exist) :

1. **Créez la base de données** sur votre fournisseur (Neon, Supabase, Railway, etc.)
2. **Mettez à jour DATABASE_URL** dans Vercel avec la nouvelle URL
3. **Appliquez les migrations** (voir étape 3)

## 🐛 Codes d'erreur Prisma et solutions

### P1000 - Authentication failed
**Cause** : Identifiants incorrects dans DATABASE_URL (user/password)

**Solution** :
1. Vérifiez les identifiants dans votre DATABASE_URL
2. Régénérez le mot de passe si nécessaire sur votre fournisseur de base de données
3. Mettez à jour DATABASE_URL dans Vercel

### P1001 - Can't reach database server
**Cause** : Le serveur de base de données n'est pas accessible

**Solution** :
1. Vérifiez que votre base de données est active et démarrée
2. Vérifiez que le host et le port dans DATABASE_URL sont corrects
3. Vérifiez les règles de firewall (certains fournisseurs nécessitent d'autoriser les IPs de Vercel)

### P1003 - Database does not exist
**Cause** : La base de données spécifiée dans DATABASE_URL n'existe pas

**Solution** :
1. Créez la base de données sur votre fournisseur
2. Mettez à jour DATABASE_URL avec le nom correct de la base de données

### P1012 - Schema validation error
**Cause** : Le schéma de la base de données ne correspond pas au schéma Prisma (migrations non appliquées)

**Solution** :
1. Appliquez les migrations Prisma (voir étape 3)
2. Vérifiez que toutes les tables existent dans la base de données

## ✅ Checklist de vérification

- [ ] `DATABASE_URL` est définie dans Vercel → Settings → Environment Variables
- [ ] `DATABASE_URL` commence par `postgresql://` ou `postgres://` (pas `file:`)
- [ ] Les identifiants (user, password) dans `DATABASE_URL` sont corrects
- [ ] Le host et le port dans `DATABASE_URL` sont accessibles
- [ ] La base de données existe sur votre fournisseur
- [ ] Les migrations Prisma ont été appliquées (`prisma migrate deploy`)
- [ ] Le script `vercel-build` s'exécute correctement (vérifier les logs de build)

## 🔧 Scripts utiles

### Tester la connexion à la base de données

```bash
# En local avec la DATABASE_URL de production
DATABASE_URL="votre_url_production" npm run db:check
```

### Appliquer les migrations

```bash
# En local avec la DATABASE_URL de production
DATABASE_URL="votre_url_production" npm run db:deploy
```

### Générer le client Prisma

```bash
# En local avec la DATABASE_URL de production
DATABASE_URL="votre_url_production" npm run db:generate
```

## 📝 Configuration recommandée pour Vercel

### Variables d'environnement minimales

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
FLOWPILOT_JWT_SECRET="votre-secret-jwt-tres-long-et-aleatoire-minimum-32-caracteres"
```

### Script de build Vercel

Le script `vercel-build` dans `package.json` devrait être :
```json
"vercel-build": "node scripts/pre-build-check.js && node scripts/pre-build-generate-prisma.js && node scripts/safe-migrate.js && next build"
```

## 🧪 Test après correction

1. **Vérifier les logs de build** Vercel pour voir si Prisma génère correctement le client
2. **Vérifier les logs de déploiement** pour voir si les migrations sont appliquées
3. **Tester la création de compte** depuis l'application
4. **Vérifier les logs en temps réel** dans Vercel pour voir les erreurs détaillées

## 📞 Support supplémentaire

Si le problème persiste après avoir vérifié tous les points ci-dessus :

1. **Copier les logs complets** de Vercel contenant :
   - `[auth/signup] Erreur DB lors de la création:`
   - Les informations sur `hasDatabaseUrl`, `isPostgres`, `isSqlite`
   - Le code d'erreur Prisma exact

2. **Vérifier la configuration de la base de données** :
   - Host accessible depuis Internet
   - Port ouvert (généralement 5432 pour PostgreSQL)
   - Identifiants corrects
   - Base de données créée

3. **Tester la connexion manuellement** :
   ```bash
   psql "postgresql://user:password@host:5432/database"
   ```

