# 🔧 Configuration de la base de données

## Problème actuel

Votre schéma Prisma est configuré pour PostgreSQL (`provider = "postgresql"`), mais votre `DATABASE_URL` pointe vers SQLite (`file:./prisma/dev.db`).

## Solutions

### Option 1 : Utiliser SQLite en développement (Recommandé pour commencer rapidement)

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "sqlite"  // Changez de "postgresql" à "sqlite"
  url      = env("DATABASE_URL")
}
```

Puis dans votre `.env.local` :
```env
DATABASE_URL="file:./prisma/dev.db"
```

Ensuite, régénérez le client Prisma :
```bash
npx prisma generate
npx prisma db push
```

### Option 2 : Utiliser PostgreSQL (Recommandé pour la production)

1. **Installez PostgreSQL** localement ou utilisez un service cloud (Neon, Supabase, Railway)

2. **Créez une base de données** :
```sql
CREATE DATABASE flowpilot;
```

3. **Mettez à jour `.env.local`** :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/flowpilot?schema=public"
```

4. **Appliquez les migrations** :
```bash
npx prisma migrate dev
```

### Option 3 : Utiliser deux schémas (Développement et Production)

Créez deux fichiers :
- `prisma/schema.prisma` (PostgreSQL pour production)
- `prisma/schema.dev.prisma` (SQLite pour développement)

Mais cela nécessite de changer le schéma avant chaque build.

## Recommandation

Pour le développement local, utilisez **SQLite** (Option 1) car c'est plus simple et ne nécessite pas d'installation supplémentaire.

Pour la production sur Vercel, utilisez **PostgreSQL** (Neon, Supabase, etc.) car SQLite n'est pas adapté aux environnements serverless.

## Migration de SQLite vers PostgreSQL

Si vous avez déjà des données en SQLite et voulez migrer vers PostgreSQL :

1. Exportez les données de SQLite
2. Créez une nouvelle base PostgreSQL
3. Changez le schéma Prisma pour PostgreSQL
4. Importez les données

Ou utilisez un outil de migration comme `prisma db pull` pour synchroniser le schéma.

