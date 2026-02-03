import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { getTranslations } from "@/i18n/request";
import { ActionsStatsWidget } from "@/components/actions/actions-stats-widget";
import { ActionsListWithFilters } from "@/components/actions/actions-list-with-filters";
import { ActionsPageClient } from "./page-client";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

export default async function ActionsPage() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();

  const projectsWhere = await getAccessibleProjectsWhere(userId);

  // Récupérer toutes les actions de l'utilisateur
  const actions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      project: projectsWhere,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      decision: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      {
        status: "asc", // DONE en dernier pour montrer le progrès
      },
      {
        dueDate: {
          sort: "asc",
          nulls: "last",
        },
      },
      {
        createdAt: "desc",
      },
    ],
  });

  // Calculer dueMeta et overdue pour chaque action
  const actionsWithMeta = actions.map((action: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueDate: Date | null;
    createdAt: Date;
    project: { id: string; name: string };
    decision: { id: string; title: string } | null;
  }) => {
    const dueMeta = getDueMeta(action.dueDate);
    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    return {
      ...action,
      dueMeta,
      overdue,
    };
  });

  // Type pour les actions avec métadonnées
  type ActionWithMeta = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueDate: Date | null;
    createdAt: Date;
    project: { id: string; name: string };
    decision: { id: string; title: string } | null;
    dueMeta: ReturnType<typeof getDueMeta>;
    overdue: boolean;
  };

  // Calculer les statistiques pour le widget
  const totalActions = actionsWithMeta.length;
  const doneActions = actionsWithMeta.filter((a: ActionWithMeta) => a.status === "DONE").length;
  const overdueActions = actionsWithMeta.filter((a: ActionWithMeta) => a.overdue && a.status !== "DONE").length;
  
  // Actions à faire cette semaine
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const todoThisWeek = actionsWithMeta.filter((a: ActionWithMeta) => {
    if (a.status === "DONE") return false;
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= now && dueDate <= nextWeek && !a.overdue;
  }).length;

  // Compter les décisions et projets
  const decisionsCount = await prisma.decision.count({
    where: {
      project: projectsWhere,
    },
  });

  const projectsCount = await prisma.project.count({
    where: projectsWhere,
  });

  return (
    <div className="space-y-8">
      <ActionsPageClient />
      {/* En-tête avec titre et bouton */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-semibold text-[#111111] leading-tight mb-3">
            {t("actions.title")}
          </h1>
          <p className="text-base text-[#667085] leading-relaxed">
            {t("actions.subtitle")}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/app/actions/new">
            <Button 
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-5 py-2.5 h-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.newAction")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Widget de statistiques */}
      {totalActions > 0 && (
        <ActionsStatsWidget
          overdueCount={overdueActions}
          todoThisWeekCount={todoThisWeek}
          completedCount={doneActions}
          decisionsCount={decisionsCount}
          projectsCount={projectsCount}
        />
      )}

      {/* Liste des actions avec filtres */}
      {actionsWithMeta.length === 0 ? (
        <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
          <FlowCardContent className="py-16 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB]">
                <Sparkles className="h-8 w-8 text-[#2563EB]" />
              </div>
            </div>
            <p className="text-base font-semibold text-[#111111] mb-2">
              {t("emptyStates.noActions")}
            </p>
            <p className="text-sm text-[#667085] mb-6">
              {t("actions.emptyStateDescription")}
            </p>
            <Link href="/app/actions/new">
              <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                <Plus className="mr-2 h-4 w-4" />
                {t("actions.createFirst")}
              </Button>
            </Link>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <ActionsListWithFilters 
          actions={actionsWithMeta.map((action) => ({
            id: action.id,
            title: action.title,
            description: action.description,
            status: action.status,
            dueDate: action.dueDate ? action.dueDate.toISOString() : null,
            createdAt: action.createdAt.toISOString(),
            project: action.project,
            decision: action.decision,
            overdue: action.overdue,
            dueMeta: {
              label: action.dueMeta.label,
              color: action.dueMeta.kind === "OVERDUE" ? "#B91C1C" : "#667085",
            },
          }))}
        />
      )}
    </div>
  );
}
