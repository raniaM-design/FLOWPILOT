import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { createStandaloneAction } from "../actions";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ActionFormFieldsWithMentions } from "@/components/action-form-fields-with-mentions";
import { ProjectSelect } from "./project-select";
import { getTranslations } from "@/i18n/request";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";
import { ListTodo } from "lucide-react";

export default async function NewActionPage() {
  const t = await getTranslations();
  const userId = await getCurrentUserIdOrThrow();

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

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/20 relative overflow-hidden">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
          <FlowCard variant="default" className="bg-white/80 backdrop-blur-sm border-2 border-emerald-200/50 shadow-2xl">
            <FlowCardContent className="py-12 text-center">
              <p className="text-base font-semibold text-foreground mb-2">
                {t("emptyStates.noProjectAvailable")}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {t("emptyStates.mustCreateProject")}
              </p>
              <Link href="/app/projects/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  {t("forms.createProject")}
                </Button>
              </Link>
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 relative overflow-hidden">
      {/* Effets de fond animés - couleurs cohérentes avec PILOTYS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cercles colorés flottants - émeraude doux */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-slate-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        <div className="space-y-8">
          {/* En-tête avec icône et gradient - émeraude PILOTYS */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-lg mb-4">
              <ListTodo className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-2">
                Nouvelle action
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Créez une nouvelle action à suivre
              </p>
            </div>
          </div>

          {/* Formulaire avec design coloré - palette PILOTYS */}
          <FlowCard variant="default" className="bg-white border border-slate-200 shadow-lg relative overflow-hidden">
            {/* Bordure colorée animée - émeraude PILOTYS */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
            
            <FlowCardContent className="p-6 lg:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {t("actions.actionDetails")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("actions.actionDetailsDescription")}
                </p>
              </div>

              <form action={createStandaloneAction} className="space-y-6">
                <ProjectSelect projects={projects} />

                <ActionFormFieldsWithMentions />

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <FormSubmitButton
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 h-auto"
                    loadingText={t("actions.creating") || "Création..."}
                  >
                    {t("actions.createAction")}
                  </FormSubmitButton>
                  <Link href="/app/actions">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border border-slate-300 hover:bg-slate-50 font-medium px-6 py-2.5 h-auto"
                    >
                      {t("common.cancel")}
                    </Button>
                  </Link>
                </div>
              </form>
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
