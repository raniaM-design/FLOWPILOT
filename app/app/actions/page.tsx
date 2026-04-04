import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslations } from "@/i18n/request";
import { ActionsStatsWidget } from "@/components/actions/actions-stats-widget";
import { ActionsListWithFilters } from "@/components/actions/actions-list-with-filters";
import { ActionsPageClient } from "./page-client";
import {
  getAccessibleProjectsWhere,
  getCompanyMemberIds,
} from "@/lib/company/getCompanyProjects";

const ACTIONS_TABS = ["all", "inProgress", "blocked", "completed"] as const;

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; plan?: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();
  const sp = await searchParams;
  const tabParam = sp.tab;
  const initialTab = ACTIONS_TABS.includes(tabParam as (typeof ACTIONS_TABS)[number])
    ? (tabParam as (typeof ACTIONS_TABS)[number])
    : undefined;
  const initialQuickFilter =
    sp.plan === "overdue" ? ("overdue" as const) : null;

  const projectsWhere = await getAccessibleProjectsWhere(userId);
  const memberIds = await getCompanyMemberIds(userId);

  const actions = await prisma.actionItem.findMany({
    where: {
      project: projectsWhere,
      OR: [
        { assigneeId: { in: memberIds } },
        { assigneeId: null, createdById: userId },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      blockReason: true,
      dueDate: true,
      createdAt: true,
      assigneeId: true,
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
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      {
        dueDate: {
          sort: "asc",
          nulls: "last",
        },
      },
      { createdAt: "desc" },
    ],
  });

  const actionsWithMeta = actions.map(
    (action: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      blockReason: string | null;
      dueDate: Date | null;
      createdAt: Date;
      assigneeId: string | null;
      project: { id: string; name: string };
      decision: { id: string; title: string } | null;
      assignee: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
      } | null;
    }) => {
      const dueMeta = getDueMeta(action.dueDate);
      const overdue = isOverdue(
        action.dueDate,
        action.status as "TODO" | "DOING" | "DONE" | "BLOCKED",
      );
      return {
        ...action,
        dueMeta,
        overdue,
      };
    },
  );

  type ActionWithMeta = (typeof actionsWithMeta)[number];

  let inProgressCount = 0;
  let blockedCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  for (const a of actionsWithMeta) {
    if (a.status === "DONE") completedCount++;
    else if (a.status === "BLOCKED") blockedCount++;
    else if (a.overdue) overdueCount++;
    else inProgressCount++;
  }

  const decisionsCount = await prisma.decision.count({
    where: {
      project: projectsWhere,
    },
  });

  const projectsCount = await prisma.project.count({
    where: projectsWhere,
  });

  const totalActions = actionsWithMeta.length;

  return (
    <div className="space-y-8">
      <ActionsPageClient />
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
            <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-5 py-2.5 h-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.newAction")}
            </Button>
          </Link>
        </div>
      </div>

      {totalActions > 0 && (
        <div className="hidden md:block">
          <ActionsStatsWidget
            inProgressCount={inProgressCount}
            blockedCount={blockedCount}
            completedCount={completedCount}
            overdueCount={overdueCount}
            decisionsCount={decisionsCount}
            projectsCount={projectsCount}
          />
        </div>
      )}

      {actionsWithMeta.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={t("emptyStates.noActions")}
          description={t("actions.emptyStateDescription")}
          ctaLabel={t("actions.createFirst")}
          ctaAction="/app/actions/new"
        />
      ) : (
        <ActionsListWithFilters
          initialTab={initialTab}
          initialQuickFilter={initialQuickFilter}
          actions={actionsWithMeta.map((action: ActionWithMeta) => ({
            id: action.id,
            title: action.title,
            description: action.description,
            status: action.status,
            priority: action.priority || "normal",
            blockReason: action.blockReason,
            dueDate: action.dueDate ? action.dueDate.toISOString() : null,
            createdAt: action.createdAt.toISOString(),
            project: action.project,
            decision: action.decision,
            overdue: action.overdue,
            assignee: action.assignee
              ? {
                  id: action.assignee.id,
                  name: action.assignee.name,
                  email: action.assignee.email,
                  avatarUrl: action.assignee.avatarUrl,
                }
              : null,
            dueMeta: {
              label: action.dueMeta.label,
              color:
                action.dueMeta.kind === "OVERDUE" ? "#B91C1C" : "#667085",
            },
          }))}
        />
      )}
    </div>
  );
}
