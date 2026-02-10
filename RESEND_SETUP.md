# 📧 Configuration Resend pour PILOTYS

## Vue d'ensemble

PILOTYS utilise **Resend** pour l'envoi d'emails transactionnels. Resend est déjà installé et configuré dans le projet.

## ✅ Ce qui est déjà en place

### 1. Service d'email centralisé (`lib/email.ts`)

Le service supporte automatiquement Resend si `RESEND_API_KEY` est configuré, avec fallback sur SMTP.

**Fonctions disponibles :**
- `sendPasswordResetEmail()` - Email de réinitialisation de mot de passe
- `sendCompanyInvitationEmail()` - Email d'invitation à rejoindre une entreprise
- `sendPasswordResetConfirmationEmail()` - Confirmation de réinitialisation réussie

### 2. Routes API existantes

- **`POST /api/auth/forgot-password`** - Demande de réinitialisation de mot de passe
- **`POST /api/auth/reset-password`** - Réinitialisation du mot de passe
- **`POST /api/company/invite`** - Invitation d'un utilisateur à rejoindre une entreprise

Toutes ces routes utilisent déjà les fonctions d'email et envoient automatiquement les emails via Resend si configuré.

## 🔧 Configuration

### Variables d'environnement requises

Configurez ces variables dans `.env.local` (local) ou sur Vercel (production) :

```env
# Clé API Resend (obligatoire)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Adresse email "from" (obligatoire)
# Priorité: EMAIL_FROM > RESEND_FROM_EMAIL > SMTP_FROM
EMAIL_FROM=noreply@pilotys.io

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=https://pilotys.io
# ou
APP_URL=https://pilotys.io
```

### Comment obtenir votre clé API Resend

1. Créez un compte sur [resend.com](https://resend.com)
2. Allez dans **API Keys** dans le dashboard
3. Créez une nouvelle clé API
4. Copiez la clé (commence par `re_`)

### Vérifier votre domaine dans Resend

Pour envoyer des emails depuis votre domaine (ex: `noreply@pilotys.io`) :

1. Allez dans **Domains** dans le dashboard Resend
2. Ajoutez votre domaine (ex: `pilotys.io`)
3. Suivez les instructions pour vérifier le domaine (ajout de records DNS)
4. Une fois vérifié, vous pouvez utiliser `EMAIL_FROM=noreply@pilotys.io`

**Note :** En développement, vous pouvez utiliser le domaine de test de Resend (`onboarding@resend.dev`) sans vérification.

## 🧪 Tester la configuration

### Test 1 : Vérifier la configuration

```bash
npm run test:resend
```

Cela affichera :
- ✅ Si `RESEND_API_KEY` est configuré
- ✅ L'adresse email "from" qui sera utilisée
- ✅ Les autres variables d'environnement

### Test 2 : Envoyer un email de test

```bash
npm run test:resend votre-email@example.com
```

Cela enverra un email de réinitialisation de mot de passe à l'adresse spécifiée.

### Test 3 : Tester depuis l'application

1. **Réinitialisation de mot de passe :**
   - Allez sur `/forgot-password`
   - Entrez votre email
   - Vérifiez votre boîte de réception

2. **Invitation entreprise :**
   - Connectez-vous en tant qu'admin d'entreprise
   - Allez dans les paramètres de l'entreprise
   - Invitez un utilisateur par email
   - Vérifiez que l'email est reçu

## 📋 Emails disponibles

### 1. Réinitialisation de mot de passe

**Déclencheur :** Utilisateur demande une réinitialisation sur `/forgot-password`

**Route API :** `POST /api/auth/forgot-password`

**Fonction :** `sendPasswordResetEmail(email, token, locale)`

**Contenu :**
- Lien de réinitialisation valide 1 heure
- Template HTML avec branding PILOTYS
- Support FR/EN

### 2. Invitation entreprise

**Déclencheur :** Admin d'entreprise invite un utilisateur

**Route API :** `POST /api/company/invite`

**Fonction :** `sendCompanyInvitationEmail(email, companyName, inviterEmail, token, locale)`

**Contenu :**
- Lien d'invitation valide 7 jours
- Nom de l'entreprise et de l'inviteur
- Template HTML avec branding PILOTYS
- Support FR/EN

### 3. Confirmation de réinitialisation

**Déclencheur :** Utilisateur réinitialise son mot de passe avec succès

**Route API :** `POST /api/auth/reset-password`

**Fonction :** `sendPasswordResetConfirmationEmail(email, locale)`

**Contenu :**
- Confirmation de la réinitialisation
- Avertissement de sécurité si action non autorisée
- Template HTML avec branding PILOTYS

## 🔍 Dépannage

### Erreur : "RESEND_API_KEY n'est pas configuré"

**Solution :**
1. Vérifiez que `RESEND_API_KEY` est dans `.env.local` (local) ou sur Vercel (production)
2. Redémarrez le serveur de développement (`npm run dev`)
3. Redéployez sur Vercel si en production

### Erreur : "Domain not verified"

**Solution :**
1. Vérifiez que votre domaine est vérifié dans Resend Dashboard > Domains
2. Utilisez `EMAIL_FROM` avec un domaine vérifié (ex: `noreply@pilotys.io`)
3. En développement, utilisez `onboarding@resend.dev` (domaine de test)

### Les emails ne sont pas reçus

**Vérifications :**
1. Vérifiez les logs Vercel pour voir les erreurs d'envoi
2. Vérifiez votre dossier spam
3. Testez avec `npm run test:resend votre-email@example.com`
4. Vérifiez que `RESEND_API_KEY` est correcte dans Resend Dashboard

### Fallback sur SMTP

Si `RESEND_API_KEY` n'est pas configuré, le système utilisera SMTP automatiquement. Configurez alors :
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

## 📚 Architecture

```
lib/email.ts
├── sendEmail() - Fonction générique (utilise Resend ou SMTP)
├── sendPasswordResetEmail() - Email de reset
├── sendCompanyInvitationEmail() - Email d'invitation
└── sendPasswordResetConfirmationEmail() - Confirmation

app/api/auth/forgot-password/route.ts
└── Utilise sendPasswordResetEmail()

app/api/auth/reset-password/route.ts
└── Utilise sendPasswordResetConfirmationEmail()

app/api/company/invite/route.ts
└── Utilise sendCompanyInvitationEmail()
```

## 🚀 Déploiement sur Vercel

1. **Ajoutez les variables d'environnement :**
   - Vercel Dashboard → Votre projet → Settings → Environment Variables
   - Ajoutez `RESEND_API_KEY` (Production, Preview, Development)
   - Ajoutez `EMAIL_FROM` (Production, Preview, Development)
   - Ajoutez `NEXT_PUBLIC_APP_URL` (Production uniquement)

2. **Redéployez :**
   - Les changements sont automatiquement appliqués au prochain déploiement

3. **Vérifiez les logs :**
   - Vercel Dashboard → Deployments → Cliquez sur le déploiement → Logs
   - Cherchez les logs `[email]` pour voir les envois

## 📝 Notes importantes

- ✅ Resend est déjà installé (`resend: ^6.9.1`)
- ✅ Le service d'email est déjà implémenté et fonctionnel
- ✅ Les routes API utilisent déjà les fonctions d'email
- ✅ Support automatique Resend/SMTP selon la configuration
- ✅ Templates HTML avec branding PILOTYS
- ✅ Support multilingue (FR/EN)
- ✅ Gestion d'erreurs robuste

**Tout est prêt ! Il suffit de configurer les variables d'environnement.**

