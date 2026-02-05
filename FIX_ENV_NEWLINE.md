# 🔧 Correction : DATABASE_URL avec saut de ligne

## Problème détecté

Votre `.env.local` contient une `DATABASE_URL` valide mais avec un **saut de ligne** au milieu :

```env
DATABASE_URL='postgresql://neondb_owner:npg_jTkyCD0ng5mw@ep-lively-unit-agr9gjbq-pooler.c-2.eu-central-1.aws.neon.tech/
neondb?sslmode=require&channel_binding=require'
```

## ✅ Solution : Mettre l'URL sur une seule ligne

### Étape 1 : Ouvrir `.env.local`

Ouvrez le fichier `.env.local` à la racine du projet dans un éditeur de texte.

### Étape 2 : Corriger DATABASE_URL

Remplacez la ligne cassée par une seule ligne :

```env
DATABASE_URL="postgresql://neondb_owner:npg_jTkyCD0ng5mw@ep-lively-unit-agr9gjbq-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**⚠️ IMPORTANT** :
- Tout sur **une seule ligne** (pas de saut de ligne)
- Utilisez des guillemets doubles `"` au lieu de simples `'`
- Pas d'espaces avant ou après le `=`

### Étape 3 : Sauvegarder le fichier

Sauvegardez `.env.local` après la correction.

### Étape 4 : Vérifier

```bash
npx prisma generate
```

Cela devrait fonctionner maintenant !

## 📝 Format correct de `.env.local`

```env
DATABASE_URL="postgresql://neondb_owner:npg_jTkyCD0ng5mw@ep-lively-unit-agr9gjbq-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
FLOWPILOT_JWT_SECRET="votre-secret-jwt-local"
```

## ✅ Après correction

Une fois corrigé, vous pouvez :

1. **Générer le client Prisma** :
   ```bash
   npx prisma generate
   ```

2. **Appliquer les migrations** :
   ```bash
   npx prisma migrate deploy
   ```

3. **Vérifier la connexion** :
   ```bash
   npm run db:check
   ```

