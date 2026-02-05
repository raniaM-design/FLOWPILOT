# 🔧 Résolution : Erreur P1001 - Can't reach database server

## Problème
```
Error: P1001
Can't reach database server at `ep-xxx-xxx.region.aws.neon.tech:5432`
```

## 🔍 Causes possibles

### 1. DATABASE_URL contient des placeholders (xxx)
**Symptôme** : L'URL contient `ep-xxx-xxx` au lieu d'un vrai host Neon

**Solution** :
1. Allez sur https://console.neon.tech
2. Cliquez sur votre projet
3. Allez dans **"Connection Details"**
4. **Copiez la vraie Connection String** (pas le template)
5. Remplacez DATABASE_URL dans `.env.local`

### 2. Base de données Neon suspendue
**Symptôme** : Le projet Neon existe mais est inactif

**Solution** :
1. Allez sur https://console.neon.tech
2. Vérifiez que votre projet est **actif** (pas suspendu)
3. Si suspendu, cliquez sur **"Resume"** ou **"Activate"**

### 3. URL incorrecte ou incomplète
**Symptôme** : L'URL ne correspond pas à votre projet Neon

**Solution** :
1. Vérifiez que vous utilisez la bonne Connection String
2. Assurez-vous qu'il n'y a pas de caractères manquants
3. Vérifiez que l'URL est sur **une seule ligne** dans `.env.local`

### 4. Problème de réseau/firewall
**Symptôme** : Connexion Internet instable ou firewall bloquant

**Solution** :
1. Vérifiez votre connexion Internet
2. Essayez de vous connecter depuis le dashboard Neon (bouton "Test Connection")
3. Vérifiez que votre firewall/autoroute ne bloque pas les connexions PostgreSQL

## ✅ Solution rapide

### Étape 1 : Vérifier votre Connection String Neon

1. Allez sur **https://console.neon.tech**
2. Cliquez sur votre projet
3. Allez dans **"Connection Details"**
4. **Copiez la Connection String complète** (elle doit ressembler à) :
   ```
   postgresql://neondb_owner:password@ep-REEL-ID.region.aws.neon.tech/neondb?sslmode=require
   ```

### Étape 2 : Mettre à jour `.env.local`

Ouvrez `.env.local` et remplacez `DATABASE_URL` par la vraie Connection String :

```env
DATABASE_URL="postgresql://neondb_owner:VRAI_MOT_DE_PASSE@ep-REEL-ID.region.aws.neon.tech/neondb?sslmode=require"
```

**⚠️ IMPORTANT** :
- Remplacez `ep-REEL-ID` par votre vrai endpoint Neon
- Remplacez `VRAI_MOT_DE_PASSE` par votre vrai mot de passe
- Tout sur **une seule ligne** (pas de saut de ligne)

### Étape 3 : Vérifier avec le script de diagnostic

```bash
node scripts/diagnose-db-connection.js
```

Ce script vous dira si l'URL contient des placeholders ou semble invalide.

### Étape 4 : Tester la connexion

```bash
npm run db:check
```

## 🔍 Diagnostic avancé

### Vérifier que l'URL ne contient pas de placeholders

```bash
node scripts/diagnose-db-connection.js
```

Le script vérifiera :
- ✅ Si l'host contient "xxx" (placeholder)
- ✅ Si le username/password sont des placeholders
- ✅ Si le format de l'URL est correct

### Tester la connexion depuis Neon Dashboard

1. Allez sur https://console.neon.tech
2. Cliquez sur votre projet
3. Cherchez un bouton **"Test Connection"** ou **"Connect"**
4. Si ça fonctionne depuis Neon, le problème vient de votre DATABASE_URL locale

## 📝 Checklist

- [ ] Connection String copiée depuis **Neon Dashboard** (pas un template)
- [ ] URL ne contient **pas** de "xxx" ou placeholders
- [ ] URL est sur **une seule ligne** dans `.env.local`
- [ ] Projet Neon est **actif** (non suspendu)
- [ ] Connexion Internet fonctionne
- [ ] Testé avec `node scripts/diagnose-db-connection.js`

## 🆘 Si le problème persiste

1. **Créez un nouveau projet Neon** :
   - https://neon.tech → Create Project
   - Copiez la nouvelle Connection String
   - Mettez à jour `.env.local`

2. **Vérifiez les logs détaillés** :
   ```bash
   node scripts/diagnose-db-connection.js
   ```

3. **Contactez le support Neon** si le projet existe mais n'est pas accessible

