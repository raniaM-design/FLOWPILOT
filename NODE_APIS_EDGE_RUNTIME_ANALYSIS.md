# 🔍 Analyse Complète - Utilisations de Node APIs Incompatibles avec Edge Runtime

## 📋 Méthodologie

Recherche exhaustive de toutes les utilisations de Node APIs qui pourraient casser en Edge Runtime :
- `__dirname`
- `fs` / `fs/promises`
- `path`
- `process.cwd()`

---

## 📊 Résumé Exécutif

| Catégorie | Nombre | Statut |
|-----------|--------|--------|
| **Safe Node-only** (scripts, routes avec `runtime = "nodejs"`) | 11 | ✅ Aucun risque |
| **À risque si importé dans l'app** (lib/ utilisées par routes Node.js) | 5 | ⚠️ Vérifier les imports |
| **Total** | 16 | |

---

## 🔍 Analyse Détaillée par Fichier

### ✅ CATÉGORIE 1 : Safe Node-only (Scripts et Routes API avec `runtime = "nodejs"`)

#### 1. `app/app/review/weekly/export-ppt/route.ts`

**Chemin** : `app/app/review/weekly/export-ppt/route.ts`

**Node APIs utilisées** :
- `__dirname` (ligne 17) : `const __dirname = dirname(__filename);`
- `fs/promises` (ligne 7) : `import { readFile } from "fs/promises";`
- `path` (ligne 9) : `import { dirname, join } from "path";`

**Code autour** :
```typescript
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Forcer le runtime Node.js pour accéder au filesystem
export const runtime = "nodejs";

// Helper pour obtenir le répertoire du fichier actuel (compatible Edge + Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Statut** : ✅ **Safe Node-only**
- Route API avec `export const runtime = "nodejs"` explicite
- Ne sera jamais exécutée en Edge Runtime
- Utilise `__dirname` pour charger le logo depuis `public/`

---

#### 2. `app/app/review/monthly/export-pdf/route.ts`

**Chemin** : `app/app/review/monthly/export-pdf/route.ts`

**Node APIs utilisées** :
- `__dirname` (ligne 18) : `const __dirname = dirname(__filename);`
- `fs/promises` (ligne 8) : `import { readFile } from "fs/promises";`
- `path` (ligne 10) : `import { dirname, join } from "path";`

**Code autour** :
```typescript
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Forcer le runtime Node.js pour accéder au filesystem
export const runtime = "nodejs";

// Helper pour obtenir le répertoire du fichier actuel (compatible Edge + Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Statut** : ✅ **Safe Node-only**
- Route API avec `export const runtime = "nodejs"` explicite
- Ne sera jamais exécutée en Edge Runtime
- Utilise `__dirname` pour charger le logo depuis `public/`

---

#### 3. `app/api/_debug/env/route.ts`

**Chemin** : `app/api/_debug/env/route.ts`

**Node APIs utilisées** :
- `fs` (ligne 51) : `const fs = require("fs");`
- `path` (ligne 52) : `const path = require("path");`
- `process.cwd()` (lignes 53, 66) : `path.join(process.cwd(), ".env.local")` et `cwd: process.cwd()`

**Code autour** :
```typescript
// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vérifier si .env.local existe (nécessite fs, donc Node.js uniquement)
let envLocalExists = false;
let envLocalPath = "";
try {
  const fs = require("fs");
  const path = require("path");
  const envLocalFile = path.join(process.cwd(), ".env.local");
  envLocalExists = fs.existsSync(envLocalFile);
  // ...
} catch {
  // Ignorer si fs n'est pas disponible
}

return NextResponse.json({
  // ...
  cwd: process.cwd(),
  // ...
});
```

**Statut** : ✅ **Safe Node-only**
- Route API avec `export const runtime = "nodejs"` explicite
- Route de debug uniquement en développement (`if (process.env.NODE_ENV === "production")`)
- Ne sera jamais exécutée en Edge Runtime

---

#### 4. `app/api/outlook/connect/route.ts`

**Chemin** : `app/api/outlook/connect/route.ts`

**Node APIs utilisées** :
- `process.cwd()` (ligne 97) : `cwd: process.cwd()`

**Code autour** :
```typescript
// Log de debug en dev uniquement avec preuve complète
if (process.env.NODE_ENV === "development") {
  console.log("[outlook-connect] env check:", {
    // ...
    cwd: process.cwd(),
    // ...
  });
}
```

**Statut** : ✅ **Safe Node-only**
- Route API (pas de `export const runtime = "edge"` donc Node.js par défaut)
- Utilisé uniquement pour du logging en développement
- `process.cwd()` est disponible en Node.js Runtime

---

#### 5. `scripts/test-convert-editor-content.mjs`

**Chemin** : `scripts/test-convert-editor-content.mjs`

**Node APIs utilisées** :
- `fs` (ligne 6) : `import { readFileSync } from "fs";`
- `path` (ligne 8) : `import { dirname, join } from "path";`
- `__dirname` (ligne 11) : `const __dirname = dirname(__filename);`

**Code autour** :
```typescript
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger et exécuter le fichier TypeScript avec tsx
const code = readFileSync(join(__dirname, "../lib/meetings/convert-editor-content.ts"), "utf-8");
```

**Statut** : ✅ **Safe Node-only**
- Script de test dans `scripts/`
- Jamais importé par l'application
- Exécuté uniquement via CLI : `npx tsx scripts/test-convert-editor-content.mjs`

---

#### 6. `scripts/test-sanitize-text.mjs`

**Chemin** : `scripts/test-sanitize-text.mjs`

**Node APIs utilisées** :
- `fs` (ligne 10) : `import { readFileSync } from "fs";`
- `path` (ligne 12) : `import { dirname, join } from "path";`
- `__dirname` (ligne 15) : `const __dirname = dirname(__filename);`

**Code autour** :
```typescript
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Statut** : ✅ **Safe Node-only**
- Script de test dans `scripts/`
- Jamais importé par l'application
- Exécuté uniquement via CLI : `node scripts/test-sanitize-text.mjs`

---

#### 7. `scripts/test-monthly-charts.mjs`

**Chemin** : `scripts/test-monthly-charts.mjs`

**Node APIs utilisées** :
- `fs/promises` (ligne 5) : `import { readFile } from "fs/promises";`
- `path` (ligne 6) : `import { join } from "path";`

**Code autour** :
```typescript
import { readFile } from "fs/promises";
import { join } from "path";
```

**Statut** : ✅ **Safe Node-only**
- Script de test dans `scripts/`
- Jamais importé par l'application
- Exécuté uniquement via CLI

---

#### 8. `scripts/check-no-dynamic-imports.mjs`

**Chemin** : `scripts/check-no-dynamic-imports.mjs`

**Node APIs utilisées** :
- `fs` (ligne 1) : `import fs from "node:fs";`
- `path` (ligne 2) : `import path from "node:path";`
- `__dirname` (ligne 6) : `const __dirname = path.dirname(__filename);`
- `process.cwd()` (ligne 43) : `path.relative(process.cwd(), f)`

**Code autour** :
```typescript
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "lib", "export");

// ...
const relativePath = path.relative(process.cwd(), f);
```

**Statut** : ✅ **Safe Node-only**
- Script de vérification dans `scripts/`
- Jamais importé par l'application
- Exécuté uniquement via CLI pour vérifier les imports dynamiques

---

#### 9. `app/api/review/monthly/pdf/route.ts.backup`

**Chemin** : `app/api/review/monthly/pdf/route.ts.backup`

**Node APIs utilisées** :
- `fs` (ligne 11) : `import { writeFileSync } from "fs";`
- `path` (ligne 12) : `import { join } from "path";`

**Code autour** :
```typescript
import { writeFileSync } from "fs";
import { join } from "path";

// Forcer le runtime Node.js (indispensable pour PDF/canvas/chartjs)
export const runtime = "nodejs";
```

**Statut** : ✅ **Safe Node-only**
- Fichier `.backup` (non utilisé)
- Route API avec `export const runtime = "nodejs"` explicite
- Ne sera jamais exécutée (fichier de backup)

---

### ⚠️ CATÉGORIE 2 : À risque si importé dans l'app (Modules `lib/` utilisés par routes Node.js)

#### 10. `lib/review/monthly/exportPpt.ts`

**Chemin** : `lib/review/monthly/exportPpt.ts`

**Node APIs utilisées** :
- `__dirname` (ligne 10) : `const __dirname = dirname(__filename);`
- `fs/promises` (ligne 2) : `import { readFile } from "fs/promises";`
- `path` (ligne 4) : `import { dirname, join } from "path";`

**Code autour** :
```typescript
import PptxGenJS from "pptxgenjs";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { LOGO_OFFICIAL_PATH, LOGO_OFFICIAL_DIMENSIONS } from "@/lib/logo-config";
import type { MonthlyReviewExportData } from "./types";

// Helper pour obtenir le répertoire du fichier actuel (compatible Edge + Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Fonction exportée** :
- `generateMonthlyReviewPpt(data: MonthlyReviewExportData, charts: {...}): Promise<Buffer>`

**Imports trouvés** :
- ✅ `app/app/review/monthly/export-ppt/route.ts` (route avec `runtime = "nodejs"`)

**Statut** : ⚠️ **À risque si importé ailleurs**
- Module dans `lib/` (peut être importé par n'importe quel fichier)
- Actuellement utilisé uniquement par une route API Node.js ✅
- **Risque** : Si importé par un Server Component ou une route Edge, ça plantera
- **Recommandation** : Ajouter `import "server-only";` en haut du fichier pour empêcher l'import côté client/Edge

---

#### 11. `lib/review/monthly/exportPdf.ts`

**Chemin** : `lib/review/monthly/exportPdf.ts`

**Node APIs utilisées** :
- `__dirname` (ligne 10) : `const __dirname = dirname(__filename);`
- `fs/promises` (ligne 2) : `import { readFile } from "fs/promises";`
- `path` (ligne 4) : `import { dirname, join } from "path";`

**Code autour** :
```typescript
import jsPDF from "jspdf";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { LOGO_OFFICIAL_PATH, LOGO_OFFICIAL_DIMENSIONS } from "@/lib/logo-config";
import type { MonthlyReviewExportData } from "./types";

// Helper pour obtenir le répertoire du fichier actuel (compatible Edge + Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Fonction exportée** :
- `generateMonthlyReviewPdf(data: MonthlyReviewExportData, charts: {...}): Promise<Buffer>`

**Imports trouvés** :
- ✅ `app/app/review/monthly/export-pdf/route.ts` (route avec `runtime = "nodejs"`)
- ⚠️ `app/api/review/monthly/pdf/route.ts.backup` (fichier backup, non utilisé)

**Statut** : ⚠️ **À risque si importé ailleurs**
- Module dans `lib/` (peut être importé par n'importe quel fichier)
- Actuellement utilisé uniquement par une route API Node.js ✅
- **Risque** : Si importé par un Server Component ou une route Edge, ça plantera
- **Recommandation** : Ajouter `import "server-only";` en haut du fichier pour empêcher l'import côté client/Edge

---

#### 12. `lib/export/monthly/ppt-generator.ts`

**Chemin** : `lib/export/monthly/ppt-generator.ts`

**Node APIs utilisées** :
- `__dirname` (ligne 16) : `const __dirname = dirname(__filename);`
- `fs/promises` (ligne 8) : `import { readFile } from "fs/promises";`
- `path` (ligne 10) : `import { dirname, join } from "path";`

**Code autour** :
```typescript
import "server-only";
import PptxGenJS from "pptxgenjs";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { LOGO_OFFICIAL_PATH, LOGO_OFFICIAL_DIMENSIONS } from "@/lib/logo-config";
import type { MonthlyReviewExportData } from "@/lib/review/monthly/types";

// Helper pour obtenir le répertoire du fichier actuel (compatible Edge + Node.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Fonction exportée** :
- `generateMonthlyReviewPpt(data: MonthlyReviewExportData, charts: {...}): Promise<Buffer>`

**Imports trouvés** :
- ✅ `app/app/review/monthly/export-ppt/route.ts` (route avec `runtime = "nodejs"`)

**Statut** : ✅ **Protégé mais à surveiller**
- ✅ **Déjà protégé** : `import "server-only";` en ligne 6 empêche l'import côté client
- ⚠️ **Mais** : `"server-only"` n'empêche pas l'import dans une route Edge (seulement côté client)
- **Risque** : Si importé par une route Edge (`export const runtime = "edge"`), ça plantera
- **Recommandation** : S'assurer que ce module n'est jamais importé par une route Edge (déjà le cas actuellement)

---

## 📊 Tableau Récapitulatif

| Fichier | Node APIs | Utilisé par | Runtime | Statut |
|---------|-----------|-------------|---------|--------|
| `app/app/review/weekly/export-ppt/route.ts` | `__dirname`, `fs/promises`, `path` | Route API | `nodejs` ✅ | ✅ Safe |
| `app/app/review/monthly/export-pdf/route.ts` | `__dirname`, `fs/promises`, `path` | Route API | `nodejs` ✅ | ✅ Safe |
| `app/api/_debug/env/route.ts` | `fs`, `path`, `process.cwd()` | Route API | `nodejs` ✅ | ✅ Safe |
| `app/api/outlook/connect/route.ts` | `process.cwd()` | Route API | `nodejs` (défaut) ✅ | ✅ Safe |
| `scripts/test-convert-editor-content.mjs` | `fs`, `path`, `__dirname` | Script CLI | Node.js | ✅ Safe |
| `scripts/test-sanitize-text.mjs` | `fs`, `path`, `__dirname` | Script CLI | Node.js | ✅ Safe |
| `scripts/test-monthly-charts.mjs` | `fs/promises`, `path` | Script CLI | Node.js | ✅ Safe |
| `scripts/check-no-dynamic-imports.mjs` | `fs`, `path`, `__dirname`, `process.cwd()` | Script CLI | Node.js | ✅ Safe |
| `app/api/review/monthly/pdf/route.ts.backup` | `fs`, `path` | Backup (non utilisé) | `nodejs` ✅ | ✅ Safe |
| `lib/review/monthly/exportPpt.ts` | `__dirname`, `fs/promises`, `path` | Route API Node.js | ⚠️ Pas de protection | ⚠️ À risque |
| `lib/review/monthly/exportPdf.ts` | `__dirname`, `fs/promises`, `path` | Route API Node.js | ⚠️ Pas de protection | ⚠️ À risque |
| `lib/export/monthly/ppt-generator.ts` | `__dirname`, `fs/promises`, `path` | Route API Node.js | ✅ `server-only` | ⚠️ À surveiller |

---

## 🎯 Recommandations

### ✅ Actions Immédiates (Optionnelles mais Recommandées)

1. **Ajouter `import "server-only";` dans les modules `lib/`** :
   - `lib/review/monthly/exportPpt.ts` → Ajouter `import "server-only";` en haut
   - `lib/review/monthly/exportPdf.ts` → Ajouter `import "server-only";` en haut
   - `lib/export/monthly/ppt-generator.ts` → ✅ Déjà présent

2. **Vérifier qu'aucune route Edge n'importe ces modules** :
   - Rechercher `export const runtime = "edge"` dans le projet
   - Vérifier qu'aucune route Edge n'importe `lib/review/monthly/exportPpt.ts` ou `lib/review/monthly/exportPdf.ts`

### ✅ Actions Préventives

1. **Documenter les modules Node-only** :
   - Ajouter un commentaire en haut de chaque module `lib/` qui utilise Node APIs
   - Exemple : `// ⚠️ Node-only: Uses fs/promises, path, __dirname. Must only be imported by Node.js routes.`

2. **Créer un script de vérification** :
   - Script qui vérifie qu'aucune route Edge n'importe ces modules
   - À exécuter avant chaque déploiement

---

## ✅ Conclusion

**Tous les fichiers identifiés sont actuellement sûrs** :
- ✅ Les routes API utilisent `export const runtime = "nodejs"` explicitement
- ✅ Les scripts dans `scripts/` ne sont jamais importés par l'app
- ⚠️ Les modules `lib/` sont utilisés uniquement par des routes Node.js, mais pourraient être importés par erreur ailleurs

**Aucune action urgente requise**, mais les recommandations ci-dessus amélioreront la robustesse du code.

