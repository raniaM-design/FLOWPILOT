# Diagnostic des Routes Monthly Export

## Étape 1 : Tester l'endpoint health

Tester que le routing fonctionne :
```bash
curl http://localhost:3000/api/review/monthly/health
```

**Résultat attendu** : JSON `{"ok":true,"ts":...}`

Si vous recevez du HTML → problème de routing Next.js ou middleware.

---

## Étape 2 : Tester les routes minimales

Les routes PDF et PPT ont été hard reset pour isoler le problème.

### Test PDF
```bash
curl -X POST http://localhost:3000/api/review/monthly/pdf
```

**Résultat attendu** : `OK PDF ROUTE POST` (text/plain)

### Test PPT
```bash
curl -X POST http://localhost:3000/api/review/monthly/ppt
```

**Résultat attendu** : `OK PPT ROUTE POST` (text/plain)

---

## Étape 3 : Si les routes minimales fonctionnent

Si vous recevez `OK PDF ROUTE POST` / `OK PPT ROUTE POST`, alors le problème vient d'un import.

### Réintroduction progressive des imports

#### Étape 3.1 : Ajouter Prisma uniquement

Modifier `app/api/review/monthly/pdf/route.ts` :

```typescript
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Test simple Prisma
    const count = await prisma.user.count();
    return new Response(`OK PDF ROUTE - Prisma works, users: ${count}`, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Prisma failed", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

**Tester** : Si ça crash → problème avec Prisma/DB.

---

#### Étape 3.2 : Ajouter getCurrentUserId

```typescript
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    return new Response(`OK PDF ROUTE - Auth works, userId: ${userId || "null"}`, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Auth failed", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

**Tester** : Si ça crash → problème avec l'auth.

---

#### Étape 3.3 : Ajouter buildMonthlyReviewData

```typescript
import { buildMonthlyReviewData } from "@/lib/review/monthly/buildMonthlyReviewData";
import { getLocale } from "next-intl/server";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const locale = await getLocale();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const data = await buildMonthlyReviewData({ year, month, locale, userId });
    
    return new Response(`OK PDF ROUTE - Data built, projects: ${data.charts.projectProgress.length}`, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "buildMonthlyReviewData failed", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

**Tester** : Si ça crash → problème avec buildMonthlyReviewData ou ses dépendances.

---

#### Étape 3.4 : Ajouter chartFactory

```typescript
import {
  generateActivityChart,
  generateActionStatusChart,
  generateProjectProgressChart,
} from "@/lib/export/charts/chartFactory";

// Dans POST, après buildMonthlyReviewData :
try {
  const activityPng = await generateActivityChart(data.charts.activityByWeek);
  return new Response(`OK PDF ROUTE - Charts work, activity: ${activityPng.length} bytes`, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
} catch (err) {
  return new Response(
    JSON.stringify({ error: "Chart generation failed", details: err instanceof Error ? err.message : String(err) }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Tester** : Si ça crash → problème avec chartFactory/chartjs-node-canvas.

---

#### Étape 3.5 : Ajouter generateMonthlyReviewPdf

```typescript
import { generateMonthlyReviewPdf } from "@/lib/review/monthly/exportPdf";

// Dans POST, après charts :
const pdfBuffer = await generateMonthlyReviewPdf(data, charts);
return new Response(pdfBuffer, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="test.pdf"`,
  },
});
```

**Tester** : Si ça crash → problème avec jsPDF ou exportPdf.

---

## Étape 4 : Identifier le module coupable

Dès qu'une étape crash avec du HTML au lieu de JSON, le dernier import ajouté est le coupable.

### Modules suspects fréquents :
1. **chartjs-node-canvas** → nécessite canvas natif (peut manquer en prod)
2. **jsPDF** → peut avoir des problèmes avec certaines versions Node
3. **Prisma** → problème de connexion DB ou schema
4. **next-intl** → problème de locale/config

---

## Logs du middleware

Le middleware logue maintenant en dev :
- Quand une route `/api/review/monthly/*` est appelée
- Si l'utilisateur est authentifié ou non
- La méthode HTTP utilisée

Vérifier les logs serveur pour voir si le middleware intercepte correctement.

---

## Restauration

Une fois le problème identifié, restaurer la version complète depuis :
- `app/api/review/monthly/pdf/route.ts.backup`
- `app/api/review/monthly/ppt/route.ts.backup`

