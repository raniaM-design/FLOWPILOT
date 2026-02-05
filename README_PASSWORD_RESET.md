# Fonctionnalité de Réinitialisation de Mot de Passe

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de réinitialiser leur mot de passe de manière sécurisée via un lien envoyé par email.

## Architecture

### Modèle de données

Le modèle `PasswordResetToken` stocke les tokens de réinitialisation :
- `id` : Identifiant unique
- `userId` : Référence à l'utilisateur
- `tokenHash` : Hash du token (jamais stocké en clair)
- `expiresAt` : Date d'expiration (1 heure)
- `createdAt` : Date de création
- `usedAt` : Date d'utilisation (null si non utilisé)

### Sécurité

1. **Token hashé** : Les tokens sont hashés avec bcrypt avant stockage en base
2. **Expiration** : Les tokens expirent après 1 heure
3. **Usage unique** : Les tokens sont marqués comme utilisés après réinitialisation
4. **Protection contre l'énumération** : Message générique même si l'email n'existe pas
5. **Timing attack protection** : Délai artificiel pour éviter les attaques par timing

### Pages

- `/forgot-password` : Page de demande de réinitialisation
- `/reset-password?token=XXX` : Page de réinitialisation avec token

### Routes API

- `POST /api/auth/forgot-password` : Génère et envoie le token
- `POST /api/auth/reset-password` : Réinitialise le mot de passe

## Configuration

### Variables d'environnement requises

Le système supporte **deux méthodes** d'envoi d'emails : **Resend** (recommandé) ou **SMTP**. Resend est utilisé en priorité si configuré.

#### Option 1 : Resend (Recommandé) ⭐

Pour utiliser Resend, configurez ces variables dans `.env.local` ou Vercel :

```env
# Configuration Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@votre-domaine.com

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
# ou
APP_URL=https://votre-domaine.com
```

**Comment obtenir votre clé API Resend :**
1. Créez un compte sur [resend.com](https://resend.com)
2. Allez dans **API Keys**
3. Créez une nouvelle clé API
4. Copiez la clé (commence par `re_`)
5. Ajoutez-la dans vos variables d'environnement

**Important pour Resend :**
- Vous devez vérifier votre domaine dans Resend avant d'envoyer des emails
- L'adresse `RESEND_FROM_EMAIL` doit être un domaine vérifié dans Resend
- Pour les tests, vous pouvez utiliser `onboarding@resend.dev` (domaine par défaut de Resend)

#### Option 2 : SMTP (Fallback)

Si `RESEND_API_KEY` n'est pas configuré, le système utilise SMTP :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@pilotys.com

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
# ou
APP_URL=https://votre-domaine.com
```

### Configuration Gmail

Si vous utilisez Gmail :

1. Activez l'authentification à deux facteurs
2. Générez un "Mot de passe d'application" :
   - Allez dans votre compte Google
   - Sécurité > Authentification à deux facteurs > Mots de passe des applications
   - Créez un mot de passe pour "Mail"
3. Utilisez ce mot de passe dans `SMTP_PASSWORD`

### Autres services SMTP

- **SendGrid** : `smtp.sendgrid.net`, port 587
- **Mailgun** : `smtp.mailgun.org`, port 587
- **AWS SES** : Configuration spécifique selon la région
- **Mailtrap** (développement) : Configuration de test

## Migration de base de données

Pour appliquer le modèle `PasswordResetToken` :

```bash
# Créer et appliquer la migration
npx prisma migrate dev --name add_password_reset_token

# Ou en production
npx prisma migrate deploy
```

## Installation des dépendances

```bash
# Pour Resend (recommandé)
npm install resend

# Pour SMTP (fallback)
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Note :** Les deux packages sont nécessaires car le système utilise Resend en priorité et SMTP en fallback.

## Utilisation

### Pour l'utilisateur

1. Aller sur `/forgot-password`
2. Entrer son email
3. Recevoir un email avec un lien de réinitialisation
4. Cliquer sur le lien (valide 1 heure)
5. Entrer un nouveau mot de passe
6. Se connecter avec le nouveau mot de passe

### Pour le développeur

#### Nettoyage des tokens expirés

Vous pouvez créer un job cron pour nettoyer les tokens expirés :

```typescript
import { cleanupExpiredTokens } from "@/lib/flowpilot-auth/password-reset";

// À exécuter périodiquement (ex: une fois par jour)
await cleanupExpiredTokens();
```

#### Test en développement

En développement, si `SMTP_USER` et `SMTP_PASSWORD` ne sont pas configurés, le système utilise un transport de test Ethereal. Les emails ne seront pas réellement envoyés mais vous pourrez voir les logs dans la console.

## Dépannage

### Les emails ne sont pas envoyés

#### Si vous utilisez Resend :

1. **Vérifiez que `RESEND_API_KEY` est bien configuré** :
   - Dans `.env.local` pour le développement
   - Dans Vercel → Settings → Environment Variables pour la production
   - La clé doit commencer par `re_`

2. **Vérifiez que `RESEND_FROM_EMAIL` est configuré** :
   - Doit être un domaine vérifié dans Resend
   - Pour les tests, utilisez `onboarding@resend.dev`

3. **Vérifiez les logs de la console** :
   - Cherchez `[email] ✅ Resend détecté` pour confirmer que Resend est utilisé
   - Cherchez `[email] ❌ Erreur lors de l'envoi via Resend` pour voir les erreurs

4. **Vérifiez votre domaine dans Resend** :
   - Allez sur [resend.com](https://resend.com) → Domains
   - Assurez-vous que votre domaine est vérifié
   - Si non vérifié, utilisez `onboarding@resend.dev` pour les tests

5. **Redéployez sur Vercel** après avoir ajouté les variables :
   - Les variables d'environnement nécessitent un redéploiement pour être prises en compte

#### Si vous utilisez SMTP :

1. Vérifiez les variables d'environnement SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`)
2. Vérifiez les logs de la console pour les erreurs
3. Testez la connexion SMTP avec un script de test (`npm run test:email`)

### Le token est invalide

1. Vérifiez que le token n'a pas expiré (1 heure)
2. Vérifiez que le token n'a pas déjà été utilisé
3. Vérifiez que l'URL contient bien le paramètre `token`

### Erreur de migration

Si vous avez des erreurs lors de la migration :

```bash
# Régénérer le client Prisma
npx prisma generate

# Vérifier l'état de la base de données
npx prisma migrate status
```

## Sécurité

- ✅ Tokens hashés avec bcrypt
- ✅ Expiration automatique (1 heure)
- ✅ Usage unique
- ✅ Protection contre l'énumération d'emails
- ✅ Protection contre les attaques par timing
- ✅ Validation du format d'email
- ✅ Validation de la force du mot de passe (minimum 8 caractères)

## Améliorations futures possibles

- [ ] Rate limiting sur les demandes de réinitialisation
- [ ] Expiration configurable
- [ ] Notifications de sécurité (email lors de changement de mot de passe)
- [ ] Support de plusieurs langues dans les emails
- [ ] Templates d'emails personnalisables

