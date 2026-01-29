# 🔧 Guide de résolution des problèmes de connexion à la base de données

## Problème identifié

L'erreur "Impossible de se connecter à la base de données" peut avoir plusieurs causes :

1. **DATABASE_URL non configurée** ou mal formatée
2. **Base de données PostgreSQL inaccessible** (serveur arrêté, firewall, etc.)
3. **Identifiants incorrects** (nom d'utilisateur, mot de passe)
4. **Base de données n'existe pas** ou migrations non appliquées
5. **Problème de réseau** (timeout, connexion lente)

## ✅ Solutions

### 1. Vérifier DATABASE_URL

#### En local (`.env.local`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name?schema=public"
```

#### Sur Vercel

1. Allez dans **Settings > Environment Variables**
2. Vérifiez que `DATABASE_URL` est définie
3. Format attendu : `postgresql://user:password@host:5432/database?schema=public`

### 2. Tester la connexion

Utilisez le script de diagnostic :

```bash
npx tsx scripts/test-db-connection.ts
```

Ce script va :
- ✅ Vérifier que DATABASE_URL est définie
- ✅ Tester la connexion à la base de données
- ✅ Exécuter des requêtes de test
- ✅ Afficher des messages d'erreur détaillés

### 3. Vérifier que PostgreSQL est accessible

#### En local

```bash
# Vérifier que PostgreSQL est démarré
# Windows
Get-Service -Name postgresql*

# Linux/Mac
sudo systemctl status postgresql
```

#### Sur Vercel (base de données distante)

- Vérifiez que votre fournisseur de base de données (Neon, Supabase, Railway, etc.) est actif
- Vérifiez que l'URL de connexion est correcte
- Vérifiez que les IPs autorisées incluent les IPs de Vercel

### 4. Appliquer les migrations Prisma

```bash
# En local
npx prisma migrate dev

# Sur Vercel (après déploiement)
npx prisma migrate deploy
```

### 5. Vérifier les paramètres de connexion

Si vous utilisez une base de données distante (Neon, Supabase, etc.), vous devrez peut-être ajouter des paramètres de connexion à votre DATABASE_URL :

```env
# Exemple avec pool de connexions et timeout
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&connection_limit=10&pool_timeout=20"
```

### 6. Codes d'erreur Prisma courants

| Code | Signification | Solution |
|------|---------------|----------|
| P1000 | Erreur d'authentification | Vérifiez le nom d'utilisateur et le mot de passe |
| P1001 | Base de données inaccessible | Vérifiez que le serveur est démarré et accessible |
| P1002 | Timeout de connexion | Augmentez le timeout ou vérifiez votre connexion réseau |
| P1003 | Base de données introuvable | Vérifiez que la base de données existe |
| P2002 | Contrainte unique violée | L'email est déjà utilisé (normal pour signup) |

## 🔍 Diagnostic détaillé

### Vérifier les logs

Les logs détaillés sont maintenant affichés dans la console. En développement, vous verrez :

```
[auth/login] Détails de l'erreur: {
  message: "...",
  code: "P1001",
  hasJwtSecret: true,
  hasDatabaseUrl: true
}
```

### Tester manuellement la connexion

```bash
# Avec psql (si installé)
psql "postgresql://user:password@host:5432/database"

# Ou avec Node.js
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('OK')).catch(e => console.error('ERROR:', e.message));"
```

## 📝 Checklist de vérification

- [ ] DATABASE_URL est définie dans `.env.local` (local) ou dans Vercel (production)
- [ ] Le format de DATABASE_URL est correct : `postgresql://user:password@host:port/database?schema=public`
- [ ] PostgreSQL est démarré et accessible (local)
- [ ] La base de données distante est active (Vercel)
- [ ] Les migrations Prisma ont été appliquées (`npx prisma migrate deploy`)
- [ ] Le script de test (`npx tsx scripts/test-db-connection.ts`) passe avec succès
- [ ] Les logs d'erreur affichent des détails utiles

## 🆘 Si le problème persiste

1. **Vérifiez les logs détaillés** dans la console du serveur
2. **Exécutez le script de diagnostic** : `npx tsx scripts/test-db-connection.ts`
3. **Vérifiez les variables d'environnement** dans Vercel
4. **Contactez le support** de votre fournisseur de base de données si nécessaire

