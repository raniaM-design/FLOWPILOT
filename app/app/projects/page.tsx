import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProjectsListWithSearch } from "@/components/projects/projects-list-with-search";

export default async function ProjectsPage() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();

  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
    },
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
    <div className="space-y-8">
      {/* En-tête premium avec hiérarchie claire */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-semibold text-[#111111] leading-tight mb-3">
            {t("projects.title")}
          </h1>
          <p className="text-base text-[#667085] leading-relaxed">
            Gérez tous vos projets en un seul endroit
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/app/projects/new">
            <Button 
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-5 py-2.5 h-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          </Link>
        </div>
      </div>

      {/* Liste des projets avec recherche fonctionnelle */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-xl border border-[#E5E7EB]">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 border border-[#E5E7EB]">
            <FolderKanban className="h-10 w-10 text-[#2563EB]" />
          </div>
          <h3 className="text-xl font-semibold text-[#111111] mb-3">
            {t("emptyStates.noProjects")}
          </h3>
          <p className="text-sm text-[#667085] mb-8 text-center max-w-md leading-relaxed">
            Créez votre premier projet pour commencer à organiser vos décisions et actions
          </p>
          <Link href="/app/projects/new">
            <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-5 py-2.5 h-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t("projects.createFirst")}
            </Button>
          </Link>
        </div>
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
  );
}
