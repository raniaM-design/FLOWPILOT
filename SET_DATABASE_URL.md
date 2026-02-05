# 🔧 Comment définir votre DATABASE_URL

## 🎯 Problème actuel

Votre `.env.local` contient encore des placeholders (`xxx`, `user`, `password`, `dbname`) au lieu de votre vraie Connection String Neon.

## ✅ Solution rapide

### Étape 1 : Obtenir votre Connection String Neon

1. Allez sur **https://console.neon.tech**
2. Cliquez sur votre projet (ou créez-en un nouveau)
3. Allez dans **"Connection Details"** ou **"Settings"**
4. **Copiez la Connection String complète**

Elle doit ressembler à :
```
postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-REEL-ID-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### Étape 2 : Mettre à jour `.env.local`

**Option A : Script automatique (recommandé)**

```bash
node scripts/set-database-url.js "postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-REEL-ID.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

Remplacez `"postgresql://..."` par votre vraie Connection String.

**Option B : Édition manuelle**

1. Ouvrez `.env.local` dans un éditeur de texte
2. Trouvez la ligne `DATABASE_URL=...`
3. Remplacez-la par :
   ```env
   DATABASE_URL="postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-REEL-ID.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```
4. **⚠️ IMPORTANT** : Tout sur **une seule ligne**, pas de saut de ligne
5. Sauvegardez le fichier

### Étape 3 : Vérifier

```bash
# Diagnostic
node scripts/diagnose-db-connection.js

# Test de connexion
npm run db:check

# Appliquer les migrations
npm run db:deploy
```

## 🔍 Vérifications

### Vérifier que l'URL est correcte

```bash
node scripts/diagnose-db-connection.js
```

Le script vous dira si :
- ✅ L'URL ne contient pas de placeholders
- ✅ Le format est correct
- ⚠️ Il y a des problèmes à corriger

### Vérifier la connexion

```bash
npm run db:check
```

Vous devriez voir :
- ✅ Connexion réussie
- ✅ Tables existantes (ou prêtes à être créées)

## ⚠️ Erreurs communes

### Erreur : "Can't reach database server" (P1001)

**Cause** : L'URL contient encore des placeholders ou est incorrecte

**Solution** :
1. Vérifiez que vous avez copié la **vraie** Connection String depuis Neon
2. Vérifiez qu'il n'y a pas de "xxx" dans l'URL
3. Vérifiez que l'URL est sur une seule ligne

### Erreur : "Authentication failed" (P1000)

**Cause** : Le mot de passe dans l'URL est incorrect ou expiré

**Solution** :
1. Allez sur Neon Dashboard
2. Régénérez le mot de passe
3. Copiez la nouvelle Connection String
4. Mettez à jour `.env.local`

### Erreur : "URL must start with protocol" (P1012)

**Cause** : L'URL est sur plusieurs lignes ou mal formatée

**Solution** :
```bash
node scripts/fix-env-local.js
```

## 📝 Checklist

- [ ] Connection String copiée depuis **Neon Dashboard** (pas un template)
- [ ] URL ne contient **pas** de "xxx" ou placeholders
- [ ] URL est sur **une seule ligne** dans `.env.local`
- [ ] URL commence par `postgresql://` ou `postgres://`
- [ ] Testé avec `node scripts/diagnose-db-connection.js`
- [ ] Testé avec `npm run db:check`

## 🆘 Besoin d'aide ?

Si vous avez toujours des problèmes :

1. **Vérifiez votre projet Neon** :
   - https://console.neon.tech
   - Assurez-vous que le projet est **actif** (non suspendu)

2. **Créez un nouveau projet** si nécessaire :
   - https://neon.tech → Create Project
   - Copiez la nouvelle Connection String

3. **Exécutez le diagnostic complet** :
   ```bash
   node scripts/diagnose-db-connection.js
   ```

