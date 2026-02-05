# 🔧 Résolution : Erreur de connexion à la base de données Neon sur Vercel

## ❌ Erreur

```
Can't reach database server at `ep-lively-unit-agr9gjbq-pooler.c-2.eu-central-1.aws.neon.tech:5432`
```

## 🔍 Causes possibles

### 1. Base de données Neon en mode "sleep" (suspendue)

**Symptôme** : La base de données Neon se met en veille après une période d'inactivité (gratuit/plan basique)

**Solution** :
- La base de données se réveillera automatiquement lors de la prochaine requête
- Attendez quelques secondes et réessayez
- Si le problème persiste, allez sur https://console.neon.tech et réveillez manuellement le projet

### 2. DATABASE_URL incorrect ou vide sur Vercel

**Symptôme** : `DATABASE_URL` n'est pas défini ou contient des valeurs incorrectes

**Solution** :
1. Allez sur votre dashboard Vercel : https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que `DATABASE_URL` est défini et contient votre Connection String Neon complète
5. Si elle est vide ou incorrecte :
   - Allez sur https://console.neon.tech
   - Cliquez sur votre projet
   - Allez dans **"Connection Details"**
   - Copiez la **Connection String** complète
   - Ajoutez-la dans Vercel comme variable d'environnement `DATABASE_URL`
   - Sélectionnez tous les environnements (Production, Preview, Development)
   - Cliquez sur **Save**
   - **Redéployez** votre application

### 3. Base de données Neon supprimée ou modifiée

**Symptôme** : Le projet Neon n'existe plus ou l'endpoint a changé

**Solution** :
1. Vérifiez sur https://console.neon.tech que votre projet existe toujours
2. Si le projet a été supprimé, créez-en un nouveau :
   - https://neon.tech → Create Project
   - Copiez la nouvelle Connection String
   - Mettez à jour `DATABASE_URL` sur Vercel
   - Redéployez l'application

### 4. Problème de réseau/firewall

**Symptôme** : Connexion Internet instable ou firewall bloquant

**Solution** :
1. Vérifiez votre connexion Internet
2. Testez la connexion depuis le dashboard Neon (bouton "Test Connection")
3. Vérifiez que votre firewall/autoroute ne bloque pas les connexions PostgreSQL

## ✅ Solution rapide

### Étape 1 : Vérifier DATABASE_URL sur Vercel

1. Allez sur **https://vercel.com/dashboard**
2. Sélectionnez votre projet **flowpilot**
3. Allez dans **Settings** → **Environment Variables**
4. Cherchez `DATABASE_URL`
5. Vérifiez qu'elle contient votre Connection String Neon complète :
   ```
   postgresql://neondb_owner:password@ep-lively-unit-agr9gjbq-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### Étape 2 : Si DATABASE_URL est vide ou incorrecte

1. **Obtenir la Connection String Neon** :
   - Allez sur https://console.neon.tech
   - Cliquez sur votre projet
   - Allez dans **"Connection Details"**
   - **Copiez la Connection String complète** (elle doit ressembler à) :
     ```
     postgresql://neondb_owner:password@ep-lively-unit-agr9gjbq-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
     ```

2. **Ajouter sur Vercel** :
   - Dans Vercel Dashboard → Settings → Environment Variables
   - Cliquez sur **Add New**
   - Nom : `DATABASE_URL`
   - Valeur : Collez la Connection String complète
   - Sélectionnez tous les environnements (Production, Preview, Development)
   - Cliquez sur **Save**

3. **Redéployer** :
   - Allez dans **Deployments**
   - Cliquez sur les trois points (⋯) du dernier déploiement
   - Sélectionnez **Redeploy**
   - Ou faites un nouveau commit et push

### Étape 3 : Vérifier que la base de données Neon est active

1. Allez sur https://console.neon.tech
2. Vérifiez que votre projet est **actif** (pas suspendu)
3. Si suspendu, cliquez sur **"Resume"** ou **"Activate"**

### Étape 4 : Tester la connexion

1. **Via l'endpoint de diagnostic Vercel** :
   ```
   https://votre-app.vercel.app/api/diagnose-db
   ```
   Cet endpoint vous donnera des informations détaillées sur l'état de la connexion.

2. **Via l'endpoint de test simple** :
   ```
   https://votre-app.vercel.app/api/test-db
   ```

## 🔍 Diagnostic avancé

### Vérifier les logs Vercel

1. Allez sur votre dashboard Vercel
2. Sélectionnez votre projet
3. Allez dans **Deployments** → Cliquez sur le dernier déploiement
4. Allez dans **Functions** → Cherchez les logs d'erreur
5. Cherchez les erreurs contenant `P1001` ou `Can't reach database server`

### Vérifier DATABASE_URL via l'API

Appelez l'endpoint de diagnostic :
```
GET https://votre-app.vercel.app/api/diagnose-db
```

Réponse attendue :
```json
{
  "checks": {
    "hasDatabaseUrl": true,
    "isPostgres": true,
    "hasPlaceholders": false,
    "dbConnection": "success"
  },
  "summary": {
    "status": "healthy"
  }
}
```

Si `hasDatabaseUrl: false` → `DATABASE_URL` n'est pas défini sur Vercel
Si `hasPlaceholders: true` → `DATABASE_URL` contient des placeholders (xxx)
Si `dbConnection: "failed"` → Problème de connexion à la base de données

## 📋 Checklist

- [ ] `DATABASE_URL` est défini sur Vercel (Settings → Environment Variables)
- [ ] `DATABASE_URL` contient la Connection String complète (pas de placeholders)
- [ ] `DATABASE_URL` est configuré pour tous les environnements (Production, Preview, Development)
- [ ] L'application a été redéployée après la modification de `DATABASE_URL`
- [ ] Le projet Neon est actif (non suspendu) sur https://console.neon.tech
- [ ] Testé avec `/api/diagnose-db` sur Vercel
- [ ] Testé avec `/api/test-db` sur Vercel

## 🆘 Si le problème persiste

1. **Créer un nouveau projet Neon** :
   - https://neon.tech → Create Project
   - Copiez la nouvelle Connection String
   - Mettez à jour `DATABASE_URL` sur Vercel
   - Redéployez l'application

2. **Vérifier les logs Vercel** pour des erreurs spécifiques

3. **Contacter le support Neon** si le projet existe mais n'est pas accessible

## 📚 Références

- [Neon Documentation - Connection Strings](https://neon.tech/docs/connect/connect-from-any-app)
- [Vercel Documentation - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Error Codes](https://www.prisma.io/docs/reference/api-reference/error-reference)

