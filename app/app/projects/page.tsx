import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n/request";
import { ProjectsListWithSearch } from "@/components/projects/projects-list-with-search";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";

export default async function ProjectsPage() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();

  const projectsWhere = await getAccessibleProjectsWhere(userId);

  const projects = await prisma.project.findMany({
    where: projectsWhere,
    include: {
      _count: {
        select: {
          decisions: true,
          actions: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculer les statistiques
  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const pausedProjects = projects.filter(p => p.status === "PAUSED").length;
  const totalDecisions = projects.reduce((sum, p) => sum + (p._count?.decisions || 0), 0);
  const totalActions = projects.reduce((sum, p) => sum + (p._count?.actions || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="space-y-6">
          {/* En-tête avec statistiques colorées */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2">
                {t("projects.title")}
              </h1>
              <p className="text-base text-slate-600">
                {t("projects.subtitle")}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/app/projects/new">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 h-auto shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("projects.newProject")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Statistiques compactes */}
          {projects.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 rounded-lg shadow-sm p-3">
                <div className="text-xs font-medium text-slate-600 mb-1">Total</div>
                <div className="text-xl font-bold text-blue-700">{projects.length}</div>
              </div>
              <div className="bg-emerald-50 rounded-lg shadow-sm p-3">
                <div className="text-xs font-medium text-slate-600 mb-1">Actifs</div>
                <div className="text-xl font-bold text-emerald-700">{activeProjects}</div>
              </div>
              <div className="bg-purple-50 rounded-lg shadow-sm p-3">
                <div className="text-xs font-medium text-slate-600 mb-1">Décisions</div>
                <div className="text-xl font-bold text-purple-700">{totalDecisions}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg shadow-sm p-3">
                <div className="text-xs font-medium text-slate-600 mb-1">Actions</div>
                <div className="text-xl font-bold text-indigo-700">{totalActions}</div>
              </div>
            </div>
          )}

          {/* Liste des projets avec recherche fonctionnelle */}
          {projects.length === 0 ? (
            <FlowCard variant="default" className="bg-white border-0 shadow-md">
              <FlowCardContent className="flex flex-col items-center justify-center py-24 px-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <FolderKanban className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {t("emptyStates.noProjects")}
                </h3>
                <p className="text-sm text-slate-600 mb-8 text-center max-w-md leading-relaxed">
                  Créez votre premier projet pour commencer à organiser vos décisions et actions
                </p>
                <Link href="/app/projects/new">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 h-auto shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("projects.createFirst")}
                  </Button>
                </Link>
              </FlowCardContent>
            </FlowCard>
          ) : (
            <ProjectsListWithSearch 
              projects={projects.map((project) => ({
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                createdAt: project.createdAt,
                _count: project._count,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
