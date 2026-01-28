/**
 * Exemples d'utilisation des composants UI FlowPilot
 * Ce fichier sert de référence et peut être supprimé en production
 */

import { FlowCard, FlowCardHeader, FlowCardTitle, FlowCardDescription, FlowCardContent, FlowCardFooter } from "./flow-card";
import { Chip } from "./chip";
import { SectionHeader } from "./section-header";
import { UrgencyBar } from "./urgency-bar";
import { Button } from "./button";
import Link from "next/link";

// Exemple 1: FlowCard avec variantes
export function FlowCardExamples() {
  return (
    <div className="space-y-4">
      <FlowCard variant="default">
        <FlowCardHeader>
          <FlowCardTitle>Card par défaut</FlowCardTitle>
          <FlowCardDescription>Border douce, shadow légère</FlowCardDescription>
        </FlowCardHeader>
        <FlowCardContent>
          <p>Contenu de la card</p>
        </FlowCardContent>
      </FlowCard>

      <FlowCard variant="elevated" interactive>
        <FlowCardHeader>
          <FlowCardTitle>Card interactive</FlowCardTitle>
          <FlowCardDescription>Hover effects activés</FlowCardDescription>
        </FlowCardHeader>
        <FlowCardContent>
          <p>Passe la souris pour voir l'effet</p>
        </FlowCardContent>
      </FlowCard>

      <FlowCard variant="subtle">
        <FlowCardHeader>
          <FlowCardTitle>Card subtile</FlowCardTitle>
          <FlowCardDescription>Fond très léger</FlowCardDescription>
        </FlowCardHeader>
      </FlowCard>
    </div>
  );
}

// Exemple 2: Chips avec toutes les variantes
export function ChipExamples() {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip variant="neutral">Neutre</Chip>
      <Chip variant="success">Succès</Chip>
      <Chip variant="warning">Attention</Chip>
      <Chip variant="danger">Urgent</Chip>
      <Chip variant="info">Information</Chip>
      <Chip variant="success" size="sm">Petit</Chip>
      <Chip variant="info" size="lg">Grand</Chip>
    </div>
  );
}

// Exemple 3: SectionHeader avec action
export function SectionHeaderExamples() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Décisions à surveiller"
        description="Décisions qui nécessitent ton attention pour avancer."
        action={
          <Link href="/app/decisions/risk">
            <Button variant="outline" size="sm">
              Voir toutes
            </Button>
          </Link>
        }
      />

      <SectionHeader
        title="Actions de la semaine"
        size="sm"
      />

      <SectionHeader
        title="Roadmap du projet"
        description="Vue chronologique des décisions et de leur exécution."
        size="lg"
        action={<Button size="sm">Exporter</Button>}
      />
    </div>
  );
}

// Exemple 4: UrgencyBar
export function UrgencyBarExamples() {
  return (
    <div className="space-y-4">
      <FlowCard>
        <FlowCardHeader>
          <FlowCardTitle>Barre d'urgence - Exemple 1</FlowCardTitle>
        </FlowCardHeader>
        <FlowCardContent>
          <UrgencyBar
            done={5}
            open={3}
            overdue={1}
            blocked={0}
            showLegend={true}
          />
        </FlowCardContent>
      </FlowCard>

      <FlowCard>
        <FlowCardHeader>
          <FlowCardTitle>Barre d'urgence - Exemple 2</FlowCardTitle>
        </FlowCardHeader>
        <FlowCardContent>
          <UrgencyBar
            done={2}
            open={1}
            overdue={2}
            blocked={1}
            showLegend={true}
            size="lg"
          />
        </FlowCardContent>
      </FlowCard>

      <FlowCard>
        <FlowCardHeader>
          <FlowCardTitle>Sans légende</FlowCardTitle>
        </FlowCardHeader>
        <FlowCardContent>
          <UrgencyBar
            done={8}
            open={2}
            overdue={0}
            blocked={0}
            showLegend={false}
            size="sm"
          />
        </FlowCardContent>
      </FlowCard>
    </div>
  );
}

// Exemple 5: Combinaison complète (dashboard-like)
export function CompleteExample() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        description="Vue d'ensemble de tes projets et actions"
        action={<Button>Nouveau projet</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FlowCard variant="elevated" interactive>
          <FlowCardHeader>
            <FlowCardTitle>Projet Alpha</FlowCardTitle>
            <FlowCardDescription>Développement produit</FlowCardDescription>
          </FlowCardHeader>
          <FlowCardContent>
            <UrgencyBar done={5} open={3} overdue={1} blocked={0} />
            <div className="flex flex-wrap gap-2 mt-4">
              <Chip variant="success">En cours</Chip>
              <Chip variant="info">3 décisions</Chip>
            </div>
          </FlowCardContent>
          <FlowCardFooter>
            <Button variant="outline" size="sm" className="w-full">
              Voir le projet
            </Button>
          </FlowCardFooter>
        </FlowCard>

        <FlowCard variant="default">
          <FlowCardHeader>
            <FlowCardTitle>Décision importante</FlowCardTitle>
            <FlowCardDescription>Choisir la stack technique</FlowCardDescription>
          </FlowCardHeader>
          <FlowCardContent>
            <UrgencyBar done={2} open={1} overdue={0} blocked={1} />
            <div className="flex items-center gap-2 mt-4">
              <Chip variant="warning">À surveiller</Chip>
              <Chip variant="danger">1 bloquée</Chip>
            </div>
          </FlowCardContent>
        </FlowCard>
      </div>
    </div>
  );
}

