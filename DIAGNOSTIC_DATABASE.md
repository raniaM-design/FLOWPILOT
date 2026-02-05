# 🔍 Diagnostic : "La base de données n'est pas configurée"

## Problème
Vous avez configuré `DATABASE_URL` dans Vercel mais recevez toujours le message "La base de données n'est pas configurée".

## 🔍 Cause probable

Le message apparaît quand :
- **P1003** : La base de données n'existe pas OU les tables n'existent pas
- **P1012** : Les migrations Prisma n'ont pas été appliquées (pas de tables)

**Solution** : Les migrations Prisma doivent être appliquées pour créer les tables.

## ✅ Solution : Appliquer les migrations

### Étape 1 : Vérifier DATABASE_URL

Assurez-vous que `DATABASE_URL` est correctement configurée dans Vercel :
- Vercel → Settings → Environment Variables
- Vérifiez que `DATABASE_URL` existe et commence par `postgresql://`

### Étape 2 : Appliquer les migrations depuis votre machine locale

**Option A : Avec Vercel CLI (Recommandé)**

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter à Vercel
vercel login

# Récupérer les variables d'environnement
vercel env pull .env.local

# Appliquer les migrations
npx prisma migrate deploy
```

**Option B : Manuellement avec votre DATABASE_URL Neon**

```bash
# Remplacez par votre vraie DATABASE_URL de Neon
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require" npx prisma migrate deploy
```

### Étape 3 : Vérifier que les tables ont été créées

```bash
# Avec votre DATABASE_URL
DATABASE_URL="votre_url_neon" npx prisma studio
```

Cela ouvrira Prisma Studio dans votre navigateur. Vous devriez voir les tables :
- `User`
- `Project`
- `Decision`
- `ActionItem`
- `Meeting`
- `OutlookAccount`
- etc.

### Étape 4 : Redéployer sur Vercel

Après avoir appliqué les migrations :
1. Allez sur Vercel Dashboard → Votre projet → Deployments
2. Cliquez sur **"Redeploy"**
3. Testez la création de compte

## 🔍 Diagnostic avancé

### Vérifier les logs Vercel

1. Allez dans **Vercel → Deployments → [Dernier déploiement] → Functions**
2. Cherchez les logs contenant `[auth/signup] Erreur DB`
3. Vérifiez le code d'erreur :
   - **P1003** = Base de données ou tables n'existent pas → Appliquer migrations
   - **P1012** = Schéma invalide → Appliquer migrations
   - **P1001** = Base de données inaccessible → Vérifier DATABASE_URL
   - **P1000** = Authentification échouée → Vérifier les identifiants

### Tester la connexion

```bash
# Tester la connexion à la base de données
DATABASE_URL="votre_url_neon" npm run db:check
```

### Vérifier l'état des migrations

```bash
# Vérifier quelles migrations sont appliquées
DATABASE_URL="votre_url_neon" npx prisma migrate status
```

## 🐛 Si les migrations échouent

### Erreur : "No migrations found"

Si vous n'avez pas encore créé de migrations :

```bash
# Créer une migration initiale
DATABASE_URL="votre_url_neon" npx prisma migrate dev --name init
```

Puis appliquez-la :

```bash
DATABASE_URL="votre_url_neon" npx prisma migrate deploy
```

### Erreur : "Migration already applied"

C'est normal si les migrations sont déjà appliquées. Vérifiez que les tables existent avec `prisma studio`.

### Erreur : "Can't reach database server"

1. Vérifiez que votre DATABASE_URL est correcte
2. Vérifiez que la base de données Neon est active (non suspendue)
3. Testez la connexion avec `npm run db:check`

## 📝 Checklist complète

- [ ] `DATABASE_URL` est définie dans Vercel → Environment Variables
- [ ] `DATABASE_URL` commence par `postgresql://` (pas `file:`)
- [ ] La base de données Neon existe et est active
- [ ] Les migrations Prisma ont été appliquées (`prisma migrate deploy`)
- [ ] Les tables existent (vérifier avec `prisma studio`)
- [ ] Redéploiement effectué sur Vercel après application des migrations

## 🆘 Besoin d'aide ?

Si le problème persiste après avoir appliqué les migrations :

1. **Copiez les logs Vercel** contenant `[auth/signup] Erreur DB`
2. **Vérifiez le code d'erreur** (P1003, P1012, etc.)
3. **Testez la connexion** avec `npm run db:check`
4. **Vérifiez l'état des migrations** avec `prisma migrate status`

