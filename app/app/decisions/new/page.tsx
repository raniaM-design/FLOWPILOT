import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle, FlowCardDescription } from "@/components/ui/flow-card";
import { PageHeader } from "@/components/ui/page-header";
import { createDecision } from "../actions";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DecisionForm } from "./decision-form";
import { Lightbulb, CheckCircle2, FileText } from "lucide-react";

export default async function NewDecisionPage() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();

  // Récupérer les projets de l'utilisateur
  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
      status: {
        not: "DONE", // Exclure les projets terminés
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title={t("decisions.newDecision")}
            subtitle="Documentez une nouvelle décision importante"
            actions={[
              {
                label: "Annuler",
                href: "/app/decisions",
                variant: "outline",
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire principal (2 colonnes sur desktop) */}
            <div className="lg:col-span-2">
              <FlowCard variant="default" className="bg-white border-slate-200/60 shadow-sm">
                <FlowCardHeader>
                  <FlowCardTitle className="text-lg font-semibold tracking-tight">Détails de la décision</FlowCardTitle>
                  <FlowCardDescription>
                    Remplissez les informations pour documenter votre décision
                  </FlowCardDescription>
                </FlowCardHeader>
                <DecisionForm projects={projects} action={createDecision} />
              </FlowCard>
            </div>

            {/* Aide à droite */}
            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-8">
                {/* Exemple de contexte */}
                <FlowCard variant="subtle" className="bg-blue-50/50 border-blue-200/60">
                  <FlowCardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      <FlowCardTitle className="text-base font-semibold text-slate-900">Exemple de contexte</FlowCardTitle>
                    </div>
                  </FlowCardHeader>
                  <FlowCardContent className="space-y-3 text-sm text-slate-700">
                    <p className="leading-relaxed">
                      "Nous devions choisir entre deux approches techniques. L'approche A est plus rapide à implémenter mais moins scalable. L'approche B prend plus de temps mais sera plus maintenable long terme."
                    </p>
                  </FlowCardContent>
                </FlowCard>

                {/* Bonne décision = actionnable */}
                <FlowCard variant="subtle" className="bg-emerald-50/50 border-emerald-200/60">
                  <FlowCardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <FlowCardTitle className="text-base font-semibold text-slate-900">Bonne décision = actionnable</FlowCardTitle>
                    </div>
                  </FlowCardHeader>
                  <FlowCardContent className="space-y-3 text-sm text-slate-700">
                    <p className="leading-relaxed">
                      Une décision bien documentée doit pouvoir être transformée en actions concrètes. Assurez-vous que votre décision est claire et actionnable.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
                      <li>Contexte clair et factuel</li>
                      <li>Décision explicite</li>
                      <li>Actions assignables</li>
                    </ul>
                  </FlowCardContent>
                </FlowCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
