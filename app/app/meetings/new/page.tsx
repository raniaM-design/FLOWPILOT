import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Calendar } from "lucide-react";
import { getTranslations } from "@/i18n/request";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { MeetingFormClient } from "./meeting-form-client";

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const t = await getTranslations();
  const userId = await getCurrentUserIdOrThrow();

  const params = await searchParams;
  const defaultProjectId = params.projectId || undefined;

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

  // Date par défaut = aujourd'hui
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 relative overflow-hidden">
      {/* Effets de fond animés - couleurs cohérentes avec PILOTYS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cercles colorés flottants - bleu doux */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-slate-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        <div className="space-y-8">
          {/* En-tête avec icône et gradient - bleu PILOTYS */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-2">
                Nouveau compte rendu
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Enregistrez une réunion et son compte-rendu
              </p>
            </div>
          </div>

          {/* Formulaire avec design coloré - palette PILOTYS */}
          <FlowCard variant="default" className="bg-white border border-slate-200 shadow-lg relative overflow-hidden">
            {/* Bordure colorée animée - bleu PILOTYS */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600" />
            
            <FlowCardContent className="p-6 lg:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Détails
                </h2>
                <p className="text-sm text-slate-600">
                  Remplissez les informations de base de la réunion
                </p>
              </div>

              <MeetingFormClient
                projects={projects}
                defaultProjectId={defaultProjectId}
                today={today}
                t={t}
              />
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
