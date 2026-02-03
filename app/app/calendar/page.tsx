import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { CalendarView } from "./calendar-view";
import { PageHeader } from "@/components/ui/page-header";
import { PrintActionButton } from "@/components/print-action-button";
import { getTranslations } from "@/i18n/request";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations("calendar");

  const params = await searchParams;
  const projectIdFilter = params.projectId;
  const statusFilter = params.status;

  const projectsWhere = await getAccessibleProjectsWhere(userId);

  // Charger tous les projets pour le filtre
  const projects = await prisma.project.findMany({
    where: projectsWhere,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Charger les actions avec dueDate, filtrées par projets accessibles
  const whereClause: {
    assigneeId: string;
    dueDate: { not: null };
    project?: any;
    status?: { not?: string; equals?: string };
  } = {
    assigneeId: userId,
    dueDate: {
      not: null,
    },
    project: projectsWhere,
  };

  // Filtre par projet si spécifié
  if (projectIdFilter) {
    whereClause.project = {
      ...projectsWhere,
      id: projectIdFilter,
    };
  }

  // Filtre par statut
  if (statusFilter === "open") {
    whereClause.status = { not: "DONE" };
  } else if (statusFilter === "done") {
    whereClause.status = { equals: "DONE" };
  } else if (statusFilter === "blocked") {
    whereClause.status = { equals: "BLOCKED" };
  }

  const allActions = await prisma.actionItem.findMany({
    where: projectIdFilter
      ? {
          assigneeId: userId,
          dueDate: {
            not: null,
          },
          projectId: projectIdFilter,
          project: projectsWhere,
          ...(statusFilter === "open"
            ? { status: { not: "DONE" } }
            : statusFilter === "done"
            ? { status: "DONE" }
            : statusFilter === "blocked"
            ? { status: "BLOCKED" }
            : {}),
        }
      : whereClause,
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
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
    orderBy: {
      dueDate: "asc",
    },
  });

  // Calculer dueMeta et overdue pour chaque action
  const now = new Date();
  const actionsWithMeta = allActions.map((action: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    project: { id: string; name: string };
    decision: { id: string; title: string } | null;
  }) => {
    const dueMeta = getDueMeta(action.dueDate, now);
    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now);
    return {
      ...action,
      dueMeta,
      overdue,
    };
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-7xl mx-auto px-6 py-10">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle")}
            badge={
              actionsWithMeta.length > 0
                ? {
                    label: `${actionsWithMeta.length} action${actionsWithMeta.length > 1 ? "s" : ""}`,
                    variant: "secondary",
                  }
                : undefined
            }
            actions={[
              {
                label: "Exporter PDF",
                component: <PrintActionButton href="/app/calendar/print" />,
              },
            ]}
          />

          {/* Filtres */}
          <CalendarView
            actions={actionsWithMeta}
            projects={projects}
            initialProjectId={projectIdFilter}
            initialStatus={statusFilter}
          />
        </div>
      </div>
    </div>
  );
}

