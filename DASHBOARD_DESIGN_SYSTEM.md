# Dashboard - Code et Design System PILOTYS

## 📋 Page Dashboard Principale

**Fichier** : `app/app/page.tsx`

### Structure de la page

```tsx
import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { SectionTitle } from "@/components/ui/section-title";
import { AlertCircle, Calendar, CheckSquare2, FolderKanban, ListTodo, AlertTriangle, ArrowRight, Ban, CheckSquare } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { DecisionCard } from "@/components/decisions/decision-card";
import { calculateDecisionMeta } from "@/lib/decisions/decision-meta";
import { Button } from "@/components/ui/button";
import { FocusToday } from "@/components/dashboard/focus-today";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { CreateMenu } from "@/components/dashboard/create-menu";
import { DecisionsList } from "@/components/dashboard/decisions-list";

export default async function AppPage() {
  // ... logique de récupération des données ...

  return (
    <div className="space-y-10">
      {/* Header Dashboard avec message personnalisé */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex-1">
            {firstName ? (
              <h1 className="text-3xl font-medium text-foreground leading-tight">
                Bonjour {firstName}
              </h1>
            ) : (
              <h1 className="text-3xl font-medium text-foreground leading-tight">
                Dashboard
              </h1>
            )}
            <p className="text-base text-text-secondary mt-2 leading-relaxed">
              Voici ce qui nécessite votre attention aujourd'hui
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateMenu />
          </div>
        </div>
        {overdueCount > 0 || blockedCount > 0 ? (
          <div className="pt-2">
            <DashboardStats
              overdueCount={overdueCount}
              blockedCount={blockedCount}
              weekCount={weekCount}
            />
          </div>
        ) : null}
      </div>

      {/* Action principale du jour */}
      <FocusToday actions={priorityActions} />

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne gauche */}
        <div className="space-y-8">
          {/* Décisions à surveiller */}
          <FlowCard variant="default">
            <FlowCardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <SectionTitle
                  title="Décisions à surveiller"
                  subtitle="Ces décisions nécessitent votre attention pour rester sur la bonne voie"
                  count={riskyDecisions.length}
                  size="md"
                  accentColor="amber"
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
                {riskyDecisions.length > 0 && (
                  <Link href="/app/decisions/risk" className="text-sm text-text-secondary hover:text-primary transition-colors duration-150">
                    Voir tout
                  </Link>
                )}
              </div>
              <DecisionsList decisions={riskyDecisions} itemsPerPage={3} />
            </FlowCardContent>
          </FlowCard>
        </div>

        {/* Colonne droite */}
        <div className="space-y-8">
          {/* Actions en retard */}
          <FlowCard variant="default">
            <FlowCardContent className="space-y-5">
              <SectionTitle
                title="Actions en retard"
                subtitle="Ces actions ont dépassé leur échéance. Commencez par les plus anciennes."
                count={overdueActions.length}
                size="md"
                accentColor="red"
                icon={<AlertCircle className="h-4 w-4" />}
              />
              {/* ... liste des actions ... */}
            </FlowCardContent>
          </FlowCard>

          {/* Actions bloquées */}
          {/* ... */}

          {/* Actions de la semaine */}
          {/* ... */}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Palette de Couleurs PILOTYS

### Light Mode (Référence)

**Fichier** : `app/globals.css`

```css
:root {
  /* Fond principal */
  --background: 210 20% 98%; /* #F9FAFB */
  --foreground: 222 47% 11%; /* #0F172A - Texte principal */
  
  /* Fond section */
  --section-bg: 210 40% 96%; /* #F1F5F9 */
  
  /* Cartes */
  --card: 0 0% 100%; /* #FFFFFF */
  --card-foreground: 222 47% 11%; /* #0F172A */
  
  /* Fond hover */
  --hover-bg: 229 84% 95%; /* #EEF2FF */
  
  /* Primary - Bleu profond PILOTYS */
  --primary: 217 91% 60%; /* #2563EB */
  --primary-foreground: 0 0% 100%; /* #FFFFFF */
  
  /* Secondary */
  --secondary: 210 40% 96%; /* #F1F5F9 */
  --secondary-foreground: 222 47% 11%; /* #0F172A */
  
  /* Muted */
  --muted: 210 40% 96%; /* #F1F5F9 */
  --muted-foreground: 215 20% 65%; /* #94A3B8 - Texte léger / meta */
  
  /* Accent */
  --accent: 229 84% 95%; /* #EEF2FF */
  --accent-foreground: 217 91% 60%; /* #2563EB */
  
  /* Texte secondaire */
  --text-secondary: 215 16% 47%; /* #475569 */
  
  /* Destructive */
  --destructive: 0 72% 51%; /* #DC2626 */
  --destructive-foreground: 0 0% 100%; /* #FFFFFF */
  
  /* Border */
  --border: 220 13% 91%; /* #E5E7EB */
  --input: 220 13% 91%; /* #E5E7EB */
  --ring: 217 91% 60%; /* #2563EB */
  
  --radius: 0.5rem;
  
  /* Brand Colors - Statuts */
  --brand: 217 91% 60%; /* #2563EB */
  --success: 142 71% 45%; /* #16A34A */
  --warning: 25 95% 53%; /* #D97706 */
  --danger: 0 72% 51%; /* #DC2626 */
  
  /* Couleurs d'accent par domaine */
  --accent-projets: 217 91% 60%; /* #2563EB - bleu */
  --accent-decisions: 258 90% 66%; /* #7C3AED - violet doux */
  --accent-actions: 142 71% 45%; /* #16A34A - vert */
  
  /* Custom colors pour statuts avec backgrounds */
  --success-bg: 142 76% 91%; /* #DCFCE7 */
  --danger-bg: 0 93% 94%; /* #FEE2E2 */
  --warning-bg: 48 96% 89%; /* #FEF3C7 */
}
```

### Dark Mode

```css
.dark {
  --background: 222 47% 4%; /* #020617 - Fond principal */
  --foreground: 210 40% 90%; /* #E5E7EB - Texte principal */
  --section-bg: 222 47% 4%; /* #020617 - Fond section */
  --card: 222 47% 4%; /* #020617 - Fond card */
  --card-foreground: 210 40% 90%; /* #E5E7EB */
  --hover-bg: 222 47% 4%; /* Pas de hover distinct en dark mode */
  --primary: 217 92% 65%; /* #60A5FA - Accent principal */
  --primary-foreground: 222 47% 4%;
  --secondary: 217 33% 17%; /* #1E293B */
  --secondary-foreground: 210 40% 90%;
  --muted: 217 33% 17%; /* #1E293B */
  --muted-foreground: 215 20% 65%; /* #94A3B8 - Texte secondaire */
  --accent: 217 33% 17%; /* #1E293B */
  --accent-foreground: 217 92% 65%; /* #60A5FA */
  --text-secondary: 215 20% 65%; /* #94A3B8 */
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 90%;
  --border: 217 33% 17%; /* #1E293B */
  --input: 217 33% 17%; /* #1E293B */
  --ring: 217 92% 65%; /* #60A5FA */
  /* Couleurs d'accent par domaine - Dark mode */
  --accent-projets: 217 92% 65%; /* #60A5FA */
  --accent-decisions: 258 90% 75%; /* #A78BFA */
  --accent-actions: 142 71% 60%; /* #4ADE80 */
}
```

---

## 🎯 Couleurs PPT (Export Monthly Review)

**Fichier** : `lib/export/monthly/ppt-generator.ts`

```typescript
// Couleurs PILOTYS (palette stricte)
const COLORS = {
  text: "111111",           // #111111 - Texte principal
  muted: "667085",          // #667085 - Texte secondaire/mué
  divider: "E5E7EB",        // #E5E7EB - Séparateurs
  accent: "2563EB",         // #2563EB - Bleu PILOTYS (primary)
  success: "16A34A",        // #16A34A - Vert succès
  danger: "DC2626",         // #DC2626 - Rouge danger
};
```

---

## 📐 Typographie

### Dashboard (Web)

```css
/* Titres */
h1: text-3xl font-medium text-foreground leading-tight
h2: text-xl font-medium text-foreground tracking-tight
h3: text-lg font-medium text-foreground leading-relaxed
h4: text-base font-medium text-foreground
h5: text-sm font-medium text-foreground

/* Corps de texte */
body: text-base text-text-secondary leading-relaxed
small: text-sm text-muted-foreground
meta: text-xs text-muted-foreground
```

### PPT (Export)

```typescript
const TYPO = {
  h1: 44,      // Titre principal cover (standard PowerPoint)
  h2: 18,      // Titre slide (18pt comme demandé)
  h3: 12,      // Sous-titre section (12pt en gras)
  body: 12,    // Texte standard (12pt comme demandé)
  secondary: 12, // Texte secondaire
  meta: 10,    // Méta (dates, projets)
};
```

---

## 🎨 Composants Dashboard

### 1. DashboardStats

**Fichier** : `components/dashboard/dashboard-stats.tsx`

```tsx
export function DashboardStats({ overdueCount, blockedCount, weekCount }: DashboardStatsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {overdueCount > 0 && (
        <Chip variant="danger" size="sm" className="gap-1.5 font-normal">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="font-medium">{overdueCount}</span>
          <span>à traiter</span>
        </Chip>
      )}
      {blockedCount > 0 && (
        <Chip variant="warning" size="sm" className="gap-1.5 font-normal">
          <Ban className="h-3.5 w-3.5" />
          <span className="font-medium">{blockedCount}</span>
          <span>bloquée{blockedCount > 1 ? "s" : ""}</span>
        </Chip>
      )}
      {weekCount > 0 && (
        <Chip variant="info" size="sm" className="gap-1.5 font-normal">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-medium">{weekCount}</span>
          <span>cette semaine</span>
        </Chip>
      )}
    </div>
  );
}
```

### 2. FocusToday

**Fichier** : `components/dashboard/focus-today.tsx`

**Couleurs utilisées** :
- Icône principale : `backgroundColor: 'hsl(var(--accent) / 0.5)'` + `color: 'hsl(var(--primary))'`
- Carte action : `bg-section-bg/40 hover:bg-hover-bg/70`
- Icône action : `backgroundColor: 'hsl(var(--accent) / 0.6)'` + `color: 'hsl(var(--primary))'`

### 3. FlowCard

**Variantes** :
- `variant="default"` : Carte standard avec bordure
- `variant="elevated"` : Carte avec ombre premium

**Classes CSS** :
```css
.shadow-premium {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.shadow-premium-md {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.shadow-premium-lg {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

---

## 🎯 Patterns de Design Utilisés

### Cartes d'Action

```tsx
<div className="bg-section-bg/50 rounded-xl shadow-premium p-5 hover:bg-hover-bg transition-all duration-150 ease-out">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" 
             style={{ backgroundColor: 'hsl(var(--danger-bg))' }}>
          <CheckSquare className="h-3.5 w-3.5" 
                       style={{ color: 'hsl(var(--danger))' }} 
                       strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-150 ease-out">
            {action.title}
          </h4>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {/* Métadonnées */}
      </div>
    </div>
  </div>
</div>
```

### Icônes avec Background Coloré

**Pattern** :
```tsx
<div className="w-6 h-6 rounded-lg flex items-center justify-center" 
     style={{ backgroundColor: 'hsl(var(--danger-bg))' }}>
  <Icon className="h-3.5 w-3.5" 
        style={{ color: 'hsl(var(--danger))' }} 
        strokeWidth={1.75} />
</div>
```

**Couleurs disponibles** :
- Danger : `--danger-bg` + `--danger`
- Warning : `--warning-bg` + `--warning`
- Success : `--success-bg` + `--success`
- Primary/Accent : `hsl(var(--accent) / 0.4)` + `hsl(var(--primary))`

---

## 📏 Espacements

### Dashboard

```css
/* Espacements verticaux */
space-y-10  /* Entre sections principales */
space-y-8   /* Entre cartes dans une colonne */
space-y-5   /* Entre éléments dans une carte */
space-y-3   /* Entre items dans une liste */

/* Padding */
p-8         /* Carte principale (FocusToday) */
p-6         /* Carte action principale */
p-5         /* Carte action standard */
p-4         /* Carte action compacte */

/* Marges */
mt-2        /* Sous-titre */
mb-2.5      /* Espacement titre */
mb-3        /* Espacement contenu */
mb-4        /* Espacement section */
```

### PPT (Export)

```typescript
const SPACING = {
  titleToContent: 0.3,    // Espace après titre (réduit)
  betweenSections: 0.25,  // Entre sections (réduit)
  betweenCards: 0.15,      // Entre cartes (réduit)
  betweenLines: 0.1,       // Entre lignes (réduit)
  betweenBullets: 0.15,    // Entre bullets (réduit)
};
```

---

## 🎨 Transitions et Animations

```css
/* Transitions standards */
transition-all duration-150 ease-out      /* Hover rapide */
transition-all duration-200 ease-out       /* Hover standard */
transition-colors duration-150            /* Changement de couleur */
transition-colors duration-200            /* Changement de couleur lent */

/* États hover */
hover:bg-hover-bg                         /* Fond hover */
hover:bg-hover-bg/80                      /* Fond hover avec opacité */
group-hover:text-primary                   /* Texte hover (dans un groupe) */
```

---

## 📱 Responsive Design

```tsx
/* Grille responsive */
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Colonne gauche */}
  <div className="space-y-8">...</div>
  {/* Colonne droite */}
  <div className="space-y-8">...</div>
</div>

/* Flex responsive */
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
  {/* Contenu */}
</div>
```

---

## 🎯 Résumé des Couleurs Principales

| Usage | Light Mode | Dark Mode | Hex (Light) |
|-------|------------|-----------|-------------|
| **Background** | `hsl(210 20% 98%)` | `hsl(222 47% 4%)` | `#F9FAFB` |
| **Foreground** | `hsl(222 47% 11%)` | `hsl(210 40% 90%)` | `#0F172A` |
| **Primary** | `hsl(217 91% 60%)` | `hsl(217 92% 65%)` | `#2563EB` |
| **Section BG** | `hsl(210 40% 96%)` | `hsl(222 47% 4%)` | `#F1F5F9` |
| **Hover BG** | `hsl(229 84% 95%)` | `hsl(222 47% 4%)` | `#EEF2FF` |
| **Muted** | `hsl(215 20% 65%)` | `hsl(215 20% 65%)` | `#94A3B8` |
| **Danger** | `hsl(0 72% 51%)` | `hsl(0 63% 31%)` | `#DC2626` |
| **Warning** | `hsl(25 95% 53%)` | - | `#D97706` |
| **Success** | `hsl(142 71% 45%)` | - | `#16A34A` |
| **Border** | `hsl(220 13% 91%)` | `hsl(217 33% 17%)` | `#E5E7EB` |

---

## 📝 Notes Importantes

1. **Cohérence** : Toutes les couleurs utilisent le système de variables CSS (`hsl(var(--variable))`)
2. **Opacité** : Utilisation de `/` pour l'opacité (ex: `bg-section-bg/40`)
3. **Dark Mode** : Toutes les couleurs sont adaptées pour le dark mode
4. **Accessibilité** : Contraste suffisant entre texte et fond
5. **Design System** : Cohérence entre Dashboard web et exports PPT/PDF

