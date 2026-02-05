# 🔍 Diagnostic complet - Base de données ne fonctionne pas sur Vercel

## 🎯 Problème
"La base de données n'est pas configurée" persiste malgré les corrections.

## ✅ Solution en 4 étapes

### Étape 1 : Diagnostic depuis votre machine locale

Testez avec la même configuration que Vercel :

```bash
# 1. Récupérer les variables d'environnement Vercel
vercel env pull .env.local

# 2. Tester la connexion avec la config Vercel
npm run db:test-vercel
```

Ce script va :
- ✅ Vérifier que DATABASE_URL est définie
- ✅ Vérifier qu'elle ne contient pas de placeholders
- ✅ Tester la connexion à la base de données
- ✅ Vérifier que les tables existent
- ✅ Identifier l'erreur exacte (P1000, P1001, P1003, P1012, etc.)

### Étape 2 : Diagnostic depuis Vercel directement

J'ai créé un endpoint de diagnostic accessible depuis Vercel :

**URL** : `https://votre-app.vercel.app/api/diagnose-db`

Cet endpoint va retourner un JSON avec :
- ✅ État de DATABASE_URL
- ✅ Test de connexion
- ✅ Vérification des tables
- ✅ Erreurs détaillées

**Comment l'utiliser** :
1. Allez sur `https://votre-app.vercel.app/api/diagnose-db`
2. Regardez le JSON retourné
3. Identifiez quel check a échoué

### Étape 3 : Vérifier les logs Vercel

1. **Vercel Dashboard** → Votre projet → **Deployments** → Dernier déploiement
2. **Functions** → Cherchez les logs `[auth/signup]`
3. Regardez les détails de l'erreur :
   - Code d'erreur (P1000, P1001, P1003, P1012)
   - Message d'erreur complet
   - `hasDatabaseUrl`, `isPostgres`, `isSqlite`

### Étape 4 : Appliquer les migrations

Si les tables n'existent pas (erreur P1012 ou P1003) :

```bash
# Avec les variables Vercel
vercel env pull .env.local
npm run db:deploy
```

Ou directement avec votre DATABASE_URL :

```bash
DATABASE_URL="votre_vraie_url_neon" npx prisma migrate deploy
```

## 🔍 Erreurs courantes et solutions

### Erreur P1000 : Authentication failed
**Cause** : Mot de passe incorrect dans DATABASE_URL

**Solution** :
1. Allez sur https://console.neon.tech
2. Régénérez le mot de passe
3. Copiez la nouvelle Connection String
4. Mettez à jour DATABASE_URL sur Vercel (Settings → Environment Variables)
5. Redéployez

### Erreur P1001 : Can't reach database server
**Cause** : DATABASE_URL contient des placeholders ou est incorrecte

**Solution** :
1. Vérifiez que DATABASE_URL ne contient **pas** de `xxx`, `user:password`, `dbname`
2. Vérifiez que c'est votre **vraie** Connection String Neon
3. Testez avec `npm run db:test-vercel`

### Erreur P1003 : Database does not exist
**Cause** : Le nom de la base de données dans DATABASE_URL est incorrect

**Solution** :
1. Vérifiez sur Neon Dashboard le nom exact de votre base de données
2. Pour Neon, c'est généralement `neondb`
3. Mettez à jour DATABASE_URL si nécessaire

### Erreur P1012 : Schema validation / Column does not exist
**Cause** : Les migrations ne sont pas appliquées

**Solution** :
```bash
vercel env pull .env.local
npm run db:deploy
```

Puis redéployez sur Vercel.

## 📋 Checklist complète

- [ ] `vercel env pull .env.local` exécuté
- [ ] `npm run db:test-vercel` passe tous les tests
- [ ] DATABASE_URL sur Vercel ne contient **pas** de placeholders
- [ ] DATABASE_URL sur Vercel est la **vraie** Connection String Neon
- [ ] Les migrations sont appliquées (`npm run db:deploy`)
- [ ] Les tables existent (vérifié avec `npm run db:test-vercel`)
- [ ] Endpoint `/api/diagnose-db` retourne `status: "healthy"`
- [ ] Application redéployée sur Vercel

## 🆘 Si rien ne fonctionne

1. **Créez un nouveau projet Neon** :
   - https://neon.tech → Create Project
   - Copiez la nouvelle Connection String
   - Mettez à jour DATABASE_URL sur Vercel
   - Appliquez les migrations : `npm run db:deploy`

2. **Vérifiez les logs détaillés** :
   - Vercel Dashboard → Deployments → Functions → Runtime Logs
   - Cherchez `[auth/signup]` pour voir l'erreur exacte

3. **Testez l'endpoint de diagnostic** :
   - `https://votre-app.vercel.app/api/diagnose-db`
   - Regardez quel check échoue

4. **Contactez-moi avec** :
   - Le résultat de `npm run db:test-vercel`
   - Le JSON de `/api/diagnose-db`
   - Les logs Vercel contenant `[auth/signup]`

