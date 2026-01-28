# Composants UI FlowPilot

## FlowCard

Card moderne avec spacing, border douce et shadow légère.

```tsx
import { FlowCard, FlowCardHeader, FlowCardTitle, FlowCardDescription, FlowCardContent } from "@/components/ui/flow-card";

<FlowCard variant="default" interactive>
  <FlowCardHeader>
    <FlowCardTitle>Titre de la card</FlowCardTitle>
    <FlowCardDescription>Description optionnelle</FlowCardDescription>
  </FlowCardHeader>
  <FlowCardContent>
    {/* Contenu */}
  </FlowCardContent>
</FlowCard>
```

**Variantes:**
- `default`: Border douce, shadow légère
- `elevated`: Shadow plus prononcée
- `outlined`: Border plus visible, pas de shadow
- `subtle`: Fond très subtil, border légère

**Props:**
- `interactive`: Ajoute hover effects et cursor pointer

## Chip

Badge rounded-full avec variantes de couleur subtiles.

```tsx
import { Chip } from "@/components/ui/chip";

<Chip variant="success">Terminé</Chip>
<Chip variant="warning">En attente</Chip>
<Chip variant="danger">Urgent</Chip>
<Chip variant="info">Information</Chip>
<Chip variant="neutral">Neutre</Chip>
```

**Variantes:**
- `neutral`: Gris subtil
- `success`: Vert émeraude doux
- `warning`: Ambre doux
- `danger`: Rouge doux
- `info`: Bleu doux

**Tailles:**
- `sm`, `md` (défaut), `lg`

## SectionHeader

En-tête de section avec titre et micro-copy optionnelle.

```tsx
import { SectionHeader } from "@/components/ui/section-header";

<SectionHeader
  title="Décisions à surveiller"
  description="Décisions qui nécessitent ton attention pour avancer."
  action={<Button>Action</Button>}
  size="md"
/>
```

**Tailles:**
- `sm`, `md` (défaut), `lg`

## UrgencyBar

Barre d'urgence avec segments proportionnels.

```tsx
import { UrgencyBar } from "@/components/ui/urgency-bar";

<UrgencyBar
  done={5}
  open={3}
  overdue={1}
  blocked={0}
  showLegend={true}
  size="md"
/>
```

**Props:**
- `done`, `open`, `overdue`, `blocked`: Compteurs
- `showLegend`: Affiche la légende (défaut: true)
- `size`: `sm`, `md` (défaut), `lg`

**Couleurs:**
- Done: Slate (gris)
- Open: Blue (bleu)
- Overdue: Red (rouge)
- Blocked: Amber (ambre)

