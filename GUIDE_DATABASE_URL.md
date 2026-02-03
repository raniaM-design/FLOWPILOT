# 🔧 Guide de configuration de DATABASE_URL

## Problème actuel

L'erreur indique que `DATABASE_URL` doit commencer par `postgresql://` ou `postgres://`, mais votre configuration actuelle ne respecte pas ce format.

## Solution

### Option 1 : Utiliser PostgreSQL (Recommandé pour la production)

1. **Créez ou modifiez `.env.local`** à la racine du projet :

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Exemple avec Neon (recommandé pour Vercel) :**
```env
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Exemple avec PostgreSQL local :**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowpilot?schema=public"
```

2. **Vérifiez la configuration :**
```bash
npm run db:check
```

3. **Appliquez les migrations :**
```bash
npx prisma migrate dev
```

### Option 2 : Utiliser SQLite en local (Plus simple pour le développement)

Si vous préférez utiliser SQLite en local :

1. **Modifiez `prisma/schema.prisma`** :
```prisma
datasource db {
  provider = "sqlite"  // Changez de "postgresql" à "sqlite"
  url      = env("DATABASE_URL")
}
```

2. **Créez ou modifiez `.env.local`** :
```env
DATABASE_URL="file:./prisma/dev.db"
```

3. **Régénérez le client Prisma :**
```bash
npx prisma generate
npx prisma db push
```

## Vérification

Après avoir configuré `DATABASE_URL`, testez la connexion :

```bash
npm run db:check
```

## Important

- **En production (Vercel)** : Vous DEVEZ utiliser PostgreSQL (SQLite n'est pas supporté)
- **En local** : Vous pouvez utiliser SQLite ou PostgreSQL selon vos préférences
- Le format de `DATABASE_URL` doit correspondre au `provider` dans `schema.prisma`

