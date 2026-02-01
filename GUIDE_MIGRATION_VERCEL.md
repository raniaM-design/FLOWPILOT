# 🔄 Guide : Appliquer la migration isCompanyAdmin sur Vercel

## Option 1 : Migration automatique lors du déploiement (Recommandé)

La migration sera appliquée automatiquement lors du prochain déploiement sur Vercel grâce au script `vercel-build` qui exécute `safe-migrate.js`.

**Pour déclencher un nouveau déploiement :**
1. Faites un commit et push vers votre branche principale
2. Vercel déploiera automatiquement
3. Le script `safe-migrate.js` appliquera les migrations pendant le build

**Vérification :**
- Allez dans Vercel Dashboard > Votre projet > Deployments
- Cliquez sur le dernier déploiement
- Vérifiez les logs de build pour voir "✅ Migrations appliquées avec succès"

---

## Option 2 : Migration manuelle depuis votre machine locale

Si vous voulez appliquer la migration immédiatement sans attendre le déploiement :

### Étape 1 : Obtenir l'URL de la base de données de production

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings > Environment Variables**
4. Copiez la valeur de `DATABASE_URL` (c'est votre URL PostgreSQL de production)

### Étape 2 : Configurer DATABASE_URL_PROD localement

Ajoutez cette ligne dans votre fichier `.env.local` :

```bash
DATABASE_URL_PROD=postgresql://votre-url-de-production
```

⚠️ **IMPORTANT** : Remplacez `votre-url-de-production` par l'URL réelle copiée depuis Vercel.

### Étape 3 : Appliquer la migration

Exécutez la commande :

```bash
npm run db:migrate-prod
```

Cette commande va :
- Se connecter à votre base de données PostgreSQL de production
- Vérifier si le champ `isCompanyAdmin` existe déjà
- L'ajouter s'il n'existe pas encore

---

## Option 3 : Migration SQL directe (Avancé)

Si vous avez accès direct à votre base de données PostgreSQL (via Neon Dashboard ou psql) :

```sql
-- Vérifier si la colonne existe déjà
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name = 'isCompanyAdmin'
AND table_schema = 'public';

-- Si la colonne n'existe pas, l'ajouter
ALTER TABLE "User" 
ADD COLUMN "isCompanyAdmin" BOOLEAN NOT NULL DEFAULT false;
```

---

## Vérification

Pour vérifier que la migration a été appliquée avec succès :

### Via le script de vérification :

```bash
npm run check-prod-data
```

### Via SQL direct :

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name = 'isCompanyAdmin';
```

Vous devriez voir :
- `column_name`: `isCompanyAdmin`
- `data_type`: `boolean`
- `column_default`: `false`

---

## Dépannage

### Erreur : "DATABASE_URL_PROD n'est pas définie"

➡️ Ajoutez `DATABASE_URL_PROD` dans votre `.env.local` avec l'URL PostgreSQL de production

### Erreur : "DATABASE_URL_PROD doit être une URL PostgreSQL"

➡️ Vérifiez que l'URL commence bien par `postgresql://` ou `postgres://`

### Erreur : "Can't reach database"

➡️ Vérifiez que :
- L'URL de la base de données est correcte
- Votre IP n'est pas bloquée par le firewall Neon (si applicable)
- La base de données est accessible depuis votre réseau

---

## Notes importantes

- ⚠️ **Sauvegarde** : Avant d'appliquer une migration en production, assurez-vous d'avoir une sauvegarde de votre base de données
- 🔒 **Sécurité** : Ne partagez jamais votre `DATABASE_URL` publiquement
- ✅ **Idempotence** : Le script vérifie si la colonne existe déjà avant de l'ajouter, vous pouvez l'exécuter plusieurs fois sans risque

