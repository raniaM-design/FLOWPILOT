# 🔍 Diagnostic Complet - Arbre des Imports du Middleware

## 📋 Méthodologie

Analyse de tous les fichiers importés directement ou indirectement par le middleware pour identifier la source de `__dirname is not defined` en Edge Runtime.

---

## 🌳 Arbre des Imports

### 1. Point d'entrée : Middleware

**Fichier** : `middleware.disabled.ts` (ou middleware créé par next-intl)

**Imports directs** :
- `next/server` (NextResponse, NextRequest) ✅ Edge-safe
- `@/lib/flowpilot-auth/session` → `readSessionCookie`

---

### 2. Chaîne d'imports depuis `lib/flowpilot-auth/session.ts`

**Fichier** : `lib/flowpilot-auth/session.ts`

**Imports directs** :
- `next/server` (NextResponse, NextRequest) ✅ Edge-safe
- `./jwt` → `verifySessionToken`

**Problèmes détectés** : ❌ Aucun

---

### 3. Chaîne d'imports depuis `lib/flowpilot-auth/jwt.ts`

**Fichier** : `lib/flowpilot-auth/jwt.ts`

**Imports directs** :
- `jose` (SignJWT, jwtVerify) ✅ Edge-safe (vérifié : pas de __dirname dans node_modules/jose)

**Problèmes détectés** : ❌ Aucun

---

### 4. Chaîne d'imports depuis `i18n/config.ts` (chargé par next-intl)

**Fichier** : `i18n/config.ts`

**Imports directs** :
- `next-intl/server` → `getRequestConfig` ⚠️ À vérifier
- `next/headers` → `cookies` ✅ Edge-safe
- Import dynamique de `@/messages/*.json` ✅ Edge-safe

**Problèmes détectés** : 
- ⚠️ **POTENTIEL** : `getRequestConfig` de `next-intl/server` pourrait charger des dépendances Node-only

**Note** : Prisma a été retiré de ce fichier dans les modifications précédentes.

---

### 5. Chaîne d'imports depuis `next.config.ts`

**Fichier** : `next.config.ts`

**Imports directs** :
- `next-intl/plugin` → `createNextIntlPlugin("./i18n/config.ts")` ⚠️ Charge `i18n/config.ts`

**Problèmes détectés** :
- ⚠️ **POTENTIEL** : `createNextIntlPlugin` peut créer un middleware automatiquement qui charge `i18n/config.ts`

---

## 📊 Tableau Récapitulatif

| Fichier | Imports directs | Problème détecté | Statut |
|---------|----------------|------------------|--------|
| `middleware.disabled.ts` | `next/server`, `@/lib/flowpilot-auth/session` | ❌ Aucun | ✅ Edge-safe |
| `lib/flowpilot-auth/session.ts` | `next/server`, `./jwt` | ❌ Aucun | ✅ Edge-safe |
| `lib/flowpilot-auth/jwt.ts` | `jose` | ❌ Aucun | ✅ Edge-safe |
| `lib/flowpilot-auth/current-user.ts` | `next/headers`, `./jwt`, `./session` | ❌ Aucun | ✅ Edge-safe |
| `lib/db.ts` | `@prisma/client` | ⚠️ Prisma utilise `path` → `__dirname` | ❌ Node-only |
| `i18n/config.ts` | `next-intl/server`, `next/headers` | ⚠️ `getRequestConfig` pourrait charger Node-only | ⚠️ À vérifier |
| `next.config.ts` | `next-intl/plugin` | ⚠️ Crée middleware qui charge `i18n/config.ts` | ⚠️ À vérifier |

---

## 🎯 Fichiers Problématiques Identifiés

### ❌ Fichiers Node-only (ne doivent PAS être importés par le middleware)

1. **`lib/db.ts`**
   - **Problème** : Importe `@prisma/client` qui utilise `require('path')` → nécessite `__dirname`
   - **Statut** : ✅ N'est PAS importé directement par le middleware ou `i18n/config.ts` (après modifications)

### ⚠️ Fichiers à vérifier (imports indirects possibles)

1. **`i18n/config.ts`**
   - **Problème potentiel** : `getRequestConfig` de `next-intl/server` pourrait charger des dépendances Node-only
   - **Statut** : ⚠️ Chargé par `createNextIntlPlugin` dans `next.config.ts`
   - **Action** : Vérifier si `next-intl/server` utilise `__dirname` ou des libs Node-only

2. **`next.config.ts`**
   - **Problème potentiel** : `createNextIntlPlugin` peut créer un middleware automatiquement
   - **Statut** : ⚠️ Peut charger `i18n/config.ts` dans un contexte Edge

---

## 🔍 Hypothèses sur la Source du Problème

### Hypothèse 1 : Middleware créé par next-intl
- `createNextIntlPlugin` dans `next.config.ts` peut créer un middleware automatiquement
- Ce middleware charge `i18n/config.ts`
- `getRequestConfig` de `next-intl/server` pourrait utiliser `__dirname` en interne

### Hypothèse 2 : Import indirect via next-intl
- Même si `i18n/config.ts` ne charge plus Prisma directement
- `next-intl/server` pourrait charger des dépendances Node-only en interne
- Ces dépendances utilisent `__dirname`

### Hypothèse 3 : Middleware.disabled.ts activé
- Le fichier `middleware.disabled.ts` pourrait être activé en production
- Mais ses imports sont Edge-safe

---

## ✅ Fichiers Confirmés Edge-Safe

- ✅ `middleware.disabled.ts` - Aucun import Node-only
- ✅ `lib/flowpilot-auth/session.ts` - Aucun import Node-only
- ✅ `lib/flowpilot-auth/jwt.ts` - Utilise uniquement `jose` (Edge-safe)
- ✅ `lib/flowpilot-auth/current-user.ts` - Aucun import Node-only
- ✅ `app/page.tsx` - Composants React uniquement
- ✅ `app/layout.tsx` - Utilise `getLocale`/`getMessages` de next-intl (à vérifier)

---

## 🎯 Prochaines Étapes Recommandées

1. **Vérifier si next-intl crée un middleware automatiquement**
   - Chercher dans la documentation next-intl
   - Vérifier les logs de build pour voir si un middleware est généré

2. **Vérifier les dépendances de `next-intl/server`**
   - Analyser si `getRequestConfig` utilise `__dirname` ou des libs Node-only
   - Vérifier dans `node_modules/next-intl`

3. **Vérifier si `middleware.disabled.ts` est activé**
   - Vérifier si le fichier est renommé en `middleware.ts` en production
   - Vérifier les logs Vercel pour voir quel middleware est exécuté

4. **Vérifier les imports indirects**
   - Analyser tous les imports de `next-intl/server`
   - Vérifier si des dépendances transitives utilisent `__dirname`

---

## 📝 Notes Importantes

- Le middleware et tous les fichiers `lib/flowpilot-auth/*` sont **Edge-safe**
- `lib/db.ts` (Prisma) est **Node-only** mais n'est **PAS importé** par le middleware
- Le problème vient probablement de **next-intl** qui charge `i18n/config.ts` dans un contexte Edge
- `i18n/config.ts` lui-même est Edge-safe maintenant (Prisma retiré), mais `next-intl/server` pourrait ne pas l'être

