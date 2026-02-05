# 🗄️ Guide complet : Configurer une base de données PostgreSQL pour Vercel

## 📋 Vue d'ensemble

Pour déployer votre application sur Vercel, vous devez configurer une base de données PostgreSQL. SQLite ne fonctionne pas sur Vercel car il nécessite un système de fichiers persistant.

## 🎯 Options recommandées

### Option 1 : Neon (Recommandé) ⭐
- **Gratuit** jusqu'à 512 MB
- **Intégration facile** avec Vercel
- **Serverless** - parfait pour Vercel
- **URL** : https://neon.tech

### Option 2 : Supabase
- **Gratuit** jusqu'à 500 MB
- **PostgreSQL** complet avec API REST
- **URL** : https://supabase.com

### Option 3 : Railway
- **Gratuit** avec crédits mensuels
- **Simple** à configurer
- **URL** : https://railway.app

---

## 🚀 Option 1 : Configuration avec Neon (Recommandé)

### Étape 1 : Créer un compte Neon

1. Allez sur https://neon.tech
2. Cliquez sur **"Sign Up"** (vous pouvez utiliser GitHub)
3. Créez un nouveau projet

### Étape 2 : Créer une base de données

1. Dans le dashboard Neon, cliquez sur **"Create Project"**
2. Choisissez un nom pour votre projet (ex: `flowpilot`)
3. Sélectionnez une région proche de vos utilisateurs
4. Cliquez sur **"Create Project"**

### Étape 3 : Récupérer la DATABASE_URL

1. Dans le dashboard Neon, allez dans votre projet
2. Cliquez sur **"Connection Details"** ou **"Connection String"**
3. Copiez la **Connection String** qui ressemble à :
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Étape 4 : Configurer sur Vercel

1. Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. Ajoutez :
   - **Name** : `DATABASE_URL`
   - **Value** : Collez la connection string de Neon
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
4. Cliquez sur **"Save"**

### Étape 5 : Appliquer les migrations

Depuis votre machine locale :

```bash
# Récupérer les variables d'environnement Vercel (optionnel)
vercel env pull .env.local

# Ou définir directement DATABASE_URL
DATABASE_URL="votre_connection_string_neon" npx prisma migrate deploy
```

Ou laissez le script de build Vercel appliquer les migrations automatiquement lors du prochain déploiement.

---

## 🚀 Option 2 : Configuration avec Supabase

### Étape 1 : Créer un compte Supabase

1. Allez sur https://supabase.com
2. Cliquez sur **"Start your project"**
3. Créez un compte (vous pouvez utiliser GitHub)

### Étape 2 : Créer un projet

1. Cliquez sur **"New Project"**
2. Choisissez une organisation
3. Remplissez les informations :
   - **Name** : `flowpilot`
   - **Database Password** : Créez un mot de passe fort (notez-le !)
   - **Region** : Choisissez une région proche
4. Cliquez sur **"Create new project"**

### Étape 3 : Récupérer la DATABASE_URL

1. Dans le dashboard Supabase, allez dans **Settings** → **Database**
2. Faites défiler jusqu'à **"Connection string"**
3. Sélectionnez **"URI"** dans le menu déroulant
4. Copiez la connection string qui ressemble à :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
5. Remplacez `[YOUR-PASSWORD]` par le mot de passe que vous avez créé

### Étape 4 : Configurer sur Vercel

1. Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. Ajoutez :
   - **Name** : `DATABASE_URL`
   - **Value** : Collez la connection string complète avec le mot de passe
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
4. Cliquez sur **"Save"**

### Étape 5 : Appliquer les migrations

```bash
DATABASE_URL="votre_connection_string_supabase" npx prisma migrate deploy
```

---

## 🚀 Option 3 : Configuration avec Railway

### Étape 1 : Créer un compte Railway

1. Allez sur https://railway.app
2. Cliquez sur **"Start a New Project"**
3. Connectez-vous avec GitHub

### Étape 2 : Créer une base de données PostgreSQL

1. Dans Railway, cliquez sur **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway créera automatiquement une base de données PostgreSQL

### Étape 3 : Récupérer la DATABASE_URL

1. Cliquez sur votre base de données PostgreSQL
2. Allez dans l'onglet **"Variables"**
3. Copiez la valeur de **"DATABASE_URL"** qui ressemble à :
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

### Étape 4 : Configurer sur Vercel

1. Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. Ajoutez :
   - **Name** : `DATABASE_URL`
   - **Value** : Collez la DATABASE_URL de Railway
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
4. Cliquez sur **"Save"**

### Étape 5 : Appliquer les migrations

```bash
DATABASE_URL="votre_connection_string_railway" npx prisma migrate deploy
```

---

## ✅ Vérification de la configuration

### Étape 1 : Tester la connexion

Depuis votre machine locale :

```bash
# Avec Neon
DATABASE_URL="votre_connection_string_neon" npm run db:check

# Avec Supabase
DATABASE_URL="votre_connection_string_supabase" npm run db:check

# Avec Railway
DATABASE_URL="votre_connection_string_railway" npm run db:check
```

### Étape 2 : Appliquer les migrations

```bash
# Remplacer par votre DATABASE_URL
DATABASE_URL="votre_connection_string" npx prisma migrate deploy
```

Cela créera toutes les tables nécessaires dans votre base de données.

### Étape 3 : Vérifier les tables

Vous pouvez vérifier que les tables ont été créées en vous connectant à votre base de données ou en utilisant :

```bash
DATABASE_URL="votre_connection_string" npx prisma studio
```

Cela ouvrira Prisma Studio dans votre navigateur où vous pourrez voir toutes les tables.

---

## 🔐 Variables d'environnement requises sur Vercel

Assurez-vous d'avoir ces variables dans **Vercel → Settings → Environment Variables** :

### Obligatoires

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
FLOWPILOT_JWT_SECRET="votre-secret-jwt-tres-long-et-aleatoire-minimum-32-caracteres"
```

### Optionnelles (pour Outlook)

```env
MICROSOFT_CLIENT_ID="votre_client_id"
MICROSOFT_CLIENT_SECRET="votre_client_secret"
MICROSOFT_TENANT_ID="common"
MICROSOFT_REDIRECT_URI="https://votre-domaine.vercel.app/api/outlook/callback"
MICROSOFT_SCOPES="openid profile offline_access User.Read Calendars.Read email"
```

---

## 🧪 Test après configuration

### 1. Redéployer sur Vercel

Après avoir ajouté `DATABASE_URL` dans Vercel :

1. Allez dans **Vercel Dashboard** → Votre projet → **Deployments**
2. Cliquez sur **"Redeploy"** sur le dernier déploiement
3. Ou poussez un nouveau commit vers votre dépôt

### 2. Vérifier les logs de build

Dans les logs de build Vercel, vous devriez voir :
- ✅ `DATABASE_URL est correctement configurée`
- ✅ `Client Prisma généré avec succès`
- ✅ `Migrations appliquées avec succès` (ou continuation si déjà appliquées)

### 3. Tester la création de compte

1. Allez sur votre application déployée
2. Essayez de créer un compte
3. Si ça fonctionne, la base de données est correctement configurée !

---

## 🐛 Dépannage

### Erreur : "DATABASE_URL n'est pas définie"

**Solution** : Vérifiez que `DATABASE_URL` est bien ajoutée dans Vercel → Settings → Environment Variables et que vous avez sélectionné les bons environnements (Production, Preview, Development).

### Erreur : "Can't reach database server" (P1001)

**Solution** :
1. Vérifiez que votre connection string est correcte
2. Vérifiez que la base de données est active (non suspendue)
3. Pour Supabase : Vérifiez que les IPs de Vercel sont autorisées (généralement automatique)

### Erreur : "Authentication failed" (P1000)

**Solution** :
1. Vérifiez que le mot de passe dans la connection string est correct
2. Pour Supabase : Assurez-vous d'avoir remplacé `[YOUR-PASSWORD]` par votre vrai mot de passe

### Erreur : "Database does not exist" (P1003)

**Solution** :
1. Vérifiez que le nom de la base de données dans la connection string est correct
2. Créez la base de données si elle n'existe pas

### Erreur : "Schema validation error" (P1012)

**Solution** : Les migrations ne sont pas appliquées. Exécutez :
```bash
DATABASE_URL="votre_connection_string" npx prisma migrate deploy
```

---

## 📚 Ressources supplémentaires

- **Neon Documentation** : https://neon.tech/docs
- **Supabase Documentation** : https://supabase.com/docs
- **Railway Documentation** : https://docs.railway.app
- **Prisma Documentation** : https://www.prisma.io/docs

---

## 💡 Astuce

Pour générer un `FLOWPILOT_JWT_SECRET` sécurisé :

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Ou utilisez un générateur en ligne : https://generate-secret.vercel.app/32

