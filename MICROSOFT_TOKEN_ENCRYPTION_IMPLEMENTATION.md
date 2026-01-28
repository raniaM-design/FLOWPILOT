# Implémentation du chiffrement des tokens Microsoft

## ✅ Résumé des modifications

**Objectif** : Stocker les tokens Microsoft (access_token, refresh_token) de manière sécurisée avec chiffrement au repos, et fournir une fonction utilitaire pour obtenir un access token valide avec refresh automatique.

---

## 🔐 Modifications appliquées

### 1. Nouveau module de chiffrement

**Fichier** : `lib/outlook/encryption.ts`

- **Fonctions** :
  - `encryptToken(plaintext: string): string` : Chiffre un token avec AES-256-GCM
  - `decryptToken(encrypted: string): string` : Déchiffre un token

- **Sécurité** :
  - Algorithme : AES-256-GCM (authenticated encryption)
  - Clé : Dérivée de `MICROSOFT_TOKEN_ENCRYPTION_KEY` (env) ou clé dev par défaut
  - Format stockage : `iv:authTag:encrypted` (tous en hex)

- **Configuration** :
  - Variable d'environnement : `MICROSOFT_TOKEN_ENCRYPTION_KEY` (optionnel en dev, obligatoire en prod)
  - En dev : Clé par défaut (⚠️ ne jamais utiliser en prod)

---

### 2. Modèle Prisma mis à jour

**Fichier** : `prisma/schema.prisma`

**Modifications** :
```prisma
model OutlookAccount {
  id               String   @id @default(cuid())
  userId           String   @unique
  provider         String   @default("outlook")
  providerAccountId String? // ← NOUVEAU : ID du compte Microsoft
  accessToken      String?  // ← MODIFIÉ : Optionnel (peut être null)
  refreshToken     String   // ← OBLIGATOIRE (inchangé)
  expiresAt        DateTime
  scope            String?
  tokenType        String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Changements** :
- ✅ `providerAccountId` : Ajouté (optionnel, récupéré depuis l'ID token ou Graph API)
- ✅ `accessToken` : Rendu optionnel (peut être null si seul refreshToken stocké)
- ✅ `refreshToken` : Reste obligatoire

**Migration** : `20260104092901_add_provider_account_id_and_encryption`

---

### 3. Fonction utilitaire principale

**Fichier** : `lib/outlook/graph.ts`

**Nouvelle fonction** : `getValidMicrosoftAccessToken(userId: string): Promise<string>`

**Comportement** :
- ✅ Retourne un access token valide (en clair)
- ✅ Refresh automatiquement si expiré (< 2 minutes) ou manquant
- ✅ Déchiffre automatiquement les tokens depuis la DB
- ✅ Gère les erreurs de déchiffrement (tente un refresh)

**Utilisation** :
```typescript
import { getValidMicrosoftAccessToken } from "@/lib/outlook/graph";

const accessToken = await getValidMicrosoftAccessToken(userId);
// Utiliser accessToken pour appeler Microsoft Graph API
```

**Fonction interne** : `refreshAccessTokenIfNeeded(userId: string): Promise<string>`
- ✅ Mise à jour pour utiliser le chiffrement
- ✅ Déchiffre le refreshToken avant utilisation
- ✅ Chiffre les nouveaux tokens avant stockage
- ✅ Logs minimalistes (sans tokens)

---

### 4. Callback OAuth mis à jour

**Fichier** : `app/api/outlook/callback/route.ts`

**Modifications** :
- ✅ Chiffre les tokens avant stockage (`encryptToken`)
- ✅ Récupère `providerAccountId` depuis l'ID token (JWT) ou Graph API
- ✅ Logs minimalistes (sans tokens, seulement métadonnées)

**Flux** :
1. Reçoit `code` + `state` depuis Microsoft
2. Échange `code` → tokens (access_token, refresh_token, id_token)
3. Décode l'ID token pour extraire `providerAccountId` (oid ou sub)
4. Si `providerAccountId` absent, appelle Graph API `/me` pour le récupérer
5. Chiffre `accessToken` et `refreshToken`
6. Stocke en DB avec `providerAccountId`

---

### 5. Logs minimalistes

**Règle** : **Jamais logger les tokens** (access_token, refresh_token)

**Logs ajoutés** :
- `[outlook-callback] Storing tokens for user {userId}` : Métadonnées uniquement
- `[outlook] Refreshing access token for user {userId}` : Action + expiresAt
- `[outlook] Access token refreshed for user {userId}` : Succès + expiresAt
- `[outlook] Fetching events for user {userId}` : Action
- `[outlook] Fetched {count} events for user {userId}` : Résultat

**Format** :
```typescript
console.log(`[outlook] Action for user ${userId}`, {
  hasAccessToken: !!token,  // ✅ Booléen
  expiresAt: date.toISOString(), // ✅ Date
  hasProviderAccountId: !!id, // ✅ Booléen
  // ❌ JAMAIS : token, accessToken, refreshToken
});
```

---

## 🔧 Variables d'environnement

### Nouvelle variable (optionnelle en dev)

**Fichier** : `.env.local`

```env
# Clé de chiffrement pour les tokens Microsoft (optionnel en dev, obligatoire en prod)
MICROSOFT_TOKEN_ENCRYPTION_KEY=votre_cle_secrete_32_bytes_minimum
```

**Génération d'une clé sécurisée** :
```bash
# Option 1 : OpenSSL
openssl rand -base64 32

# Option 2 : Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Note** : En développement, si `MICROSOFT_TOKEN_ENCRYPTION_KEY` n'est pas définie, une clé par défaut est utilisée (⚠️ ne jamais utiliser en production).

---

## 📋 Migration Prisma

**Migration créée** : `20260104092901_add_provider_account_id_and_encryption`

**À appliquer** :
```bash
npx prisma migrate dev
npx prisma generate
```

**Note** : Si `prisma generate` échoue avec une erreur de permissions (Windows), arrêter le serveur de dev, puis relancer `prisma generate`.

---

## ✅ Vérifications

### 1. Stockage sécurisé
- ✅ Tokens chiffrés avant stockage en DB
- ✅ Format : AES-256-GCM avec IV et auth tag
- ✅ Clé dérivée depuis variable d'environnement

### 2. Refresh automatique
- ✅ `getValidMicrosoftAccessToken()` refresh si expiré
- ✅ Refresh token utilisé pour obtenir nouveau access token
- ✅ Nouveaux tokens chiffrés avant stockage

### 3. Provider Account ID
- ✅ Récupéré depuis l'ID token (JWT) si disponible
- ✅ Sinon, récupéré via Graph API `/me`
- ✅ Stocké en DB pour référence future

### 4. Logs sécurisés
- ✅ Aucun token jamais loggé
- ✅ Seulement métadonnées (booléens, dates, IDs)

---

## 🚀 Utilisation

### Obtenir un access token valide

```typescript
import { getValidMicrosoftAccessToken } from "@/lib/outlook/graph";

try {
  const accessToken = await getValidMicrosoftAccessToken(userId);
  // Utiliser accessToken pour appeler Microsoft Graph API
} catch (error) {
  // Gérer l'erreur (compte non connecté, refresh échoué, etc.)
}
```

### Appeler Microsoft Graph API

```typescript
import { getValidMicrosoftAccessToken } from "@/lib/outlook/graph";

const accessToken = await getValidMicrosoftAccessToken(userId);

const response = await fetch("https://graph.microsoft.com/v1.0/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
});
```

---

## 🔒 Sécurité

### Chiffrement au repos
- ✅ Tokens stockés chiffrés en DB
- ✅ Algorithme : AES-256-GCM (authenticated encryption)
- ✅ IV unique par token (pas de réutilisation)
- ✅ Auth tag pour détecter toute modification

### Gestion des clés
- ✅ Clé stockée dans variable d'environnement (jamais en code)
- ✅ Clé par défaut uniquement en dev (warning en prod)
- ✅ Clé dérivée avec SHA-256 pour garantir 32 bytes

### Bonnes pratiques
- ✅ Tokens jamais loggés
- ✅ Tokens déchiffrés uniquement en mémoire
- ✅ Refresh automatique pour éviter tokens expirés
- ✅ Gestion d'erreurs robuste

---

## 📊 Résumé des fichiers modifiés

| Fichier | Modifications | Type |
|---------|-------------|------|
| `lib/outlook/encryption.ts` | Nouveau module de chiffrement | Créé |
| `lib/outlook/graph.ts` | Ajout `getValidMicrosoftAccessToken()`, mise à jour `refreshAccessTokenIfNeeded()` | Modifié |
| `app/api/outlook/callback/route.ts` | Chiffrement des tokens, récupération `providerAccountId` | Modifié |
| `prisma/schema.prisma` | Ajout `providerAccountId`, `accessToken` optionnel | Modifié |
| `prisma/migrations/.../migration.sql` | Migration DB | Créé |

---

## ⚠️ Notes importantes

1. **Migration Prisma** : Appliquer la migration avant d'utiliser le code
2. **Clé de chiffrement** : Définir `MICROSOFT_TOKEN_ENCRYPTION_KEY` en production
3. **Tokens existants** : Les tokens déjà stockés en clair ne seront pas automatiquement chiffrés (nécessite une migration de données)
4. **Compatibilité** : Le code gère les tokens chiffrés et non chiffrés (fallback vers refresh si déchiffrement échoue)

---

## 🔄 Migration des tokens existants

Si vous avez déjà des tokens stockés en clair, vous pouvez créer un script de migration :

```typescript
// scripts/migrate-tokens-to-encrypted.ts
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/outlook/encryption";

async function migrateTokens() {
  const accounts = await prisma.outlookAccount.findMany({
    where: {
      // Tokens non chiffrés (ne commencent pas par le format iv:authTag:encrypted)
      accessToken: { not: { startsWith: /^[0-9a-f]{32}:/ } },
    },
  });

  for (const account of accounts) {
    try {
      const encryptedAccess = encryptToken(account.accessToken);
      const encryptedRefresh = encryptToken(account.refreshToken);
      
      await prisma.outlookAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
        },
      });
      
      console.log(`Migrated tokens for user ${account.userId}`);
    } catch (error) {
      console.error(`Failed to migrate tokens for user ${account.userId}:`, error);
    }
  }
}

migrateTokens();
```

---

## ✅ Résultat final

- ✅ Tokens Microsoft stockés chiffrés en DB
- ✅ Refresh automatique avec `getValidMicrosoftAccessToken()`
- ✅ `providerAccountId` stocké pour référence
- ✅ Logs sécurisés (jamais de tokens)
- ✅ Compatible avec comptes pro + personnels

