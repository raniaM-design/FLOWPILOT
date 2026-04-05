"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Calendar, FolderKanban, CheckSquare } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { isOverdue } from "@/lib/timeUrgency";
import { updateActionStatus } from "@/app/app/actions";
import {
  DashboardPriorityQuickAction,
  getMobilePriorityQuickKind,
} from "@/components/dashboard/dashboard-priority-quick-action";
import { SwipeablePriorityMobileRow } from "@/components/dashboard/swipeable-priority-mobile-row";
import { cn } from "@/lib/utils";

interface PriorityAction {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  projectId: string;
  project: { id: string; name: string };
}

interface PrioritiesListProps {
  actions: PriorityAction[];
  /** Nombre total de priorités (hors limite d’affichage serveur) */
  totalCount: number;
}

type PriorityStatusKind = "overdue" | "blocked" | "today" | "week" | "todo";

function truncatePriorityTitleMobile(title: string, maxChars = 40): string {
  if (title.length <= maxChars) return title;
  return `${title.slice(0, maxChars)}...`;
}

function getPriorityStatusKind(action: PriorityAction): PriorityStatusKind {
  const overdue = isOverdue(
    action.dueDate,
    action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"
  );
  if (overdue) return "overdue";
  if (action.status === "BLOCKED") return "blocked";
  if (action.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(action.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "today";
    if (diffDays <= 7) return "week";
  }
  return "todo";
}

function getStatusStyle(kind: PriorityStatusKind): { color: string; bg: string } {
  switch (kind) {
    case "overdue":
      return { color: "text-red-700", bg: "bg-red-100" };
    case "blocked":
      return { color: "text-orange-700", bg: "bg-orange-100" };
    case "today":
    case "week":
      return { color: "text-blue-700", bg: "bg-blue-100" };
    default:
      return { color: "text-slate-700", bg: "bg-slate-100" };
  }
}

function getIconColorForKind(kind: PriorityStatusKind): string {
  if (kind === "overdue") return "bg-red-100 text-red-600";
  if (kind === "blocked") return "bg-orange-100 text-orange-600";
  return "bg-blue-100 text-blue-600";
}

/**
 * Liste intelligente des priorités - Section principale du dashboard
 */
export function PrioritiesList({ actions, totalCount }: PrioritiesListProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.priorities");
  const [isPending, startTransition] = useTransition();

  const markActionDone = useCallback(
    (actionId: string) => {
      startTransition(async () => {
        await updateActionStatus(actionId, "DONE");
        router.refresh();
      });
    },
    [router],
  );

  const labelForKind = (kind: PriorityStatusKind): string => {
    switch (kind) {
      case "overdue":
        return t("statusOverdue");
      case "blocked":
        return t("statusBlocked");
      case "today":
        return t("statusToday");
      case "week":
        return t("statusThisWeek");
      default:
        return t("statusTodo");
    }
  };

  if (actions.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#E8EAF0] bg-white p-8 text-center shadow-none">
        <p className="text-slate-600">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#E8EAF0] bg-white shadow-none">
      <div className="flex items-center justify-between border-b border-[#E8EAF0] px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">{t("title")}</h2>
        <span className="text-sm text-slate-500">
          {totalCount}{" "}
          {totalCount <= 1 ? t("elementOne") : t("elementMany")}
        </span>
      </div>
      <div className="divide-y divide-[#E8EAF0]">
        {actions.map((action, index) => {
          const kind = getPriorityStatusKind(action);
          const style = getStatusStyle(kind);
          const iconColor = getIconColorForKind(kind);
          const label = labelForKind(kind);
          const hideOnMobile = index >= 3;
          const showOverdueBorder = kind === "overdue";
          const quickKind = getMobilePriorityQuickKind(
            action.status,
            action.dueDate
          );
          const swipeToComplete =
            action.status !== "DONE" && quickKind === "termine";

          return (
            <div
              key={action.id}
              className={cn(
                "transition-colors hover:bg-[#FAFBFD]",
                hideOnMobile && "hidden md:block"
              )}
            >
              <SwipeablePriorityMobileRow
                swipeToCompleteEnabled={swipeToComplete && !isPending}
                onSwipeComplete={() => markActionDone(action.id)}
                className={cn(
                  "md:hidden",
                  showOverdueBorder && "border-l-4 border-l-red-500",
                )}
              >
                <div className="flex items-center gap-3 p-3">
                  <Link
                    href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-1"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {truncatePriorityTitleMobile(action.title)}
                      </h3>
                    </div>
                    <span
                      className={`self-start rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.color}`}
                    >
                      {label}
                    </span>
                  </Link>
                  <DashboardPriorityQuickAction
                    actionId={action.id}
                    status={action.status}
                    dueDate={action.dueDate}
                  />
                </div>
              </SwipeablePriorityMobileRow>

              <div className="hidden items-start justify-between gap-4 p-4 md:flex">
                <Link
                  href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                  className="flex min-w-0 flex-1 items-start gap-3"
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
                  >
                    <CheckSquare className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {action.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.color}`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        {action.project.name}
                      </span>
                      {action.dueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(action.dueDate).toLocaleDateString(
                              locale === "en" ? "en-US" : "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
                <ActionStatusWrapper>
                  <ActionStatusButtons
                    actionId={action.id}
                    currentStatus={
                      action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"
                    }
                  />
                </ActionStatusWrapper>
              </div>
            </div>
          );
        })}
      </div>
      {totalCount > 3 && (
        <div className="border-t border-[#E8EAF0] p-4 md:hidden">
          <Link
            href="/app/actions"
            className="block text-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            {t("viewAll", { count: totalCount })}
          </Link>
        </div>
      )}
      {totalCount > 7 && (
        <div className="hidden border-t border-[#E8EAF0] p-4 md:block">
          <Link
            href="/app/actions"
            className="block text-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            {t("viewAllTasks", { count: totalCount })}
          </Link>
        </div>
      )}
    </div>
  );
}
