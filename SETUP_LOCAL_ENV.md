# ⚡ Configuration rapide : DATABASE_URL locale

## Problème
```
Error: P1012
the URL must start with the protocol `postgresql://` or `postgres://`.
```

Cela signifie que `DATABASE_URL` n'est pas définie ou pointe vers SQLite.

## ✅ Solution : Créer `.env.local`

### Étape 1 : Créer le fichier `.env.local`

À la racine du projet (même niveau que `package.json`), créez un fichier `.env.local` :

```env
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Remplacez par votre vraie DATABASE_URL Neon :**
1. Allez sur https://console.neon.tech
2. Cliquez sur votre projet
3. Cliquez sur **"Connection Details"**
4. Copiez la **Connection String**
5. Collez-la dans `.env.local`

### Étape 2 : Vérifier que le fichier existe

Le fichier `.env.local` doit être à la racine du projet :
```
flowpilot/
├── .env.local          ← Ici
├── package.json
├── prisma/
│   └── schema.prisma
└── ...
```

### Étape 3 : Régénérer le client Prisma

```bash
npx prisma generate
```

### Étape 4 : Appliquer les migrations

```bash
npx prisma migrate deploy
```

## ✅ Vérification

Après avoir créé `.env.local` :

```bash
# Vérifier que DATABASE_URL est bien chargée
npm run db:check
```

## 📝 Note importante

Le fichier `.env.local` est dans `.gitignore` et ne sera **pas** commité dans Git. C'est normal et souhaitable pour la sécurité.

Pour la production sur Vercel, `DATABASE_URL` doit être définie dans **Vercel → Settings → Environment Variables**.

## 🐛 Si vous avez encore des problèmes

### Vérifier que le fichier est bien lu

```bash
# Sur Windows PowerShell
Get-Content .env.local

# Sur Linux/Mac
cat .env.local
```

Vous devriez voir votre DATABASE_URL.

### Vérifier le format de DATABASE_URL

L'URL doit commencer par `postgresql://` ou `postgres://` :
- ✅ `postgresql://user:password@host:5432/dbname`
- ❌ `file:./prisma/dev.db` (SQLite)

### Redémarrer le terminal

Parfois, les variables d'environnement ne sont pas rechargées. Fermez et rouvrez votre terminal après avoir créé `.env.local`.

