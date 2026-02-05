# 🔧 Correction - Configuration serveur incomplète

## 🎯 Problème

L'erreur "Configuration serveur incomplète. Veuillez contacter le support." apparaît lors de la connexion ou de l'inscription.

## 🔍 Cause

Cette erreur indique qu'une ou plusieurs variables d'environnement critiques sont manquantes sur Vercel :
- `DATABASE_URL` : URL de connexion à la base de données PostgreSQL
- `FLOWPILOT_JWT_SECRET` : Secret pour signer les tokens JWT de session

## ✅ Solution

### 1. Vérifier les variables d'environnement sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que les variables suivantes sont présentes :

#### Variables requises :

- **`DATABASE_URL`** : URL de connexion PostgreSQL (format : `postgresql://user:password@host:port/database?sslmode=require`)
- **`FLOWPILOT_JWT_SECRET`** : Secret aléatoire pour signer les JWT (minimum 32 caractères)

### 2. Ajouter les variables manquantes

#### Pour `DATABASE_URL` :

Si vous utilisez Neon :
1. Allez sur [Neon Console](https://console.neon.tech)
2. Sélectionnez votre projet
3. Allez dans **Connection Details**
4. Copiez la **Connection String**
5. Sur Vercel, ajoutez la variable `DATABASE_URL` avec cette valeur

#### Pour `FLOWPILOT_JWT_SECRET` :

Générez un secret aléatoire :

```bash
# Option 1 : Avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2 : Avec OpenSSL
openssl rand -hex 32

# Option 3 : En ligne
# Visitez https://generate-secret.vercel.app/32
```

Sur Vercel, ajoutez la variable `FLOWPILOT_JWT_SECRET` avec la valeur générée.

### 3. Redéployer l'application

Après avoir ajouté les variables :

1. Sur Vercel, allez dans **Deployments**
2. Cliquez sur **Redeploy** pour le dernier déploiement
3. Ou poussez un nouveau commit pour déclencher un nouveau déploiement

### 4. Vérifier les logs Vercel

Après le redéploiement, vérifiez les logs pour confirmer que les variables sont bien chargées :

1. Sur Vercel, allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Ouvrez les **Build Logs** ou **Function Logs**
4. Recherchez les logs `[auth/login] Variables d'environnement:` ou `[auth/signup] Variables d'environnement:`

Vous devriez voir :
```
hasDatabaseUrl: true
hasJwtSecret: true
```

## 🔍 Diagnostic

### Vérifier localement

Pour tester localement, vérifiez votre fichier `.env.local` :

```bash
# Vérifier que DATABASE_URL existe
cat .env.local | grep DATABASE_URL

# Vérifier que FLOWPILOT_JWT_SECRET existe
cat .env.local | grep FLOWPILOT_JWT_SECRET
```

### Vérifier sur Vercel via l'API

Si vous avez Vercel CLI installé :

```bash
vercel env ls
```

## ⚠️ Important

- **Ne partagez jamais** vos secrets dans le code ou les commits
- Les variables d'environnement doivent être configurées pour **Production**, **Preview**, et **Development** sur Vercel
- Après avoir ajouté des variables, **redéployez** l'application pour qu'elles soient prises en compte

## 📝 Checklist

- [ ] `DATABASE_URL` est configurée sur Vercel
- [ ] `FLOWPILOT_JWT_SECRET` est configurée sur Vercel
- [ ] Les variables sont configurées pour tous les environnements (Production, Preview, Development)
- [ ] L'application a été redéployée après l'ajout des variables
- [ ] Les logs Vercel confirment que les variables sont chargées (`hasDatabaseUrl: true`, `hasJwtSecret: true`)

## 🆘 Si le problème persiste

1. Vérifiez les logs Vercel pour voir le message d'erreur exact
2. Vérifiez que les variables n'ont pas d'espaces ou de caractères invisibles
3. Vérifiez que `DATABASE_URL` est bien au format PostgreSQL (commence par `postgresql://`)
4. Vérifiez que `FLOWPILOT_JWT_SECRET` fait au moins 32 caractères

