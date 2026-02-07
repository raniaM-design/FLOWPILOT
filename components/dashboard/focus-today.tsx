"use client";

import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { FolderKanban, Calendar, Sparkles, Target, ArrowRight, AlertCircle, AlertTriangle, CheckSquare, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

interface FocusTodayProps {
  actions: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    projectId: string;
    project: { id: string; name: string };
    decisionId: string | null;
    decision: { id: string } | null;
  }>;
}

/**
 * Bloc "Action principale du jour" - Coach silencieux
 * Met en avant UNE action principale pour réduire la charge mentale
 */
export function FocusToday({ actions }: FocusTodayProps) {
  const t = useTranslations("dashboard");
  
  // La première action est la priorité absolue
  const mainAction = actions.length > 0 ? actions[0] : null;
  const otherActions = actions.slice(1, 3);

  if (!mainAction) {
    return (
      <FlowCard variant="default">
        <FlowCardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.4)' }}>
              <Sparkles className="h-8 w-8" style={{ color: 'hsl(var(--primary) / 0.8)' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-normal text-text-secondary leading-relaxed max-w-md">
              {t("noPriorityAction")}
            </p>
          </div>
        </FlowCardContent>
      </FlowCard>
    );
  }

  const dueMeta = getDueMeta(mainAction.dueDate);
  const overdue = isOverdue(mainAction.dueDate, mainAction.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
  const isBlocked = mainAction.status === "BLOCKED";

  // Couleurs selon l'état
  const getActionColors = () => {
    if (overdue) {
      return {
        cardBg: "bg-gradient-to-br from-red-50 via-red-50/50 to-orange-50/30",
        borderColor: "border-l-4 border-red-500",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        headerIconBg: "bg-gradient-to-br from-red-500 to-red-600",
        headerIconColor: "text-white",
      };
    }
    if (isBlocked) {
      return {
        cardBg: "bg-gradient-to-br from-orange-50 via-amber-50/50 to-yellow-50/30",
        borderColor: "border-l-4 border-orange-500",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        headerIconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
        headerIconColor: "text-white",
      };
    }
    return {
      cardBg: "bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30",
      borderColor: "border-l-4 border-blue-500",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      headerIconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      headerIconColor: "text-white",
    };
  };

  const colors = getActionColors();

  return (
    <div className="space-y-4">
      {/* Action principale - Design professionnel */}
      <div className={`${overdue ? "bg-red-50" : isBlocked ? "bg-orange-50" : "bg-blue-50"} rounded-xl shadow-lg`}>
        <div className="p-5">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-slate-900">
                {t("actionOfTheDay")}
              </h3>
              {overdue && (
                <span className="px-3 py-1 rounded-full bg-red-200 text-red-800 text-sm font-bold">
                  {t("urgent")}
                </span>
              )}
              {isBlocked && (
                <span className="px-3 py-1 rounded-full bg-orange-200 text-orange-800 text-sm font-bold">
                  {t("blockedChip")}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {overdue 
                ? t("actionNeedsAttention")
                : isBlocked
                ? t("actionBlocked")
                : t("startWithThis")
              }
            </p>
          </div>

          {/* Action principale */}
          <Link
            href={`/app/projects/${mainAction.projectId}?actionId=${mainAction.id}`}
            className="block group"
          >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-3 bg-white rounded-lg hover:shadow-md transition-all">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colors.iconBg}`}>
                  <CheckSquare className={`h-4 w-4 ${colors.iconColor}`} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                    {mainAction.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium">{mainAction.project.name}</span>
                    {mainAction.dueDate && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(mainAction.dueDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ActionStatusWrapper>
                <ActionStatusButtons
                  actionId={mainAction.id}
                  currentStatus={mainAction.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                />
              </ActionStatusWrapper>
            </div>
          </Link>
        </div>
      </div>

      {/* Autres actions prioritaires - Design épuré comme dans l'image */}
      {otherActions.length > 0 && (
        <div className="space-y-3">
          {otherActions.map((action) => {
            const actionDueMeta = getDueMeta(action.dueDate);
            const actionOverdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
            const actionIsBlocked = action.status === "BLOCKED";

            const getOtherActionColors = () => {
              if (actionOverdue) {
                return {
                  bg: "bg-slate-50",
                  border: "border border-slate-200",
                  iconBg: "bg-red-100",
                  iconColor: "text-red-600",
                };
              }
              if (actionIsBlocked) {
                return {
                  bg: "bg-slate-50",
                  border: "border border-slate-200",
                  iconBg: "bg-orange-100",
                  iconColor: "text-orange-600",
                };
              }
              return {
                bg: "bg-slate-50",
                border: "border border-slate-200",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
              };
            };

            const colors = getOtherActionColors();

            return (
              <Link
                key={action.id}
                href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                className="block group"
              >
                <div className={`flex flex-col sm:flex-row items-start justify-between gap-4 p-3 rounded-lg ${colors.bg} shadow-sm hover:shadow-md transition-all`}>
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${colors.iconBg}`}>
                        <CheckSquare className={`h-3 w-3 ${colors.iconColor}`} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {action.title}
                          </h5>
                          {actionOverdue && (
                            <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-xs font-bold">
                              {t("overdueChip")}
                            </span>
                          )}
                          {actionIsBlocked && !actionOverdue && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-200 text-orange-800 text-xs font-bold">
                              {t("blockedChip")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 pl-8">
                          <span className="font-medium">{action.project.name}</span>
                          {action.dueDate && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(action.dueDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <ActionStatusWrapper>
                    <ActionStatusButtons
                      actionId={action.id}
                      currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                    />
                  </ActionStatusWrapper>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
