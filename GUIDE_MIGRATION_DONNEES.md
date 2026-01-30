# Guide de Migration des Données Locales vers la Production

Ce guide vous explique comment transférer vos données de développement (SQLite local) vers la production (PostgreSQL sur Neon).

## Prérequis

1. **Base de données locale** : SQLite avec vos données de test
2. **Base de données de production** : PostgreSQL (Neon) configurée
3. **Variables d'environnement** : Configurées correctement

## Configuration

### Étape 1 : Configurer les variables d'environnement

Dans votre fichier `.env.local`, ajoutez :

```env
# Base de données locale (SQLite) - celle avec vos données de test
DATABASE_URL_LOCAL=file:./prisma/dev.db

# Base de données de production (PostgreSQL Neon)
DATABASE_URL_PROD=postgresql://user:password@host:5432/database?schema=public
```

**Important** :
- `DATABASE_URL_LOCAL` : URL de votre base SQLite locale
- `DATABASE_URL_PROD` : URL PostgreSQL de votre base Neon de production
- Ne modifiez PAS `DATABASE_URL` si elle est déjà utilisée par votre app

### Étape 2 : Vérifier les données locales

Avant de migrer, vérifiez ce que vous avez en local :

```bash
# Lister les utilisateurs locaux
npm run list-users
```

## Migration

### Étape 3 : Exécuter la migration

```bash
npm run migrate-data
```

Le script va :
1. ✅ Se connecter à la base locale (SQLite)
2. ✅ Se connecter à la base de production (PostgreSQL)
3. ✅ Migrer les utilisateurs
4. ✅ Migrer les projets
5. ✅ Migrer les décisions
6. ✅ Migrer les actions
7. ✅ Migrer les réunions

### Ce qui est migré

- ✅ **Utilisateurs** : Tous les comptes avec leurs préférences
- ✅ **Projets** : Tous les projets avec leurs métadonnées
- ✅ **Décisions** : Toutes les décisions liées aux projets
- ✅ **Actions** : Toutes les actions items
- ✅ **Réunions** : Toutes les réunions et leurs notes

### Gestion des conflits

- **Utilisateurs existants** : Le script met à jour les données (mot de passe, préférences)
- **Projets existants** : Le script met à jour les métadonnées
- **Autres données** : Le script ignore les doublons (ne crée pas si existe déjà)

## Vérification après migration

### Vérifier les utilisateurs en production

```bash
# Changer DATABASE_URL temporairement pour pointer vers la prod
# Puis exécuter:
npm run list-users
```

### Vérifier dans l'application

1. Connectez-vous sur votre application en production
2. Vérifiez que vos projets sont présents
3. Vérifiez que vos données sont correctes

## Dépannage

### Erreur : "DATABASE_URL_PROD n'est pas définie"

**Solution** : Ajoutez `DATABASE_URL_PROD` dans `.env.local`

### Erreur : "Cannot connect to database"

**Solutions** :
1. Vérifiez que `DATABASE_URL_LOCAL` pointe vers votre fichier SQLite
2. Vérifiez que `DATABASE_URL_PROD` est correcte (URL Neon)
3. Testez les connexions :
   ```bash
   # Test connexion locale
   DATABASE_URL=file:./prisma/dev.db npm run db:check
   
   # Test connexion prod (remplacez par votre URL)
   DATABASE_URL=postgresql://... npm run db:check
   ```

### Erreur : "Foreign key constraint failed"

**Solution** : Les données sont migrées dans l'ordre des dépendances. Si l'erreur persiste :
1. Vérifiez que tous les utilisateurs sont migrés avant les projets
2. Vérifiez que les IDs sont corrects

### Les données ne sont pas migrées

**Vérifications** :
1. Vérifiez les logs du script pour voir les erreurs
2. Vérifiez que les tables existent en production (migrations appliquées)
3. Vérifiez les permissions de la base de données

## Migration sélective

Si vous voulez migrer seulement certaines données, vous pouvez modifier le script `scripts/migrate-local-to-prod.ts` et commenter les fonctions que vous ne voulez pas exécuter.

## Sécurité

⚠️ **Important** :
- Les mots de passe sont migrés tels quels (hashés)
- Les tokens de réinitialisation ne sont PAS migrés (sécurité)
- Les données Outlook (tokens OAuth) ne sont PAS migrées (sécurité)

## Alternative : Export/Import manuel

Si le script automatique ne fonctionne pas, vous pouvez :

1. **Exporter les données locales** :
   ```bash
   # Utiliser Prisma Studio pour exporter
   npx prisma studio
   ```

2. **Importer manuellement** via l'interface de votre base PostgreSQL (Neon Dashboard)

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du script
2. Vérifiez les variables d'environnement
3. Vérifiez que les migrations sont appliquées en production

