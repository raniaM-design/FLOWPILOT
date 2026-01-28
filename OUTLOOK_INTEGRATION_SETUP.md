# Configuration de l'intégration Outlook

## Variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env` :

```env
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
MICROSOFT_TENANT_ID=79eee8d7-0044-4841-bbf2-ab3b457dd5ce
# Note: Utilisez votre Directory (tenant) ID (UUID) au lieu de "common" si l'app n'est pas multi-tenant
# Pour trouver votre tenant ID: Azure Portal > Azure AD > Overview > Directory (tenant) ID
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook/callback
MICROSOFT_SCOPES=offline_access User.Read Calendars.Read openid profile email
```

**Note pour la production** : Remplacez `MICROSOFT_REDIRECT_URI` par votre URL de production.

## Configuration Azure AD / Microsoft Entra ID

1. Allez sur [Azure Portal](https://portal.azure.com)
2. Créez une nouvelle application (App Registration)
3. **Copiez le Directory (tenant) ID** :
   - Azure Active Directory > Overview
   - Copiez le **Directory (tenant) ID** (format UUID, ex: `79eee8d7-0044-4841-bbf2-ab3b457dd5ce`)
   - C'est votre `MICROSOFT_TENANT_ID`
4. Configurez les redirect URIs :
   - `http://localhost:3000/api/outlook/callback` (dev)
   - `https://votre-domaine.com/api/outlook/callback` (prod)
5. Créez un client secret et copiez-le dans `MICROSOFT_CLIENT_SECRET`
6. Copiez l'Application (client) ID dans `MICROSOFT_CLIENT_ID`
7. Dans "API permissions", ajoutez :
   - `User.Read` (delegated)
   - `Calendars.Read` (delegated)
   - `offline_access` (delegated)
   - `openid`, `profile`, `email` (delegated)

## ⚠️ Erreur AADSTS50194

Si vous obtenez l'erreur `AADSTS50194: l'app n'est pas multi-tenant, donc /common est interdit` :

- Votre app n'est **pas** configurée comme multi-tenant
- Utilisez votre **Directory (tenant) ID** au lieu de `common` dans `MICROSOFT_TENANT_ID`
- Voir `AZURE_TENANT_CONFIG.md` pour plus de détails et les options de configuration

## Migration Prisma

**IMPORTANT** : Exécutez la migration pour créer les nouvelles tables et régénérer le client Prisma :

```bash
npx prisma migrate dev --name add_outlook_integration
```

Cette commande va :
1. Créer la table `OutlookAccount`
2. Ajouter les champs `externalProvider`, `externalEventId`, `externalCalendarId`, `isSynced` à la table `Meeting`
3. Créer l'index unique `ownerId_externalEventId`
4. Régénérer automatiquement le client Prisma

Si vous avez déjà appliqué les changements manuellement, vous pouvez juste régénérer le client :

```bash
npx prisma generate
```

## Utilisation

1. L'utilisateur clique sur "Intégrations" dans le menu
2. Clique sur "Connecter Outlook"
3. Autorise l'application dans Microsoft
4. Revient sur PILOTYS connecté
5. Peut voir les événements Outlook (Aujourd'hui / Cette semaine)
6. Clique sur "Importer" pour créer un Meeting PILOTYS
7. Les événements déjà importés sont marqués comme "Importé"

## Sécurité

- Tous les tokens sont stockés côté serveur uniquement
- Les appels à Microsoft Graph sont effectués côté serveur
- Le refresh token est utilisé automatiquement quand le access token expire
- Aucun secret n'est exposé côté client

