# Configuration du Tenant Azure AD pour OAuth

## Erreur : AADSTS50194

Si vous obtenez l'erreur :
```
AADSTS50194: l'app n'est pas multi-tenant, donc /common est interdit.
```

Cela signifie que votre application Azure AD n'est **pas configurée comme multi-tenant**, donc vous ne pouvez pas utiliser `/common` comme endpoint.

## Solution : Utiliser le Tenant ID spécifique

### Option 1 : Utiliser le Directory (tenant) ID (Recommandé pour dev)

1. **Trouver votre Directory (tenant) ID** :
   - Allez sur [Azure Portal](https://portal.azure.com)
   - Azure Active Directory > Overview
   - Copiez le **Directory (tenant) ID** (format UUID, ex: `79eee8d7-0044-4841-bbf2-ab3b457dd5ce`)

2. **Mettre à jour `.env.local`** :
   ```env
   # Remplacez "common" par votre Directory (tenant) ID
   MICROSOFT_TENANT_ID=79eee8d7-0044-4841-bbf2-ab3b457dd5ce
   ```

3. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

### Option 2 : Configurer l'app comme multi-tenant (Pour production)

Si vous voulez permettre à n'importe quel utilisateur Microsoft de se connecter :

1. **Dans Azure Portal** :
   - Allez dans votre App Registration
   - Authentication > Supported account types
   - Sélectionnez : **"Accounts in any organizational directory and personal Microsoft accounts"**
   - Sauvegardez

2. **Garder `.env.local` avec "common"** :
   ```env
   MICROSOFT_TENANT_ID=common
   ```

## Vérification

Après avoir mis à jour `.env.local` :

1. **Vérifier que le tenant est bien lu** :
   ```
   http://localhost:3000/api/_debug/env
   ```
   Devrait afficher : `"MICROSOFT_TENANT_ID": true`

2. **Vérifier les logs serveur** :
   Quand vous appelez `/api/outlook/connect`, vous devriez voir :
   ```
   [outlook] tenant: 79eee8d7-0044-4841-bbf2-ab3b457dd5ce
   ```

3. **Tester la connexion** :
   ```
   http://localhost:3000/api/outlook/connect
   ```
   Ne devrait plus afficher l'erreur `AADSTS50194`.

## Endpoints OAuth utilisés

Selon le tenant configuré :

### Avec Tenant ID spécifique :
- **Authorize** : `https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize`
- **Token** : `https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token`

### Avec "common" (multi-tenant) :
- **Authorize** : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token** : `https://login.microsoftonline.com/common/oauth2/v2.0/token`

## Recommandation

- **Développement** : Utiliser le Tenant ID spécifique (Option 1)
- **Production** : Configurer comme multi-tenant (Option 2) si vous voulez permettre à tous les utilisateurs Microsoft de se connecter

## Format du Tenant ID

Le Tenant ID est un UUID au format :
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Exemple :
```
79eee8d7-0044-4841-bbf2-ab3b457dd5ce
```

⚠️ **Ne pas utiliser** :
- `common` (si l'app n'est pas multi-tenant)
- `organizations` (pour les comptes organisationnels uniquement)
- `consumers` (pour les comptes personnels uniquement)

