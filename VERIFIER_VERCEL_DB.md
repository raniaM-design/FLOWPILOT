# 🔍 Vérification de la configuration de la base de données sur Vercel

## Problème
La base de données n'est toujours pas configurée sur Vercel.

## ✅ Checklist de vérification

### Étape 1 : Vérifier DATABASE_URL sur Vercel

1. Allez sur **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Vérifiez que `DATABASE_URL` existe et contient votre URL Neon PostgreSQL
3. Format attendu : `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`

**⚠️ IMPORTANT** :
- Vérifiez que `DATABASE_URL` est définie pour **Production**, **Preview**, et **Development**
- L'URL doit commencer par `postgresql://` ou `postgres://` (pas `file:`)

### Étape 2 : Vérifier les logs de build Vercel

1. Allez sur **Vercel Dashboard** → Votre projet → **Deployments** → [Dernier déploiement]
2. Cliquez sur **"Build Logs"**
3. Cherchez les messages suivants :
   - ✅ `DATABASE_URL est correctement configurée`
   - ✅ `Client Prisma généré avec succès`
   - ✅ `Migrations appliquées avec succès` ou `No pending migrations to apply`

### Étape 3 : Vérifier les logs runtime (si erreur lors de la création de compte)

1. Allez sur **Vercel Dashboard** → Votre projet → **Deployments** → [Dernier déploiement]
2. Cliquez sur **"Functions"** → Cherchez `/api/auth/signup` ou la route qui échoue
3. Cherchez les logs contenant `[auth/signup] Erreur DB`
4. Vérifiez le code d'erreur :
   - **P1003** = Tables n'existent pas → Migrations non appliquées
   - **P1012** = Schéma invalide → Migrations non appliquées
   - **P1001** = Base inaccessible → DATABASE_URL incorrecte
   - **P1000** = Authentification échouée → Identifiants incorrects

### Étape 4 : Appliquer les migrations manuellement (si nécessaire)

Si les migrations ne sont pas appliquées automatiquement :

**Option A : Via Vercel CLI**

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Récupérer les variables d'environnement
vercel env pull .env.local

# Appliquer les migrations
npm run db:deploy
```

**Option B : Directement avec votre DATABASE_URL Neon**

```bash
DATABASE_URL="votre_url_neon_complete" npx prisma migrate deploy
```

## 🐛 Diagnostic des problèmes courants

### Problème 1 : "DATABASE_URL n'est pas définie" dans les logs

**Solution** :
1. Vérifiez que `DATABASE_URL` est bien dans **Vercel → Settings → Environment Variables**
2. Vérifiez que vous avez sélectionné **Production**, **Preview**, et **Development**
3. Redéployez après avoir ajouté/modifié la variable

### Problème 2 : "P1003 - Database does not exist" ou "P1012 - Schema validation error"

**Solution** : Les migrations ne sont pas appliquées. Appliquez-les manuellement (voir Étape 4).

### Problème 3 : "P1001 - Can't reach database server"

**Solution** :
1. Vérifiez que votre base Neon est active (non suspendue)
2. Vérifiez que l'URL dans Vercel est correcte
3. Vérifiez que les IPs de Vercel sont autorisées (généralement automatique avec Neon)

### Problème 4 : "P1000 - Authentication failed"

**Solution** :
1. Vérifiez que le mot de passe dans DATABASE_URL est correct
2. Régénérez le mot de passe sur Neon si nécessaire
3. Mettez à jour DATABASE_URL dans Vercel

## 📝 Vérification rapide

### Tester la connexion depuis votre machine locale

```bash
# Récupérer les variables Vercel
vercel env pull .env.local

# Tester la connexion
npm run db:check
```

Si ça fonctionne en local avec les variables Vercel, le problème est probablement que les migrations ne sont pas appliquées sur Vercel.

### Vérifier l'état des migrations

```bash
DATABASE_URL="votre_url_neon" npx prisma migrate status
```

Cela vous dira quelles migrations sont appliquées et lesquelles sont en attente.

## 🚀 Solution rapide

Si vous voulez appliquer les migrations immédiatement :

1. **Récupérez votre DATABASE_URL Neon** depuis https://console.neon.tech
2. **Appliquez les migrations** :
   ```bash
   DATABASE_URL="votre_url_neon" npx prisma migrate deploy
   ```
3. **Redéployez sur Vercel** (ou attendez le prochain déploiement)
4. **Testez la création de compte**

## 📞 Informations à fournir pour diagnostic

Si le problème persiste, fournissez :

1. **Logs de build Vercel** (surtout les messages sur DATABASE_URL et migrations)
2. **Logs runtime Vercel** (si erreur lors de la création de compte)
3. **Code d'erreur Prisma** (P1000, P1001, P1003, P1012, etc.)
4. **Résultat de** `npx prisma migrate status` avec votre DATABASE_URL Neon

