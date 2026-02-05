# 🔧 Résolution de l'erreur P1012 : DATABASE_URL locale manquante ou invalide

## Problème
```
Error: P1012
the URL must start with the protocol `postgresql://` or `postgres://`.
```

## 🔍 Cause
Le fichier `.env.local` existe mais `DATABASE_URL` n'est pas définie ou pointe vers SQLite (`file:./prisma/dev.db`).

## ✅ Solution : Vérifier et corriger `.env.local`

### Étape 1 : Vérifier le contenu de `.env.local`

Ouvrez le fichier `.env.local` à la racine du projet et vérifiez qu'il contient :

```env
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**⚠️ IMPORTANT** : 
- L'URL doit commencer par `postgresql://` ou `postgres://`
- Ne pas utiliser `file:./prisma/dev.db` (SQLite)

### Étape 2 : Si DATABASE_URL n'existe pas ou est SQLite

Remplacez ou ajoutez dans `.env.local` :

```env
# Remplacez par votre vraie DATABASE_URL Neon
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Où trouver votre DATABASE_URL Neon :**
1. Allez sur https://console.neon.tech
2. Cliquez sur votre projet
3. Cliquez sur **"Connection Details"**
4. Copiez la **Connection String**
5. Collez-la dans `.env.local`

### Étape 3 : Vérifier le format

L'URL doit ressembler à :
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

Exemple complet :
```
postgresql://neondb_owner:abc123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Étape 4 : Régénérer le client Prisma

Après avoir corrigé `.env.local` :

```bash
npx prisma generate
```

### Étape 5 : Appliquer les migrations

```bash
npx prisma migrate deploy
```

## ✅ Vérification

### Vérifier que DATABASE_URL est bien chargée

```bash
npm run db:check
```

Cela devrait se connecter à votre base Neon et vérifier les tables.

### Ouvrir Prisma Studio

```bash
npx prisma studio
```

Cela ouvrira Prisma Studio dans votre navigateur où vous pourrez voir vos tables.

## 🐛 Dépannage

### Erreur : "DATABASE_URL is not defined"

1. Vérifiez que `.env.local` est bien à la racine du projet
2. Vérifiez qu'il n'y a pas d'espaces avant/après le `=`
3. Redémarrez votre terminal/IDE

### Erreur : "Invalid connection string"

1. Vérifiez que l'URL commence bien par `postgresql://`
2. Vérifiez qu'il n'y a pas de guillemets supplémentaires
3. Vérifiez que les caractères spéciaux dans le mot de passe sont encodés

### Erreur : "Can't reach database server"

1. Vérifiez que votre base Neon est active (non suspendue)
2. Vérifiez que l'URL est correcte
3. Testez la connexion depuis le dashboard Neon

## 📝 Exemple de `.env.local` complet

```env
# Base de données PostgreSQL (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Secret JWT (pour le développement local)
FLOWPILOT_JWT_SECRET="votre-secret-jwt-local-minimum-32-caracteres"
```

## ⚠️ Important

- Le fichier `.env.local` est dans `.gitignore` et ne sera **pas** commité
- Ne partagez **jamais** votre `.env.local` publiquement
- Pour la production, `DATABASE_URL` doit être dans **Vercel → Settings → Environment Variables**

