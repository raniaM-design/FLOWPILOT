# Implémentation de la gestion des comptes Outlook

## 📋 Résumé des modifications

**Objectif** : Permettre à un utilisateur de connecter une adresse Outlook, de voir l'adresse connectée, de la déconnecter et d'en connecter une autre.

---

## 🔧 Modifications BACKEND

### 1. Modèle Prisma mis à jour

**Fichier** : `prisma/schema.prisma`

**Modifications** :
```prisma
model OutlookAccount {
  // ... champs existants
  email            String?  // ← NOUVEAU : Email Outlook connecté
  connectedAt      DateTime @default(now()) // ← NOUVEAU : Date de connexion
  // ... autres champs
}
```

**Migration** : `20260104095732_add_outlook_email_and_connected_at`

---

### 2. Endpoint GET /api/outlook/status mis à jour

**Fichier** : `app/api/outlook/status/route.ts`

**Modifications** :
- ✅ Retourne maintenant `email` et `lastSyncAt`
- ✅ Récupère `lastSyncAt` depuis `OutlookSyncState`

**Réponse** :
```json
{
  "connected": true,
  "email": "user@outlook.com",
  "lastSyncAt": "2024-01-15T09:00:00.000Z",
  "connectedAt": "2024-01-10T08:00:00.000Z"
}
```

---

### 3. Endpoint POST /api/integrations/outlook/disconnect créé

**Fichier** : `app/api/integrations/outlook/disconnect/route.ts`

**Fonctionnalités** :
- ✅ Vérifie l'authentification
- ✅ Vérifie si un compte est connecté
- ✅ Supprime le compte Outlook (`OutlookAccount`)
- ✅ Supprime l'état de synchronisation (`OutlookSyncState`)
- ✅ Logs minimalistes (sans tokens)

**Réponse** :
```json
{
  "success": true,
  "message": "Compte Outlook déconnecté avec succès"
}
```

---

### 4. Callback OAuth mis à jour

**Fichier** : `app/api/outlook/callback/route.ts`

**Modifications** :
- ✅ Récupère l'email Outlook via Graph API `/me` (`mail` ou `userPrincipalName`)
- ✅ Stocke l'email dans `OutlookAccount.email`
- ✅ Gère le remplacement automatique si une connexion existe déjà
- ✅ Conserve `connectedAt` lors du remplacement (ou met à jour si nouvelle connexion)

**Logique** :
- Si une connexion existe déjà → remplacement automatique (un seul compte par utilisateur)
- L'email est récupéré depuis Graph API et stocké en DB

---

### 5. Endpoint /api/outlook/connect mis à jour

**Fichier** : `app/api/outlook/connect/route.ts`

**Modifications** :
- ✅ Vérifie si une connexion existe déjà
- ✅ Log en développement si remplacement
- ✅ Remplacement automatique (pas de confirmation requise)

---

## 🎨 Modifications FRONTEND

### 1. Page d'intégration Outlook mise à jour

**Fichier** : `app/app/integrations/outlook/page.tsx`

**Nouveaux états** :
- `outlookEmail` : Email du compte connecté
- `lastSyncAt` : Date de dernière synchronisation
- `isDisconnecting` : État de déconnexion en cours
- `showChangeAccountWarning` : Affichage du warning de changement

**Nouvelles fonctions** :
- `handleDisconnect()` : Déconnecte le compte et relance le flow si changement
- `handleChangeAccount()` : Affiche le warning de changement
- `handleCancelChangeAccount()` : Annule le changement
- `formatDateShort()` : Formatage court de date

**Nouvelles sections UI** :

#### A. Bouton "Changer de compte Outlook"
- Ajouté dans le header à côté du bouton "Synchroniser maintenant"
- Variant `ghost` pour distinction visuelle
- Désactivé pendant sync/disconnect

#### B. Warning changement de compte
- Carte avec fond jaune (`bg-[#FFFBEB]`, `border-[#FEF3C7]`)
- Message clair : "Le compte Outlook actuellement connecté sera déconnecté."
- Boutons "Confirmer" et "Annuler"
- Affichage conditionnel (`showChangeAccountWarning`)

#### C. Section informations compte connecté
- Affiche : "Connecté avec : email@outlook.com"
- Affiche : "Dernière synchronisation : ..." (si disponible)
- Icônes visuelles (CheckCircle2, Clock)
- Couleur email en bleu PILOTYS (`text-[#2563EB]`)

#### D. Bouton "Connecter un compte Outlook"
- Texte mis à jour pour être plus explicite
- Remplace "Connecter Outlook"

---

## 📝 Traductions ajoutées

### Français (`messages/fr.json`)
```json
{
  "integrations": {
    "outlook": {
      "connectAccount": "Connecter un compte Outlook",
      "connectedWith": "Connecté avec",
      "changeAccount": "Changer de compte Outlook",
      "changeAccountWarningTitle": "Changer de compte Outlook",
      "changeAccountWarningMessage": "Le compte Outlook actuellement connecté sera déconnecté.",
      "confirmChangeAccount": "Confirmer",
      "cancel": "Annuler",
      "disconnecting": "Déconnexion...",
      "disconnectError": "Erreur lors de la déconnexion"
    }
  }
}
```

### Anglais (`messages/en.json`)
```json
{
  "integrations": {
    "outlook": {
      "connectAccount": "Connect an Outlook account",
      "connectedWith": "Connected with",
      "changeAccount": "Change Outlook account",
      "changeAccountWarningTitle": "Change Outlook account",
      "changeAccountWarningMessage": "The currently connected Outlook account will be disconnected.",
      "confirmChangeAccount": "Confirm",
      "cancel": "Cancel",
      "disconnecting": "Disconnecting...",
      "disconnectError": "Error disconnecting"
    }
  }
}
```

---

## 🔐 Sécurité

### Règles appliquées

1. **Liaison userId** :
   - ✅ Tous les tokens sont liés à `userId` via `OutlookAccount.userId`
   - ✅ Vérification `getCurrentUserId()` sur tous les endpoints

2. **Pas de logs de tokens** :
   - ✅ Aucun token jamais loggé
   - ✅ Seulement métadonnées (email, dates, booléens)

3. **Gestion tokens invalides** :
   - ✅ Si token invalide lors du refresh → erreur gérée
   - ✅ L'utilisateur peut déconnecter et reconnecter

4. **Un seul compte par utilisateur** :
   - ✅ Contrainte DB : `userId @unique` dans `OutlookAccount`
   - ✅ Remplacement automatique si nouvelle connexion

---

## 📊 Flux utilisateur

### Connexion initiale

1. Utilisateur clique "Connecter un compte Outlook"
2. Redirection vers Microsoft OAuth
3. Consentement utilisateur
4. Callback → récupération email + tokens
5. Stockage en DB avec `email` et `connectedAt`
6. Redirection vers `/app/integrations/outlook?connected=1`
7. Affichage : "Connecté avec : email@outlook.com"

### Changement de compte

1. Utilisateur clique "Changer de compte Outlook"
2. Affichage du warning : "Le compte Outlook actuellement connecté sera déconnecté."
3. Utilisateur clique "Confirmer"
4. Appel `/api/integrations/outlook/disconnect`
5. Suppression tokens + état sync
6. Redirection automatique vers `/api/outlook/connect`
7. Nouveau flow OAuth
8. Nouveau compte connecté

### Synchronisation

1. Utilisateur clique "Synchroniser maintenant"
2. Appel `/api/integrations/outlook/sync`
3. Utilise le compte connecté (via `userId`)
4. Affichage des résultats (imported/updated/cancelled)
5. Mise à jour `lastSyncAt` dans `OutlookSyncState`

---

## 🧪 Tests

### Test connexion

1. Se connecter à PILOTYS
2. Aller sur `/app/integrations/outlook`
3. Cliquer "Connecter un compte Outlook"
4. Se connecter avec un compte Microsoft
5. Vérifier l'affichage : "Connecté avec : email@outlook.com"

### Test changement de compte

1. Avec un compte déjà connecté
2. Cliquer "Changer de compte Outlook"
3. Vérifier l'affichage du warning
4. Cliquer "Confirmer"
5. Vérifier la redirection vers OAuth
6. Se connecter avec un autre compte
7. Vérifier que le nouvel email s'affiche

### Test déconnexion

1. Avec un compte connecté
2. Cliquer "Changer de compte Outlook"
3. Cliquer "Confirmer"
4. Vérifier que le compte est déconnecté
5. Vérifier que l'état "Non connecté" s'affiche

---

## 📁 Fichiers modifiés

### Backend

| Fichier | Modifications |
|---------|--------------|
| `prisma/schema.prisma` | Ajout `email` et `connectedAt` dans `OutlookAccount` |
| `app/api/outlook/status/route.ts` | Retourne `email` et `lastSyncAt` |
| `app/api/outlook/callback/route.ts` | Récupère et stocke l'email Outlook |
| `app/api/outlook/connect/route.ts` | Vérifie connexion existante |
| `app/api/integrations/outlook/disconnect/route.ts` | **NOUVEAU** : Endpoint de déconnexion |

### Frontend

| Fichier | Modifications |
|---------|--------------|
| `app/app/integrations/outlook/page.tsx` | Ajout affichage email, bouton changement, warning |
| `messages/fr.json` | Ajout traductions FR |
| `messages/en.json` | Ajout traductions EN |

---

## ✅ Fonctionnalités implémentées

### Backend

- ✅ Stockage email Outlook dans `OutlookAccount.email`
- ✅ Stockage `connectedAt` pour traçabilité
- ✅ Endpoint `/api/outlook/status` retourne email et lastSyncAt
- ✅ Endpoint `/api/integrations/outlook/disconnect` pour déconnexion
- ✅ Gestion remplacement automatique (un seul compte par utilisateur)
- ✅ Récupération email via Graph API `/me`

### Frontend

- ✅ Affichage "Connecté avec : email@outlook.com"
- ✅ Affichage "Dernière synchronisation : ..."
- ✅ Bouton "Changer de compte Outlook"
- ✅ Warning avant changement de compte
- ✅ Bouton "Connecter un compte Outlook" (texte mis à jour)
- ✅ Gestion états de chargement (disconnecting)
- ✅ Messages d'erreur friendly

---

## 🚀 Prochaines étapes

1. **Redémarrer le serveur** pour régénérer le client Prisma
2. **Tester la connexion** avec un compte Outlook
3. **Tester le changement de compte** avec un autre compte
4. **Vérifier l'affichage** de l'email et de la dernière synchronisation

---

## 📝 Notes importantes

1. **Migration Prisma** : Appliquée (`20260104095732_add_outlook_email_and_connected_at`)
2. **Client Prisma** : Nécessite redémarrage du serveur pour régénération
3. **Un seul compte** : Un utilisateur ne peut avoir qu'un seul compte Outlook connecté
4. **Remplacement automatique** : Si nouvelle connexion, l'ancienne est remplacée automatiquement
5. **Email récupéré** : Via Graph API `/me` (champ `mail` ou `userPrincipalName`)

---

## 🔄 Compatibilité

- ✅ Compatible avec comptes professionnels (Azure AD)
- ✅ Compatible avec comptes Microsoft personnels (@outlook.com, @hotmail.com, @live.com)
- ✅ Gère les tokens chiffrés existants
- ✅ Gère les connexions existantes (mise à jour plutôt que création)

---

## ✅ Résultat final

- ✅ Un utilisateur peut connecter un compte Outlook
- ✅ L'email connecté est visible dans l'interface
- ✅ Un utilisateur peut déconnecter son compte
- ✅ Un utilisateur peut changer de compte (déconnexion + reconnexion)
- ✅ Un seul compte par utilisateur (remplacement automatique)
- ✅ UX simple et premium avec messages clairs

