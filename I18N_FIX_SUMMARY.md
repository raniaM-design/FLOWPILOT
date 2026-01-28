# 🔧 Correctif Final - Erreur __dirname is not defined en Edge Runtime

## 📋 Problème Identifié

L'erreur `ReferenceError: __dirname is not defined` avec `MIDDLEWARE_INVOCATION_FAILED` en production venait de **`i18n/config.ts`** qui exportait `getRequestConfig` de `next-intl/server`.

Même si `createNextIntlPlugin` était supprimé de `next.config.ts`, **next-intl peut détecter automatiquement** un fichier qui exporte `getRequestConfig` et créer un middleware Edge pour l'exécuter. Ce middleware Edge tentait alors d'exécuter du code qui utilisait indirectement `__dirname` via les dépendances internes de `next-intl/server`.

## ✅ Solution Appliquée

### 1. **`i18n/config.ts`** - Suppression de `getRequestConfig`

**Avant** :
```typescript
import { getRequestConfig } from "next-intl/server";
// ...
export default getRequestConfig(async () => { ... });
```

**Après** :
```typescript
// Constantes uniquement (Edge-safe)
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
```

**Pourquoi** : En supprimant `getRequestConfig`, next-intl ne peut plus détecter ce fichier comme une config de middleware. Le fichier ne contient plus que des constantes Edge-safe.

### 2. **`i18n/request.ts`** - Déjà Edge-safe (créé précédemment)

Ce fichier contient les helpers pour charger la locale et les messages directement dans les Server Components, sans passer par un middleware. Il utilise uniquement :
- `cookies()` de `next/headers` ✅ Edge-safe
- `import()` dynamique de fichiers JSON ✅ Edge-safe

### 3. **`next.config.ts`** - Déjà corrigé (pas de plugin)

Le fichier ne contient plus `createNextIntlPlugin`, donc aucun middleware n'est créé automatiquement.

## 🎯 Résultat

- ✅ **Plus de middleware automatique** : next-intl ne peut plus créer de middleware Edge
- ✅ **Plus de `__dirname`** : Aucun code Node-only n'est exécuté en Edge Runtime
- ✅ **i18n fonctionne toujours** : Les pages utilisent `i18n/request.ts` pour charger les traductions
- ✅ **Build réussi** : `npm run build` passe sans erreur

## 📝 Fichiers Modifiés

| Fichier | Changement | Impact |
|---------|-----------|--------|
| `i18n/config.ts` | Suppression de `getRequestConfig` et `next-intl/server` | Empêche la création automatique d'un middleware Edge |
| `i18n/request.ts` | Déjà Edge-safe (créé précédemment) | Utilisé par les Server Components pour charger i18n |
| `next.config.ts` | Déjà corrigé (pas de plugin) | Aucun middleware créé automatiquement |

## 🧪 Plan de Test

### Tests Locaux

1. **Build** :
   ```bash
   npm run build
   ```
   ✅ Doit passer sans erreur

2. **Démarrer le serveur** :
   ```bash
   npm run start
   ```
   ✅ Le serveur doit démarrer sans erreur

3. **Tester les routes** :
   - Visiter `http://localhost:3000/` → ✅ Doit afficher la page d'accueil
   - Visiter `http://localhost:3000/login` → ✅ Doit afficher la page de login
   - Visiter `http://localhost:3000/app` → ✅ Doit rediriger vers `/login` si non authentifié

4. **Vérifier l'i18n** :
   - Les traductions doivent être chargées correctement
   - Le changement de langue via cookie doit fonctionner

### Tests en Production (Vercel)

1. **Déployer** :
   - Push les changements sur la branche principale
   - Vercel déploie automatiquement

2. **Vérifier les routes** :
   - Visiter `https://votre-domaine.vercel.app/` → ✅ Plus de 500
   - Visiter `https://votre-domaine.vercel.app/login` → ✅ Plus de 500

3. **Vérifier les logs Vercel** :
   - Ouvrir les Runtime Logs dans Vercel
   - ✅ Plus aucune erreur `MIDDLEWARE_INVOCATION_FAILED`
   - ✅ Plus aucune erreur `__dirname is not defined`

4. **Vérifier l'i18n** :
   - Les traductions doivent fonctionner comme avant
   - Le changement de langue doit fonctionner

## 🔍 Explication Technique

### Pourquoi `getRequestConfig` causait le problème ?

1. **Détection automatique** : next-intl scanne le projet pour trouver des fichiers qui exportent `getRequestConfig`
2. **Création de middleware** : Si trouvé, next-intl crée automatiquement un middleware Edge
3. **Exécution en Edge** : Ce middleware s'exécute en Edge Runtime où `__dirname` n'existe pas
4. **Dépendances internes** : `next-intl/server` peut avoir des dépendances internes qui utilisent `__dirname` ou d'autres APIs Node-only

### Pourquoi la solution fonctionne ?

1. **Pas de `getRequestConfig`** : next-intl ne peut plus détecter de config de middleware
2. **Pas de middleware automatique** : Aucun middleware Edge n'est créé
3. **Chargement direct** : Les Server Components chargent directement les traductions via `i18n/request.ts` (runtime Node.js)
4. **Edge-safe** : `i18n/request.ts` utilise uniquement des APIs Edge-safe (`cookies()`, `import()`)

## ✅ Checklist de Vérification

- [x] `npm run build` passe en local
- [x] `npm run start` fonctionne et on peut visiter `/` et `/login`
- [ ] En production (Vercel), `/` et `/login` ne retournent plus 500
- [ ] Plus aucune erreur `MIDDLEWARE_INVOCATION_FAILED` / `__dirname is not defined` dans les logs Vercel
- [ ] L'i18n fonctionne encore sur les pages concernées (traductions chargées correctement)

