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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="space-y-8">
          {/* En-tête premium avec hiérarchie claire */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-semibold text-slate-900 leading-tight mb-3">
                {t("projects.title")}
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                {t("projects.subtitle")}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/app/projects/new">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 h-auto shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("projects.newProject")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Liste des projets avec recherche fonctionnelle */}
          {projects.length === 0 ? (
            <FlowCard variant="default" className="bg-white border border-slate-200/60 shadow-md">
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
