# Configuration Google OAuth

Ce document explique comment configurer l'authentification Google OAuth pour FlowPilot.

## 📋 Prérequis

1. Un compte Google Cloud Platform
2. Un projet Google Cloud Platform

## 🔧 Configuration Google Cloud Platform

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant

### 2. Activer l'API Google+ (OAuth 2.0)

1. Dans le menu, allez dans **APIs & Services** > **Library**
2. Recherchez "Google+ API" ou "Google Identity"
3. Cliquez sur **Enable**

### 3. Créer des identifiants OAuth 2.0

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Si c'est la première fois, configurez l'écran de consentement OAuth :
   - Choisissez **External** (pour les tests) ou **Internal** (pour G Suite)
   - Remplissez les informations requises
   - Ajoutez votre email comme test user si nécessaire
4. Créez l'OAuth client ID :
   - **Application type** : Web application
   - **Name** : FlowPilot (ou votre nom)
   - **Authorized JavaScript origins** :
     - `http://localhost:3000` (pour le développement local)
     - `https://votre-domaine.vercel.app` (pour la production)
   - **Authorized redirect URIs** :
     - `http://localhost:3000/api/auth/google/callback` (pour le développement local)
     - `https://votre-domaine.vercel.app/api/auth/google/callback` (pour la production)
5. Cliquez sur **Create**
6. Copiez le **Client ID** et le **Client Secret**

## 🔐 Configuration des variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env.local` (local) et dans Vercel (production) :

```env
GOOGLE_CLIENT_ID=votre_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_google
```

### Pour Vercel :

1. Allez dans votre projet Vercel
2. **Settings** > **Environment Variables**
3. Ajoutez `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
4. Sélectionnez les environnements (Production, Preview, Development)
5. Cliquez sur **Save**

## 🗄️ Migration de la base de données

Avant d'utiliser Google OAuth, vous devez ajouter les champs OAuth à la table User :

```bash
npm run db:add-oauth-fields
```

Ce script va :
- Rendre `passwordHash` optionnel (pour les utilisateurs OAuth)
- Ajouter `authProvider` (google, password, etc.)
- Ajouter `providerId` (ID unique du provider)
- Créer les index et contraintes nécessaires

## ✅ Vérification

1. Redémarrez votre serveur de développement : `npm run dev`
2. Allez sur `/login` ou `/signup`
3. Vous devriez voir un bouton "Continuer avec Google"
4. Cliquez dessus et testez la connexion

## 🔍 Dépannage

### Erreur "Configuration OAuth Google manquante"
- Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis dans `.env.local` (local) ou dans Vercel (production)

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL de callback dans Google Cloud Console correspond exactement à votre URL de production
- Pour le développement local : `http://localhost:3000/api/auth/google/callback`
- Pour la production : `https://votre-domaine.vercel.app/api/auth/google/callback`

### Erreur "invalid_client"
- Vérifiez que le Client ID et Client Secret sont corrects
- Assurez-vous qu'ils correspondent au bon projet Google Cloud

### Les utilisateurs OAuth ne peuvent pas se connecter avec mot de passe
- C'est normal ! Les utilisateurs qui se connectent avec Google n'ont pas de mot de passe
- Ils doivent utiliser le bouton "Continuer avec Google" pour se connecter

## 📝 Notes

- Les utilisateurs peuvent avoir plusieurs méthodes d'authentification :
  - Email/Mot de passe (`authProvider: "password"`)
  - Google OAuth (`authProvider: "google"`)
- Si un utilisateur existe déjà avec un email et se connecte avec Google, les comptes seront liés automatiquement
- Les utilisateurs OAuth n'ont pas besoin de mot de passe (`passwordHash` est `null`)

