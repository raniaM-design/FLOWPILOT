# Architecture d'Export PDF & PPT - PILOTYS

## Vision Stratégique

Le système d'export PILOTYS génère des documents **executive-ready** pour des dirigeants et boards. Les exports doivent être :
- **Fiables** : jamais de crash, jamais de fichier corrompu
- **Professionnels** : design cohérent, lisible, imprimable
- **Maintenables** : code simple, testable, évolutif
- **Performants** : génération rapide (< 3s), pas de blocage UI

---

## Principes Fondamentaux

### 1. Séparation Stricte UI / Export

```
┌─────────────────┐         ┌──────────────────┐
│   UI React      │         │   Export Node.js │
│   (Browser)     │  ────>  │   (Server)       │
│                 │  Data   │                  │
│ - Recharts      │         │ - Chart.js       │
│ - shadcn/ui     │         │ - jsPDF          │
│ - Tailwind      │         │ - PptxGenJS      │
└─────────────────┘         └──────────────────┘
```

**Règle absolue** : Aucun code React, Recharts, ou composant UI ne doit être importé côté export.

### 2. Imports Statiques Uniquement

**❌ INTERDIT** :
```typescript
const module = await import(`@/lib/export/${type}/generator`);
const chart = await import(`./charts/${chartType}`);
```

**✅ CORRECT** :
```typescript
import { generateMonthlyPdf } from "@/lib/export/monthly/pdf-generator";
import { generateActivityChart } from "@/lib/export/charts/activity-chart";
```

**Pourquoi** : Turbopack exige des chemins statiques. Pas de compromis.

### 3. Réponses Binaires Pures

Les endpoints retournent **uniquement** :
- `Buffer` binaire (PDF ou PPTX)
- Headers HTTP corrects
- Jamais de JSON sauf en cas d'erreur explicite
- Jamais de HTML, jamais de page Next.js

### 4. Architecture en Couches

```
┌─────────────────────────────────────────┐
│  API Routes (app/api/export/...)        │  ← Point d'entrée HTTP
│  - Validation                           │
│  - Auth                                 │
│  - Error handling                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Export Services (lib/export/...)       │  ← Logique métier
│  - PDF Generator                        │
│  - PPT Generator                        │
│  - Data Builder                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Chart Engine (lib/export/charts/...)   │  ← Génération graphes
│  - Activity Chart                       │
│  - Status Chart                         │
│  - Progress Chart                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Data Layer (lib/review/monthly/...)    │  ← Données brutes
│  - buildMonthlyReviewData               │
│  - Types                                │
└─────────────────────────────────────────┘
```

---

## Structure de Dossiers

```
lib/
├── export/                          # 🆕 Module d'export dédié
│   ├── monthly/                     # Exports mensuels
│   │   ├── pdf-generator.ts        # Générateur PDF mensuel
│   │   ├── ppt-generator.ts        # Générateur PPT mensuel
│   │   └── data-builder.ts         # Builder de données pour export
│   │
│   ├── charts/                      # 🆕 Moteur de génération de graphes
│   │   ├── activity-chart.ts       # Graphique activité par semaine
│   │   ├── status-chart.ts         # Graphique statut des actions
│   │   ├── progress-chart.ts       # Graphique avancement projets
│   │   └── chart-config.ts         # Configuration commune (couleurs, tailles)
│   │
│   ├── design/                      # 🆕 Système de design pour exports
│   │   ├── pdf-theme.ts            # Thème PDF (couleurs, polices, espacements)
│   │   ├── ppt-theme.ts            # Thème PPT (couleurs, layouts)
│   │   └── layout.ts                # Helpers de mise en page
│   │
│   └── utils/                       # 🆕 Utilitaires export
│       ├── file-validator.ts       # Validation signatures binaires
│       └── response-builder.ts     # Construction réponses HTTP

app/
└── api/
    └── export/                      # 🆕 Endpoints d'export propres
        └── monthly/
            ├── pdf/
            │   └── route.ts        # POST /api/export/monthly/pdf
            └── ppt/
                └── route.ts        # POST /api/export/monthly/ppt
```

---

## Choix Techniques

### PDF : jsPDF

**Pourquoi jsPDF** :
- ✅ Bibliothèque mature et stable
- ✅ Pas de dépendance DOM/browser
- ✅ Support images PNG/SVG
- ✅ Contrôle fin de la mise en page
- ✅ Léger (~200KB)

**Alternatives considérées** :
- ❌ pdfkit : API verbeuse
- ❌ pdfmake : Templates JSON peu flexibles
- ❌ Puppeteer/Playwright : Trop lourd, dépendance browser

### PPT : PptxGenJS

**Pourquoi PptxGenJS** :
- ✅ Bibliothèque Node.js native
- ✅ API simple et intuitive
- ✅ Support images base64
- ✅ Contrôle des layouts et styles
- ✅ Génère des PPTX standards (compatibles PowerPoint)

**Alternatives considérées** :
- ❌ officegen : API obsolète
- ❌ node-pptx : Moins de fonctionnalités

### Charts : Chart.js + chartjs-node-canvas

**Pourquoi Chart.js** :
- ✅ Bibliothèque de référence pour graphes
- ✅ chartjs-node-canvas permet le rendu serveur
- ✅ Pas de dépendance DOM
- ✅ Styles personnalisables
- ✅ Export PNG haute qualité

**Alternatives considérées** :
- ❌ Recharts : Nécessite React (exclu)
- ❌ D3.js : Trop bas niveau, complexité inutile
- ❌ SVG pur : Plus de code, moins flexible

---

## Design System pour Exports

### Palette de Couleurs PILOTYS

```typescript
export const PILOTYS_COLORS = {
  // Primary
  primary: "#2563EB",      // blue-600
  primaryLight: "#3B82F6", // blue-500
  
  // Status
  success: "#22C55E",      // green-500
  warning: "#F59E0B",       // amber-500
  error: "#EF4444",        // red-500
  info: "#3B82F6",         // blue-500
  
  // Neutral
  text: "#1F2937",         // gray-800
  textLight: "#6B7280",    // gray-500
  border: "#E5E7EB",       // gray-200
  background: "#FFFFFF",   // white
  
  // Charts
  chartBlue: "#3B82F6",
  chartGreen: "#22C55E",
  chartPurple: "#8B5CF6",
  chartOrange: "#F59E0B",
  chartRed: "#EF4444",
  chartGray: "#9CA3AF",
};
```

### Typographie

- **Titres principaux** : Helvetica Bold, 24pt
- **Sous-titres** : Helvetica Bold, 16pt
- **Corps** : Helvetica Regular, 11pt
- **Métadonnées** : Helvetica Regular, 9pt, gris

### Espacements

- **Marges page** : 20mm
- **Espacement sections** : 15mm
- **Espacement éléments** : 8mm
- **Padding KPI cards** : 5mm

---

## Architecture Détaillée

### 1. API Routes (`app/api/export/monthly/pdf/route.ts`)

**Responsabilités** :
- Validation des paramètres (year, month)
- Authentification utilisateur
- Appel du générateur PDF
- Retour binaire avec headers corrects
- Gestion d'erreurs (toujours JSON en cas d'erreur)

**Structure** :
```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Params
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear());
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1);
    
    // 3. Génération
    const pdfBuffer = await generateMonthlyPdf({ userId, year, month });
    
    // 4. Validation signature
    if (!isValidPdfBuffer(pdfBuffer)) {
      throw new Error("Invalid PDF buffer generated");
    }
    
    // 5. Réponse binaire
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="PILOTYS-Monthly-Review-${year}-${String(month).padStart(2, "0")}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Toujours JSON en cas d'erreur
    return NextResponse.json(
      { error: "Export failed", details: error.message },
      { status: 500 }
    );
  }
}
```

### 2. PDF Generator (`lib/export/monthly/pdf-generator.ts`)

**Responsabilités** :
- Construction du document PDF
- Mise en page des sections
- Intégration des graphes
- Application du design system

**Structure** :
```typescript
import jsPDF from "jspdf";
import { buildMonthlyExportData } from "./data-builder";
import { generateActivityChart } from "@/lib/export/charts/activity-chart";
import { generateStatusChart } from "@/lib/export/charts/status-chart";
import { generateProgressChart } from "@/lib/export/charts/progress-chart";
import { PDF_THEME } from "@/lib/export/design/pdf-theme";

export async function generateMonthlyPdf(params: {
  userId: string;
  year: number;
  month: number;
}): Promise<Buffer> {
  // 1. Charger les données
  const data = await buildMonthlyExportData(params);
  
  // 2. Générer les graphes
  const charts = {
    activity: await generateActivityChart(data.charts.activityByWeek),
    status: await generateStatusChart(data.charts.actionStatus),
    progress: await generateProgressChart(data.charts.projectProgress),
  };
  
  // 3. Construire le PDF
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  // 4. Remplir le document (voir section suivante)
  renderPdfContent(pdf, data, charts);
  
  // 5. Retourner le buffer
  return Buffer.from(pdf.output("arraybuffer"));
}

function renderPdfContent(
  pdf: jsPDF,
  data: MonthlyExportData,
  charts: ChartBuffers
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = PDF_THEME.margins.page;
  let yPos = margin;
  
  // Cover page
  renderCoverPage(pdf, data, margin, pageWidth);
  pdf.addPage();
  
  // Executive Summary
  yPos = renderExecutiveSummary(pdf, data, margin, yPos, pageWidth);
  
  // KPIs
  yPos = renderKpis(pdf, data, margin, yPos, pageWidth);
  
  // Charts
  pdf.addPage();
  yPos = renderCharts(pdf, charts, margin, yPos, pageWidth, pageHeight);
  
  // Key Decisions
  pdf.addPage();
  yPos = renderKeyDecisions(pdf, data, margin, yPos, pageWidth);
  
  // Next Month Focus
  yPos = renderNextMonthFocus(pdf, data, margin, yPos, pageWidth);
  
  // Footer sur toutes les pages
  addFooter(pdf, pageWidth, pageHeight);
}
```

### 3. Chart Engine (`lib/export/charts/activity-chart.ts`)

**Responsabilités** :
- Génération de graphes PNG haute qualité
- Configuration Chart.js serveur
- Styles cohérents PILOTYS

**Structure** :
```typescript
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { CHART_CONFIG } from "./chart-config";

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: CHART_CONFIG.width,
  height: CHART_CONFIG.height,
  backgroundColour: "white",
});

export async function generateActivityChart(
  data: ActivityByWeekData[]
): Promise<Buffer> {
  const configuration = {
    type: "bar" as const,
    data: {
      labels: data.map((w) => w.weekLabel),
      datasets: [
        {
          label: "Réunions",
          data: data.map((w) => w.meetings),
          backgroundColor: CHART_CONFIG.colors.meetings,
        },
        {
          label: "Actions",
          data: data.map((w) => w.actions),
          backgroundColor: CHART_CONFIG.colors.actions,
        },
        {
          label: "Décisions",
          data: data.map((w) => w.decisions),
          backgroundColor: CHART_CONFIG.colors.decisions,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: "top" as const },
        title: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  };
  
  return await chartJSNodeCanvas.renderToBuffer(configuration);
}
```

### 4. Data Builder (`lib/export/monthly/data-builder.ts`)

**Responsabilités** :
- Transformation des données UI → données Export
- Formatage pour export (dates, nombres, textes)
- Préparation des données pour graphes

**Structure** :
```typescript
import { buildMonthlyReviewData } from "@/lib/review/monthly/buildMonthlyReviewData";
import type { MonthlyExportData } from "./types";

export async function buildMonthlyExportData(params: {
  userId: string;
  year: number;
  month: number;
}): Promise<MonthlyExportData> {
  // Utiliser le builder existant (source de vérité)
  const uiData = await buildMonthlyReviewData({
    ...params,
    locale: "fr", // Ou détecter depuis headers
  });
  
  // Transformer pour export
  return {
    period: {
      year: uiData.period.year,
      month: uiData.period.month,
      label: formatPeriodLabel(uiData.period.label),
    },
    summary: formatSummary(uiData.summary),
    kpis: formatKpis(uiData.kpis),
    charts: {
      activityByWeek: uiData.charts.activityByWeek,
      actionStatus: uiData.charts.actionStatus,
      projectProgress: uiData.charts.projectProgress,
    },
    highlights: {
      keyDecisions: formatDecisions(uiData.highlights.keyDecisions),
      nextMonthFocus: formatActions(uiData.highlights.nextMonthFocus),
    },
  };
}
```

---

## Gestion d'Erreurs

### Stratégie Globale

1. **Erreurs de validation** → 400 JSON
2. **Erreurs d'authentification** → 401 JSON
3. **Erreurs de génération** → 500 JSON avec détails (dev) ou message générique (prod)
4. **Jamais de HTML** → Toujours JSON en cas d'erreur

### Exemple d'Erreur Structurée

```typescript
return NextResponse.json(
  {
    error: "Export failed",
    code: "CHART_GENERATION_FAILED",
    details: process.env.NODE_ENV === "development" 
      ? error.message 
      : "Une erreur est survenue lors de la génération du document",
  },
  { status: 500 }
);
```

---

## Tests & Validation

### Tests Unitaires

- `pdf-generator.test.ts` : Génération PDF avec données mockées
- `ppt-generator.test.ts` : Génération PPT avec données mockées
- `chart-*.test.ts` : Génération de chaque type de graphe
- `data-builder.test.ts` : Transformation des données

### Tests d'Intégration

- `export-api.test.ts` : Appels HTTP complets avec auth
- Validation des signatures binaires
- Validation des headers HTTP

### Validation Manuelle

- Ouvrir PDF dans Adobe Reader
- Ouvrir PPTX dans PowerPoint
- Vérifier la lisibilité des graphes
- Vérifier la cohérence du design

---

## Performance

### Optimisations

1. **Génération parallèle des graphes** :
```typescript
const [activityChart, statusChart, progressChart] = await Promise.all([
  generateActivityChart(data.charts.activityByWeek),
  generateStatusChart(data.charts.actionStatus),
  generateProgressChart(data.charts.projectProgress),
]);
```

2. **Cache des données** : Les données peuvent être mises en cache si générées récemment

3. **Limite de taille** : Limiter le nombre d'éléments dans les listes (ex: max 10 projets)

### Objectifs

- Génération PDF : < 2s
- Génération PPT : < 2s
- Total (données + génération) : < 3s

---

## Évolutivité

### Ajout de Nouveaux Types d'Export

1. Créer `lib/export/weekly/pdf-generator.ts` (si nécessaire)
2. Créer `app/api/export/weekly/pdf/route.ts`
3. Réutiliser le chart engine et le design system

### Ajout de Nouveaux Graphes

1. Créer `lib/export/charts/new-chart.ts`
2. Exporter la fonction `generateNewChart(data): Promise<Buffer>`
3. Intégrer dans les générateurs PDF/PPT

### Internationalisation

- Les textes peuvent être passés depuis `buildMonthlyReviewData` (déjà i18n)
- Les formats de dates sont gérés par le data builder

---

## Migration depuis l'Existant

### Fichiers à Supprimer

```
❌ app/api/review/monthly/pdf/route.ts
❌ app/api/review/monthly/ppt/route.ts
❌ lib/review/monthly/exportPdf.ts
❌ lib/review/monthly/exportPpt.ts
❌ lib/review/monthly/renderCharts.ts
❌ lib/export/charts/chartFactory.ts (remplacé par nouvelle structure)
```

### Fichiers à Conserver

```
✅ lib/review/monthly/buildMonthlyReviewData.ts (source de vérité)
✅ lib/review/monthly/types.ts (types de données)
```

### Étapes de Migration

1. Créer la nouvelle structure de dossiers
2. Implémenter les nouveaux générateurs
3. Créer les nouveaux endpoints API
4. Tester en parallèle (garder anciens endpoints temporairement)
5. Mettre à jour le client (`ReviewHeaderActions.tsx`)
6. Supprimer l'ancien code
7. Nettoyer les dépendances inutiles

---

## Checklist de Mise en Production

- [ ] Tous les imports sont statiques (pas de template strings)
- [ ] Les endpoints retournent toujours binaire ou JSON (jamais HTML)
- [ ] Les signatures binaires sont validées (PDF: %PDF, PPTX: PK)
- [ ] Les graphes sont visibles dans PDF et PPT
- [ ] Le design est cohérent et professionnel
- [ ] Les tests passent (unitaires + intégration)
- [ ] La performance est acceptable (< 3s)
- [ ] La documentation est à jour
- [ ] Le code est reviewé par l'équipe

---

## Conclusion

Cette architecture garantit :
- ✅ **Fiabilité** : Code simple, pas de hacks, gestion d'erreurs explicite
- ✅ **Maintenabilité** : Séparation claire des responsabilités, code lisible
- ✅ **Évolutivité** : Facile d'ajouter de nouveaux exports ou graphes
- ✅ **Performance** : Génération rapide, pas de blocage
- ✅ **Qualité** : Design professionnel, documents executive-ready

Le système est prêt pour une V1 SaaS premium.

