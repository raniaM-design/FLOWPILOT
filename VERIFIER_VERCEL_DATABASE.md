# 🔍 Vérifier la configuration de la base de données sur Vercel

## 🎯 Problème
Vous recevez "La base de données n'est pas configurée" lors de la création de compte sur Vercel.

## ✅ Solution en 3 étapes

### Étape 1 : Vérifier DATABASE_URL sur Vercel

1. **Allez sur Vercel Dashboard** :
   - https://vercel.com/dashboard
   - Cliquez sur votre projet

2. **Allez dans Settings → Environment Variables** :
   - Cherchez `DATABASE_URL`
   - Vérifiez qu'elle est définie pour **Production**, **Preview**, et **Development**

3. **Vérifiez le format** :
   - ✅ Doit commencer par `postgresql://` ou `postgres://`
   - ✅ Ne doit **PAS** contenir de placeholders (`xxx`, `user`, `password`, `dbname`)
   - ✅ Doit être la **vraie** Connection String Neon

**Format attendu (Neon)** :
```
postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-REEL-ID.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### Étape 2 : Vérifier les logs de build Vercel

1. **Allez dans Deployments** → Cliquez sur le dernier déploiement
2. **Cherchez les logs de migration** :
   - Cherchez `🔄 Application des migrations Prisma...`
   - Cherchez `✅ Migrations appliquées avec succès`
   - Ou `⚠️ Erreur lors de l'application des migrations`

3. **Si vous voyez une erreur** :
   - Notez le code d'erreur (P1000, P1001, P1002, P1003, P1012, etc.)
   - Vérifiez les détails dans les logs

### Étape 3 : Appliquer les migrations manuellement (si nécessaire)

Si les migrations n'ont pas été appliquées automatiquement :

#### Option A : Via Vercel CLI (Recommandé)

```bash
# 1. Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Récupérer les variables d'environnement
vercel env pull .env.local

# 4. Vérifier que DATABASE_URL est correcte
node scripts/diagnose-db-connection.js

# 5. Appliquer les migrations
npm run db:deploy

# 6. Vérifier la connexion
npm run db:check
```

#### Option B : Directement avec votre DATABASE_URL Neon

```bash
# Remplacez par votre vraie DATABASE_URL
DATABASE_URL="postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-REEL-ID.eu-central-1.aws.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
```

**Où trouver votre DATABASE_URL Neon** :
1. Allez sur https://console.neon.tech
2. Cliquez sur votre projet
3. Allez dans **"Connection Details"**
4. Copiez la **Connection String** complète

## 🔍 Diagnostic des erreurs courantes

### Erreur P1003 : "Database does not exist"
**Cause** : La base de données spécifiée dans DATABASE_URL n'existe pas

**Solution** :
1. Vérifiez que le nom de la base de données dans DATABASE_URL est correct
2. Pour Neon, le nom par défaut est généralement `neondb`
3. Vérifiez sur Neon Dashboard que la base de données existe

### Erreur P1012 : "Schema validation error" ou "Column does not exist"
**Cause** : Les migrations ne sont pas appliquées (tables/colonnes manquantes)

**Solution** :
1. Appliquez les migrations manuellement (voir Étape 3)
2. Vérifiez les logs de build Vercel pour voir pourquoi les migrations ont échoué

### Erreur P1000 : "Authentication failed"
**Cause** : Les identifiants dans DATABASE_URL sont incorrects

**Solution** :
1. Allez sur Neon Dashboard
2. Régénérez le mot de passe
3. Copiez la nouvelle Connection String
4. Mettez à jour DATABASE_URL sur Vercel

### Erreur P1001 : "Can't reach database server"
**Cause** : L'URL de connexion est incorrecte ou le serveur est inaccessible

**Solution** :
1. Vérifiez que DATABASE_URL ne contient pas de placeholders
2. Vérifiez que le projet Neon est actif (non suspendu)
3. Testez la connexion depuis Neon Dashboard

## ✅ Vérification finale

Après avoir appliqué les migrations :

1. **Vérifiez que les tables existent** :
   ```bash
   npm run db:check
   ```

2. **Redéployez sur Vercel** :
   - Vercel Dashboard → Deployments → **Redeploy**

3. **Testez la création de compte** :
   - Allez sur votre site Vercel
   - Essayez de créer un compte
   - Ça devrait fonctionner maintenant ! 🎉

## 📋 Checklist

- [ ] DATABASE_URL est définie sur Vercel (Settings → Environment Variables)
- [ ] DATABASE_URL ne contient **pas** de placeholders (`xxx`, `user`, `password`)
- [ ] DATABASE_URL est la **vraie** Connection String Neon
- [ ] Les migrations sont appliquées (vérifié dans les logs de build ou manuellement)
- [ ] Les tables existent (vérifié avec `npm run db:check`)
- [ ] Application redéployée sur Vercel

## 🆘 Besoin d'aide ?

Si le problème persiste :

1. **Vérifiez les logs Vercel** :
   - Deployments → [Dernier déploiement] → Functions → Runtime Logs
   - Cherchez les logs `[auth/signup]` pour voir l'erreur exacte

2. **Exécutez le diagnostic local** :
   ```bash
   vercel env pull .env.local
   node scripts/diagnose-db-connection.js
   npm run db:check
   ```

3. **Vérifiez que votre projet Neon est actif** :
   - https://console.neon.tech
   - Assurez-vous que le projet n'est pas suspendu

