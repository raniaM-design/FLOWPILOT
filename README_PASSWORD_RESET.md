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

Pour l'envoi d'emails, configurez ces variables dans `.env.local` ou Vercel :

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
npm install nodemailer
npm install --save-dev @types/nodemailer
```

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

1. Vérifiez les variables d'environnement SMTP
2. Vérifiez les logs de la console pour les erreurs
3. Testez la connexion SMTP avec un script de test

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

