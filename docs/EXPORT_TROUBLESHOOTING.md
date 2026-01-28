# Dépannage Export Monthly - Erreur "too dynamic"

## Erreur : "Cannot find module as expression is too dynamic"

### ✅ Solution 1 : Redémarrer le serveur dev (OBLIGATOIRE)

Après modification de `next.config.ts`, **toujours redémarrer** :

```bash
# Stop le serveur (Ctrl+C)
npm run dev
```

**Pourquoi ?** Next.js/Turbopack ne recharge pas automatiquement `next.config.ts`.

---

### ✅ Solution 2 : Vérifier la configuration

Vérifier que `next.config.ts` contient bien :

```typescript
experimental: {
  serverExternalPackages: [
    "chart.js",
    "chartjs-node-canvas",
    "canvas",
    "jspdf",
    "pptxgenjs",
  ],
}
```

---

### ✅ Solution 3 : Contournement immédiat (test)

Si l'erreur persiste, tester sans Turbopack :

```bash
next dev --no-turbo
```

Si ça fonctionne sans `--no-turbo`, le problème vient de Turbopack et la config `serverExternalPackages` devrait le résoudre après redémarrage.

---

### ✅ Solution 4 : Vérifier les imports

Vérifier qu'aucun import dynamique n'existe :

```bash
npm run export:check
```

**Attendu** : `[OK] No dynamic imports in X export files`

---

### ✅ Solution 5 : Vérifier la séparation client/serveur

**Client** (`lib/export/client/download.ts`) :
- ✅ Doit avoir `"use client"` en haut
- ✅ Ne doit importer que des APIs browser (`fetch`, `Blob`, `URL`)

**Serveur** (`lib/export/monthly/*`, `lib/export/charts/*`) :
- ✅ Doit avoir `import "server-only"` en haut
- ✅ Ne doit jamais être importé côté client

---

## Checklist de vérification

- [ ] `next.config.ts` contient `serverExternalPackages`
- [ ] Serveur dev redémarré après modification de `next.config.ts`
- [ ] `npm run export:check` passe sans erreur
- [ ] Tous les modules serveur ont `import "server-only"`
- [ ] Le module client a `"use client"`
- [ ] Aucun import de modules serveur dans les composants client

---

## Si l'erreur persiste

1. **Vérifier les logs serveur** : L'erreur peut venir du serveur API qui crash
2. **Tester l'endpoint directement** :
   ```
   http://localhost:3000/api/export/monthly/pdf?month=2025-12&locale=fr
   ```
3. **Vérifier la console navigateur** : L'erreur peut venir du client qui reçoit une réponse HTML

---

## Erreurs courantes

### "Cannot find module as expression is too dynamic" dans le client

**Cause** : Le serveur API crash à cause d'un import dynamique, retourne HTML, et le client essaie de parser cette erreur.

**Solution** :
1. Vérifier les logs serveur pour l'erreur réelle
2. Redémarrer le serveur dev
3. Vérifier `serverExternalPackages` dans `next.config.ts`

### Le serveur retourne HTML au lieu de PDF/JSON

**Cause** : Crash serveur avant d'atteindre le handler API.

**Solution** :
1. Vérifier les imports dans `app/api/export/monthly/*/route.ts`
2. Vérifier que tous les imports sont statiques
3. Vérifier que `runtime = "nodejs"` est présent

---

## Commandes utiles

```bash
# Vérifier les imports dynamiques
npm run export:check

# Tester sans Turbopack
next dev --no-turbo

# Vérifier les logs serveur
# (dans le terminal où tourne `npm run dev`)
```

---

## Résumé

**L'erreur "too dynamic" est généralement résolue par** :
1. ✅ Configuration `serverExternalPackages` dans `next.config.ts`
2. ✅ Redémarrage du serveur dev
3. ✅ Vérification des imports statiques (`npm run export:check`)

Si ça ne fonctionne toujours pas, utiliser `--no-turbo` pour isoler le problème.

