# Corrections Effectuées - Erreur "too dynamic"

## ✅ Corrections Appliquées

### 1. Configuration Next.js (`next.config.ts`)
- ✅ Ajout de `serverExternalPackages` pour éviter que Turbopack bundle les packages serveur
- ✅ Packages externes : `chart.js`, `chartjs-node-canvas`, `canvas`, `jspdf`, `pptxgenjs`

### 2. Protection "server-only"
- ✅ Tous les modules serveur ont `import "server-only"` :
  - `lib/export/monthly/*`
  - `lib/export/charts/*`
  - `lib/export/utils/*`

### 3. Protection "use client"
- ✅ `lib/export/client/download.ts` : ajout de `"use client"`
- ✅ `lib/export/downloadFile.ts` : ajout de `"use client"` (ancien fichier, utilisé pour weekly)

### 4. Correction `process.env.NODE_ENV`
- ✅ Remplacement de `process.env.NODE_ENV` par `typeof window !== "undefined"` dans `downloadFile.ts`

---

## ⚠️ ACTION REQUISE : Redémarrer le Serveur Dev

**OBLIGATOIRE** après modification de `next.config.ts` :

```bash
# 1. Stop le serveur actuel (Ctrl+C dans le terminal)
# 2. Redémarrer
npm run dev
```

**Pourquoi ?** Next.js/Turbopack ne recharge pas automatiquement `next.config.ts`. Sans redémarrage, la configuration `serverExternalPackages` n'est pas prise en compte.

---

## 🔍 Vérifications Effectuées

- ✅ Aucun import dynamique dans `lib/export/**` (`npm run export:check`)
- ✅ Aucun import de modules serveur dans les fichiers client
- ✅ Tous les modules serveur protégés par `import "server-only"`
- ✅ Tous les modules client marqués avec `"use client"`

---

## 🐛 Si l'Erreur Persiste Après Redémarrage

### Test 1 : Vérifier que le serveur a bien redémarré
- Vérifier dans les logs que `serverExternalPackages` est pris en compte
- Vérifier que les routes API fonctionnent : `/api/export/monthly/pdf?month=2025-12&locale=fr`

### Test 2 : Contournement immédiat
```bash
next dev --no-turbo
```

Si ça fonctionne avec `--no-turbo`, le problème vient de Turbopack et la config devrait le résoudre après redémarrage.

### Test 3 : Vérifier les logs serveur
- Ouvrir le terminal où tourne `npm run dev`
- Vérifier s'il y a des erreurs d'import côté serveur
- L'erreur "too dynamic" côté client peut être causée par un crash serveur

---

## 📋 Checklist de Vérification

- [ ] `next.config.ts` contient `serverExternalPackages`
- [ ] Serveur dev **redémarré** après modification de `next.config.ts`
- [ ] `npm run export:check` passe sans erreur
- [ ] Tous les modules serveur ont `import "server-only"`
- [ ] Tous les modules client ont `"use client"`
- [ ] Aucun import de modules serveur dans les composants client

---

## 🎯 Résultat Attendu

Après redémarrage du serveur dev :
- ✅ Plus d'erreur "too dynamic"
- ✅ Les exports PDF/PPT fonctionnent
- ✅ Les logs `[EXPORT_OK]` apparaissent dans le terminal serveur

---

## 📝 Notes

L'erreur "too dynamic" dans le client peut être causée par :
1. Le serveur API crash à cause d'un import dynamique → retourne HTML → client essaie de parser → erreur
2. Turbopack essaie de bundler un package serveur qui ne devrait pas l'être → erreur

Les corrections ci-dessus adressent les deux causes.

