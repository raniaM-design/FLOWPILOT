# Migration : Ajout de la colonne `preferredLanguage` à la table `User`

## Problème
La colonne `preferredLanguage` a été ajoutée au schéma Prisma mais n'existe pas encore dans la base de données, ce qui cause une erreur lors du login.

## Solution

### Option 1 : Utiliser Prisma Migrate (recommandé)

```bash
# Depuis la racine du projet
npx prisma migrate dev --name add_user_preferred_language
npx prisma generate
```

### Option 2 : Utiliser Prisma DB Push (dev uniquement)

```bash
npx prisma db push
npx prisma generate
```

### Option 3 : Migration SQL manuelle

Si les commandes Prisma ne fonctionnent pas, exécutez directement cette requête SQL :

```sql
ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT;
```

Puis régénérez le client Prisma :
```bash
npx prisma generate
```

### Option 4 : Script Node.js

Exécutez le script de migration :
```bash
node scripts/add-preferred-language-column.js
npx prisma generate
```

## Vérification

Après la migration, vérifiez que la colonne existe :
```bash
npx prisma studio
```

Ou via SQLite directement :
```sql
PRAGMA table_info(User);
```

## Code résilient

Le code de login a été modifié pour être résilient :
- `app/auth/login/route.ts` : utilise `select` minimal (id, email, passwordHash)
- `app/auth/signup/route.ts` : utilise `select` minimal pour la vérification
- `i18n/config.ts` : gère gracieusement l'absence de `preferredLanguage`

Le login fonctionnera même si la colonne n'existe pas encore, mais utilisera la langue par défaut (français).

## Après migration

1. Redémarrer le serveur de développement : `npm run dev`
2. Tester le login
3. Vérifier que le changement de langue fonctionne

