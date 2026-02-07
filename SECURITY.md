# 🔒 Mesures de Sécurité Implémentées

Ce document décrit toutes les mesures de sécurité mises en place pour protéger l'application FlowPilot contre les attaques courantes.

## 🛡️ Protections Actives

### 1. Rate Limiting (Limitation de débit)

**Protection contre** : Attaques par force brute, DDoS, spam

**Implémentation** :
- **Login/Signup** : 5 tentatives par 15 minutes
- **Routes sensibles** (password reset) : 3 tentatives par heure
- **Routes API** : 100 requêtes par minute
- Identification par IP + User-Agent

**Fichiers** :
- `lib/security/rate-limiter.ts`

### 2. Headers de Sécurité

**Protection contre** : XSS, clickjacking, MIME sniffing, etc.

**Headers implémentés** :
- `X-Content-Type-Options: nosniff` - Empêche le MIME sniffing
- `X-Frame-Options: DENY` - Empêche le clickjacking
- `X-XSS-Protection: 1; mode=block` - Protection XSS du navigateur
- `Content-Security-Policy` - Politique de sécurité du contenu
- `Strict-Transport-Security` - Force HTTPS en production
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Limite les permissions du navigateur

**Fichiers** :
- `lib/security/security-headers.ts`

### 3. Protection CSRF

**Protection contre** : Cross-Site Request Forgery

**Implémentation** :
- Token CSRF dans cookie httpOnly
- Vérification du token dans les headers
- Comparaison en temps constant (protection contre les attaques par timing)
- Protection sur toutes les requêtes POST/PUT/DELETE

**Fichiers** :
- `lib/security/csrf.ts`

### 4. Validation et Sanitization des Entrées

**Protection contre** : Injection SQL, XSS, injection de code

**Implémentation** :
- Validation des emails, mots de passe, IDs, URLs
- Sanitization des chaînes de caractères
- Échappement HTML
- Limitation de la longueur des paramètres

**Fichiers** :
- `lib/security/input-validation.ts`

### 5. Détection de Requêtes Suspectes

**Protection contre** : Bots malveillants, scanners de vulnérabilités

**Détection** :
- User-agents suspects (crawlers, scrapers)
- Tentatives d'injection SQL dans les URLs
- Tentatives XSS dans les paramètres
- Logging automatique des événements suspects

**Fichiers** :
- `lib/security/security-headers.ts`

### 6. Authentification et Autorisation

**Protection contre** : Accès non autorisé

**Implémentation** :
- JWT avec signature cryptographique
- Cookies httpOnly et secure
- Vérification de session sur toutes les routes protégées
- Middleware de protection des routes `/app` et `/api`

**Fichiers** :
- `lib/flowpilot-auth/jwt.ts`
- `lib/flowpilot-auth/session.ts`
- `middleware.ts`

### 7. Logging de Sécurité

**Protection contre** : Attaques non détectées

**Implémentation** :
- Logging de toutes les tentatives suspectes
- Logging des échecs d'authentification
- Logging des violations de rate limiting
- Logging des échecs CSRF

**Fichiers** :
- `lib/security/security-headers.ts`

## 📋 Routes Protégées

### Routes Publiques
- `/login`
- `/signup`
- `/auth/*` (sauf certaines routes protégées)

### Routes Protégées (Authentification requise)
- `/app/*` - Toutes les routes de l'application
- `/api/*` - Toutes les routes API (sauf routes publiques)

### Routes avec Rate Limiting Renforcé
- `/auth/login` - 5 tentatives / 15 min
- `/auth/signup` - 5 tentatives / 15 min
- `/password-reset` - 3 tentatives / heure
- `/api/*` - 100 requêtes / minute

## 🔐 Bonnes Pratiques de Sécurité

### Pour les Développeurs

1. **Toujours valider les entrées utilisateur**
   ```typescript
   import { sanitizeString, isValidEmail } from "@/lib/security/input-validation";
   
   const email = sanitizeString(formData.get("email"));
   if (!isValidEmail(email)) {
     return error("Email invalide");
   }
   ```

2. **Utiliser Prisma pour les requêtes SQL**
   - Prisma protège automatiquement contre les injections SQL
   - Ne jamais construire des requêtes SQL manuellement

3. **Vérifier les permissions**
   - Toujours vérifier que l'utilisateur a le droit d'accéder à une ressource
   - Utiliser `getCurrentUserId()` pour obtenir l'utilisateur actuel

4. **Ne jamais exposer de secrets**
   - Ne pas logger les tokens, mots de passe, ou données sensibles
   - Utiliser des variables d'environnement pour les secrets

### Variables d'Environnement Requises

```env
# JWT Secret (minimum 32 caractères aléatoires)
FLOWPILOT_JWT_SECRET=...

# Database URL (avec credentials sécurisés)
DATABASE_URL=...

# Stripe (pour les paiements)
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...

# Microsoft OAuth (pour Outlook)
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

## 🚨 Réponse aux Incidents

### En cas d'attaque détectée

1. **Vérifier les logs**
   - Les tentatives suspectes sont loggées automatiquement
   - Vérifier les logs Vercel pour les détails

2. **Bloquer l'IP**
   - Ajouter l'IP à une liste de blocage (à implémenter si nécessaire)

3. **Alerter l'équipe**
   - Notifier les administrateurs en cas d'attaque sérieuse

4. **Réviser les mesures**
   - Analyser l'attaque et améliorer les protections si nécessaire

## 📊 Monitoring

### Métriques à Surveiller

- Nombre de tentatives de login échouées
- Nombre de requêtes bloquées par rate limiting
- Nombre de requêtes suspectes détectées
- Nombre d'échecs CSRF

### Outils Recommandés

- **Vercel Analytics** - Pour surveiller les performances et les erreurs
- **Sentry** - Pour le monitoring d'erreurs (à intégrer)
- **LogRocket** - Pour le monitoring utilisateur (optionnel)

## 🔄 Améliorations Futures

- [ ] Intégration avec Redis pour le rate limiting distribué
- [ ] Intégration avec Sentry pour le monitoring d'erreurs
- [ ] Système de blacklist d'IPs
- [ ] 2FA (Authentification à deux facteurs)
- [ ] Audit de sécurité régulier
- [ ] Tests de pénétration

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/security)

