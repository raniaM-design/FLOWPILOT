# 🔍 Diagnostic sans Vercel CLI

## 🎯 Problème
Vous ne pouvez pas utiliser `vercel env pull` car le projet n'est pas lié.

## ✅ Solutions alternatives

### Option 1 : Lier le projet à Vercel (Recommandé)

```bash
# Lier le projet
vercel link --yes

# Ensuite récupérer les variables
vercel env pull .env.local

# Tester
npm run db:test-vercel
```

### Option 2 : Diagnostic direct depuis Vercel (Sans CLI)

Une fois votre code déployé sur Vercel :

1. **Allez sur votre site Vercel** : `https://votre-app.vercel.app/api/diagnose-db`
2. **Regardez le JSON retourné** - il vous dira exactement quel est le problème

Le JSON contiendra :
```json
{
  "checks": {
    "hasDatabaseUrl": true/false,
    "isPostgres": true/false,
    "hasPlaceholders": true/false,
    "dbConnection": "success" ou "failed",
    "userTableExists": true/false,
    "projectTableExists": true/false
  },
  "errors": [...],
  "summary": {
    "status": "healthy" ou "unhealthy",
    "message": "..."
  }
}
```

### Option 3 : Vérifier manuellement sur Vercel Dashboard

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. **Vérifiez DATABASE_URL** :
   - ✅ Est-elle définie pour **Production**, **Preview**, et **Development** ?
   - ✅ Ne contient-elle **PAS** de placeholders (`xxx`, `user:password`, `dbname`) ?
   - ✅ Est-ce votre **vraie** Connection String Neon ?

3. **Copiez DATABASE_URL** depuis Vercel Dashboard
4. **Mettez-la dans `.env.local`** manuellement :
   ```env
   DATABASE_URL="postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-REEL-ID.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```

5. **Testez localement** :
   ```bash
   npm run db:test-vercel
   ```

### Option 4 : Vérifier les logs Vercel directement

1. **Vercel Dashboard** → Votre projet → **Deployments** → Dernier déploiement
2. **Functions** → Cherchez les logs contenant `[auth/signup]`
3. **Regardez les détails** :
   - Code d'erreur (P1000, P1001, P1003, P1012)
   - `hasDatabaseUrl`: doit être `true`
   - `isPostgres`: doit être `true`
   - `isSqlite`: doit être `false`
   - Message d'erreur complet

## 🔧 Actions à faire maintenant

### Si vous avez accès à Vercel Dashboard :

1. **Vérifiez DATABASE_URL** :
   - Settings → Environment Variables
   - Vérifiez qu'elle ne contient **pas** de placeholders
   - Copiez-la et mettez-la dans `.env.local`

2. **Testez localement** :
   ```bash
   npm run db:test-vercel
   ```

3. **Si les tables n'existent pas**, appliquez les migrations :
   ```bash
   npm run db:deploy
   ```

4. **Redéployez sur Vercel** :
   - Vercel Dashboard → Deployments → Redeploy

### Si vous préférez lier le projet :

```bash
# Lier le projet (vous devrez sélectionner votre projet Vercel)
vercel link --yes

# Récupérer les variables
vercel env pull .env.local

# Tester
npm run db:test-vercel

# Si nécessaire, appliquer les migrations
npm run db:deploy
```

## 📋 Checklist

- [ ] DATABASE_URL vérifiée sur Vercel Dashboard (pas de placeholders)
- [ ] DATABASE_URL copiée dans `.env.local`
- [ ] `npm run db:test-vercel` exécuté et passé
- [ ] Migrations appliquées si nécessaire (`npm run db:deploy`)
- [ ] Application redéployée sur Vercel
- [ ] Endpoint `/api/diagnose-db` testé sur Vercel

## 🆘 Prochaines étapes

Une fois que vous avez :
1. ✅ Vérifié DATABASE_URL sur Vercel Dashboard
2. ✅ Testé avec `npm run db:test-vercel`
3. ✅ Appliqué les migrations si nécessaire

**Partagez-moi** :
- Le résultat de `npm run db:test-vercel`
- Ou le JSON de `https://votre-app.vercel.app/api/diagnose-db`

Et je pourrai vous aider à résoudre le problème exact !

