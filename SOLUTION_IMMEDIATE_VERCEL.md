# ⚡ Solution immédiate : Configurer la base de données sur Vercel

## 🎯 Problème
La base de données n'est toujours pas configurée sur Vercel.

## ✅ Solution en 3 étapes

### Étape 1 : Vérifier DATABASE_URL sur Vercel (2 minutes)

1. Allez sur **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Vérifiez que `DATABASE_URL` existe
3. Si elle n'existe pas, ajoutez-la :
   - **Name** : `DATABASE_URL`
   - **Value** : Votre connection string Neon (commence par `postgresql://`)
   - **Environments** : Cochez **Production**, **Preview**, et **Development**
4. Cliquez sur **"Save"**

**Où trouver votre DATABASE_URL Neon :**
- https://console.neon.tech → Votre projet → **Connection Details** → Copiez la **Connection String**

### Étape 2 : Appliquer les migrations (2 minutes)

Depuis votre terminal local :

```bash
# Option A : Avec Vercel CLI (Recommandé)
vercel env pull .env.local
npm run db:deploy

# Option B : Directement avec votre DATABASE_URL Neon
DATABASE_URL="postgresql://neondb_owner:npg_jTkyCD0ng5mw@ep-lively-unit-agr9gjbq-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma migrate deploy
```

### Étape 3 : Redéployer sur Vercel (1 minute)

1. Allez sur **Vercel Dashboard** → Votre projet → **Deployments**
2. Cliquez sur **"Redeploy"** → **"Redeploy"**
3. Attendez que le déploiement se termine
4. Testez la création de compte

## 🔍 Vérification

### Vérifier les logs de build Vercel

1. Allez sur **Vercel Dashboard** → **Deployments** → [Dernier déploiement] → **Build Logs**
2. Cherchez :
   - ✅ `DATABASE_URL est correctement configurée`
   - ✅ `Client Prisma généré avec succès`
   - ✅ `Migrations appliquées avec succès` ou `No pending migrations to apply`

### Vérifier les logs runtime (si erreur lors de la création de compte)

1. Allez sur **Vercel Dashboard** → **Deployments** → [Dernier déploiement] → **Functions**
2. Cherchez les logs contenant `[auth/signup] Erreur DB`
3. Vérifiez le code d'erreur :
   - **P1003** ou **P1012** = Migrations non appliquées → Appliquez-les (Étape 2)
   - **P1001** = Base inaccessible → Vérifiez DATABASE_URL (Étape 1)
   - **P1000** = Authentification échouée → Vérifiez les identifiants dans DATABASE_URL

## 🐛 Si ça ne fonctionne toujours pas

### Vérifier que les tables existent

```bash
# Avec votre DATABASE_URL Neon
DATABASE_URL="votre_url_neon" npx prisma studio
```

Vous devriez voir les tables : User, Project, Decision, ActionItem, Meeting, etc.

### Vérifier l'état des migrations

```bash
DATABASE_URL="votre_url_neon" npx prisma migrate status
```

Cela vous dira quelles migrations sont appliquées.

## 📝 Checklist complète

- [ ] `DATABASE_URL` est définie dans **Vercel → Settings → Environment Variables**
- [ ] `DATABASE_URL` commence par `postgresql://` (pas `file:`)
- [ ] `DATABASE_URL` est définie pour **Production**, **Preview**, et **Development**
- [ ] Les migrations Prisma ont été appliquées (`npm run db:deploy`)
- [ ] Les tables existent (vérifier avec `prisma studio`)
- [ ] Redéploiement effectué sur Vercel après application des migrations

## 🆘 Besoin d'aide ?

Si le problème persiste, fournissez :
1. Les **logs de build Vercel** (surtout les messages sur DATABASE_URL)
2. Les **logs runtime Vercel** (si erreur lors de la création de compte)
3. Le **code d'erreur Prisma** (P1000, P1001, P1003, P1012, etc.)

