# Configuration Serveur - Export Monthly

## Configuration Next.js

### `serverExternalPackages`

Les packages suivants sont configurés comme **externes** dans `next.config.ts` :

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

**Pourquoi ?**
- Ces packages contiennent des dépendances natives (`canvas`, `node-canvas`) qui ne peuvent pas être bundlées par Turbopack
- Ils doivent être résolus directement par Node.js au runtime
- Évite les erreurs "Cannot find module" ou "too dynamic" liées à Turbopack

**Résultat** : Next.js ne tentera pas de bundler ces packages, ils seront chargés directement par Node.js.

---

## Protection "server-only"

### Modules protégés

Tous les modules serveur sont marqués avec `import "server-only"` :

#### `lib/export/monthly/*`
- ✅ `data-builder.ts`
- ✅ `pdf-generator.ts`
- ✅ `ppt-generator.ts`

#### `lib/export/charts/*`
- ✅ `chart-renderer.ts`
- ✅ `activity-chart.ts`
- ✅ `action-status-chart.ts`
- ✅ `project-progress-chart.ts`

#### `lib/export/utils/*`
- ✅ `response-builder.ts`
- ✅ `file-validator.ts`
- ✅ `export-logger.ts`

**Effet** : Si un de ces modules est importé côté client, Next.js lancera une erreur explicite au build.

---

## Architecture Client/Serveur

### ✅ Modules Client (sécurisés)

**`lib/export/client/download.ts`**
- ✅ Utilise uniquement des APIs browser (`fetch`, `Blob`, `URL`)
- ✅ Aucune dépendance serveur
- ✅ Peut être importé dans les composants React

**Usage côté client** :
```typescript
import { downloadBinaryFromApi } from "@/lib/export/client/download";
```

### ❌ Modules Serveur (protégés)

**Tous les autres modules dans `lib/export/`**
- ❌ Ne doivent **jamais** être importés côté client
- ✅ Protégés par `import "server-only"`
- ✅ Utilisés uniquement dans les routes API (`app/api/export/*`)

---

## Vérification

### Script de vérification automatique

```bash
npm run export:check
```

Vérifie qu'aucun import dynamique n'existe dans `lib/export/**`.

### Test manuel

1. **Redémarrer le serveur dev** après modification de `next.config.ts` :
   ```bash
   # Stop le serveur actuel (Ctrl+C)
   npm run dev
   ```

2. **Tester l'export** :
   ```
   http://localhost:3000/api/export/monthly/pdf?month=2025-12&locale=fr
   ```

3. **Vérifier les logs** :
   - ✅ `[EXPORT_OK]` avec `ms` et `bytes`
   - ❌ Aucune erreur Turbopack

---

## Dépannage

### Si Turbopack échoue encore

**Option 1 : Contournement immédiat**
```bash
next dev --no-turbo
```
Permet de valider que le pipeline fonctionne, puis revenir sur le fix propre.

**Option 2 : Vérifier la configuration**
- Vérifier que `serverExternalPackages` est bien dans `experimental`
- Redémarrer le serveur dev après modification
- Vérifier que les packages sont bien installés dans `node_modules`

### Si un module serveur est importé côté client

**Erreur attendue** :
```
Error: Attempted to import a Server Module "..." from a Client Component.
```

**Solution** :
- Vérifier que le composant client n'importe que `lib/export/client/download.ts`
- Vérifier qu'aucun import indirect ne remonte vers les modules serveur

---

## Résumé

✅ **Configuration** : `serverExternalPackages` dans `next.config.ts`
✅ **Protection** : `import "server-only"` dans tous les modules serveur
✅ **Séparation** : Client importe uniquement `lib/export/client/download.ts`
✅ **Vérification** : Script `npm run export:check` pour les imports dynamiques

**Résultat** : Export stable, sans erreurs Turbopack, avec séparation stricte client/serveur.

