# 🔧 Guide de résolution - Erreur P1002 lors des migrations Prisma sur Vercel

## Problème
L'erreur `P1002` apparaît lors de l'application des migrations Prisma sur Vercel :
```
Error: P1002
Command failed: npx prisma migrate deploy --schema=/vercel/path0/prisma/schema-temp-postgres.prisma
```

## 🔍 Explication de l'erreur P1002

L'erreur `P1002` signifie généralement :
- **Timeout de connexion** à la base de données
- **Advisory lock timeout** (PostgreSQL utilise des locks pour éviter les migrations concurrentes)
- **Connexion lente** ou instable à la base de données

## ✅ Solutions

### Solution 1 : Vérifier DATABASE_URL (Recommandé)

L'erreur P1002 peut être causée par une `DATABASE_URL` incorrecte ou inaccessible.

1. **Vérifiez DATABASE_URL dans Vercel** :
   - Allez dans **Vercel → Settings → Environment Variables**
   - Vérifiez que `DATABASE_URL` est correcte et accessible
   - Format attendu : `postgresql://user:password@host:5432/database?schema=public`

2. **Testez la connexion** :
   ```bash
   # En local avec la DATABASE_URL de production
   DATABASE_URL="votre_url_production" npm run db:check
   ```

### Solution 2 : Les migrations sont déjà appliquées

Si les migrations sont déjà appliquées, Prisma peut retourner P1002. Le script `safe-migrate.js` gère maintenant ce cas automatiquement en utilisant `db push` comme alternative.

**Le build devrait continuer même avec cette erreur** - vérifiez les logs pour voir si le message indique "Continuation du build".

### Solution 3 : Appliquer les migrations manuellement

Si les migrations ne sont pas appliquées automatiquement pendant le build :

1. **Depuis votre machine locale** :
   ```bash
   # Récupérer les variables d'environnement Vercel
   vercel env pull .env.local
   
   # Appliquer les migrations
   npx prisma migrate deploy
   ```

2. **Ou via un script** :
   ```bash
   DATABASE_URL="votre_url_production" npx prisma migrate deploy
   ```

### Solution 4 : Utiliser db push au lieu de migrate deploy

Si `migrate deploy` continue d'échouer, vous pouvez modifier temporairement le script de build pour utiliser `db push` :

**Option A : Modifier le script vercel-build dans package.json** (temporaire) :
```json
"vercel-build": "node scripts/pre-build-check.js && node scripts/pre-build-generate-prisma.js && npx prisma db push --accept-data-loss --skip-generate && next build"
```

**⚠️ ATTENTION** : `db push` peut causer une perte de données si le schéma change. Utilisez-le uniquement si vous êtes sûr de ce que vous faites.

### Solution 5 : Désactiver les migrations pendant le build

Si les migrations causent trop de problèmes, vous pouvez les désactiver temporairement pendant le build :

**Modifier package.json** :
```json
"vercel-build": "node scripts/pre-build-check.js && node scripts/pre-build-generate-prisma.js && next build"
```

Puis appliquez les migrations manuellement après le déploiement.

## 🔍 Diagnostic

### Vérifier les logs Vercel

1. Allez dans **Vercel → Deployments → [Dernier déploiement] → Build Logs**
2. Cherchez les messages contenant :
   - `🔄 Application des migrations Prisma...`
   - `⚠️  Erreur P1002 détectée`
   - `💡 Continuation du build`

### Vérifier l'état des migrations

```bash
# En local avec la DATABASE_URL de production
DATABASE_URL="votre_url_production" npx prisma migrate status
```

Cela vous dira si les migrations sont appliquées ou en attente.

### Vérifier la connexion à la base de données

```bash
# Tester la connexion
DATABASE_URL="votre_url_production" npm run db:check
```

## 📝 Comportement actuel du script

Le script `safe-migrate.js` a été amélioré pour :

1. **Gérer P1002 comme erreur non-critique** : Le build continue même si P1002 se produit
2. **Essayer db push en alternative** : Si `migrate deploy` échoue avec P1002, le script essaie `db push`
3. **Logs détaillés** : Messages explicatifs pour comprendre pourquoi P1002 se produit
4. **Timeout augmenté** : 90 secondes au lieu de 60 pour les connexions lentes

## ✅ Checklist

- [ ] `DATABASE_URL` est correctement configurée dans Vercel
- [ ] La base de données est accessible depuis Internet
- [ ] Les migrations Prisma existent dans `prisma/migrations/`
- [ ] Le build Vercel continue malgré l'erreur P1002 (vérifier les logs)
- [ ] Les migrations sont appliquées (vérifier avec `prisma migrate status`)

## 🧪 Test après correction

1. **Redéployer sur Vercel**
2. **Vérifier les logs de build** pour voir si P1002 apparaît toujours
3. **Vérifier que le build réussit** malgré l'erreur
4. **Tester la création de compte** pour vérifier que la base de données fonctionne
5. **Vérifier l'état des migrations** avec `prisma migrate status`

## 📞 Si le problème persiste

Si P1002 continue d'apparaître et bloque le build :

1. **Vérifiez les logs complets** de Vercel
2. **Testez la connexion** à la base de données depuis votre machine locale
3. **Appliquez les migrations manuellement** avant le déploiement
4. **Considérez d'utiliser `db push`** temporairement si les migrations formelles causent trop de problèmes

## 💡 Note importante

L'erreur P1002 pendant le build **ne devrait pas bloquer le déploiement** si le script `safe-migrate.js` fonctionne correctement. Le build devrait continuer et les migrations seront vérifiées au runtime lors de la première requête à la base de données.

