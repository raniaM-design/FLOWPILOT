import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { createDecision } from "../actions";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n/request";
import { DecisionForm } from "./decision-form";
import { CheckSquare2 } from "lucide-react";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

export default async function NewDecisionPage() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();

  const projectsWhere = await getAccessibleProjectsWhere(userId);

  // Récupérer les projets accessibles (propriétaires + membres entreprise)
  const projects = await prisma.project.findMany({
    where: {
      ...projectsWhere,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 relative overflow-hidden">
      {/* Effets de fond animés - couleurs cohérentes avec PILOTYS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cercles colorés flottants - violet doux */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-slate-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        <div className="space-y-8">
          {/* En-tête avec icône et gradient - violet PILOTYS */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg mb-4">
              <CheckSquare2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-2">
                Nouvelle décision
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Documentez une nouvelle décision importante
              </p>
            </div>
          </div>

          {/* Formulaire avec design coloré - palette PILOTYS */}
          <FlowCard variant="default" className="bg-white border border-slate-200 shadow-lg relative overflow-hidden">
            {/* Bordure colorée animée - violet PILOTYS */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600" />
            
            <FlowCardContent className="p-6 lg:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Détails de la décision
                </h2>
                <p className="text-sm text-slate-600">
                  Remplissez les informations pour documenter votre décision
                </p>
              </div>

              <DecisionForm projects={projects} action={createDecision} />
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
