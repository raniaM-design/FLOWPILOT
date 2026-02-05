# 🔍 Vérifier après déploiement sur Vercel

## 🎯 Après avoir pushé la version

Une fois que Vercel a déployé votre application, vérifiez que tout fonctionne :

### Étape 1 : Vérifier les logs de build Vercel

1. **Vercel Dashboard** → Votre projet → **Deployments** → Dernier déploiement
2. **Build Logs** → Cherchez :
   - `🔄 Application FORCÉE des migrations Prisma sur Vercel...`
   - `✅ Migrations appliquées avec succès` OU `✅ Schéma synchronisé avec succès`
   - Si vous voyez une erreur, notez-la

### Étape 2 : Tester l'endpoint de test DB

Allez sur :
```
https://votre-app.vercel.app/api/test-db
```

Vous devriez voir :
```json
{
  "status": "ok",
  "message": "Base de données accessible",
  "userCount": 0,
  "projectCount": 0,
  "databaseUrl": "postgresql://neondb_owner:..."
}
```

Si vous voyez `"status": "error"`, regardez le `code` et `message` pour identifier le problème.

### Étape 3 : Tester l'endpoint de diagnostic complet

Allez sur :
```
https://votre-app.vercel.app/api/diagnose-db
```

Vous devriez voir :
```json
{
  "summary": {
    "status": "healthy",
    "message": "Tous les checks sont passés ✅"
  },
  "checks": {
    "hasDatabaseUrl": true,
    "isPostgres": true,
    "hasPlaceholders": false,
    "dbConnection": "success",
    "userTableExists": true,
    "projectTableExists": true
  }
}
```

### Étape 4 : Tester la création de compte

1. Allez sur votre site Vercel
2. Essayez de créer un compte
3. Si ça fonctionne → 🎉 **Problème résolu !**
4. Si ça ne fonctionne pas → Regardez les logs Vercel (voir ci-dessous)

## 🔍 Si ça ne fonctionne toujours pas

### Vérifier les logs Runtime Vercel

1. **Vercel Dashboard** → Votre projet → **Deployments** → Dernier déploiement
2. **Functions** → Cherchez les logs contenant `[auth/signup]`
3. Regardez les détails :
   - Code d'erreur (P1000, P1001, P1003, P1012)
   - `hasDatabaseUrl`: doit être `true`
   - `isPostgres`: doit être `true`
   - Message d'erreur complet

### Erreurs courantes et solutions

#### Erreur P1012 : "Column does not exist" ou "Schema validation"
**Cause** : Les migrations ne sont pas appliquées

**Solution** :
```bash
# Appliquer les migrations manuellement depuis votre machine
vercel env pull .env.local --environment=production --yes
npm run db:deploy
```

Puis redéployez sur Vercel.

#### Erreur P1000 : "Authentication failed"
**Cause** : DATABASE_URL contient un mauvais mot de passe

**Solution** :
1. Régénérez le mot de passe sur Neon
2. Mettez à jour DATABASE_URL sur Vercel
3. Redéployez

#### Erreur P1001 : "Can't reach database server"
**Cause** : DATABASE_URL est incorrecte ou contient des placeholders

**Solution** :
1. Vérifiez que DATABASE_URL ne contient pas de `xxx`, `user:password`, `dbname`
2. Vérifiez que c'est votre vraie Connection String Neon
3. Vérifiez que votre projet Neon est actif

## 📋 Checklist finale

- [ ] Build Vercel réussi (pas d'erreur dans les logs)
- [ ] Migrations appliquées (vérifié dans les logs de build)
- [ ] `/api/test-db` retourne `"status": "ok"`
- [ ] `/api/diagnose-db` retourne `"status": "healthy"`
- [ ] Création de compte fonctionne sur Vercel

## 🆘 Besoin d'aide ?

Si le problème persiste après avoir vérifié tout ça :

1. **Partagez-moi** :
   - Le résultat de `/api/test-db`
   - Le résultat de `/api/diagnose-db`
   - Les logs Vercel contenant `[auth/signup]`

2. **Ou exécutez localement** :
   ```bash
   vercel env pull .env.local --environment=production --yes
   npm run db:auto-fix
   ```
   Et partagez-moi le résultat.

