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
    <div className="space-y-4 sm:space-y-6">
      {/* Action principale - Mise en avant avec design amélioré */}
      <FlowCard variant="elevated" className={`${colors.borderColor} ${colors.cardBg}`}>
        <FlowCardContent className="p-4 sm:p-6 lg:p-8">
          {/* Header avec icône grande et visible */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${colors.headerIconBg}`}>
                <Zap className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 ${colors.headerIconColor}`} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
                    {t("actionOfTheDay")}
                  </h3>
                  {overdue && (
                    <Chip variant="danger" size="sm" className="font-medium bg-red-100 text-red-700 border-red-300">
                      {t("urgent")}
                    </Chip>
                  )}
                  {isBlocked && (
                    <Chip variant="warning" size="sm" className="font-medium bg-orange-100 text-orange-700 border-orange-300">
                      {t("blockedChip")}
                    </Chip>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {overdue 
                    ? t("actionNeedsAttention")
                    : isBlocked
                    ? t("actionBlocked")
                    : t("startWithThis")
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action principale - Carte élégante */}
          <Link
            href={`/app/projects/${mainAction.projectId}?actionId=${mainAction.id}`}
            className="block group"
          >
            <div className={`flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${colors.cardBg} hover:shadow-lg transition-all duration-200 ease-out border border-white/50`}>
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${colors.iconBg}`}>
                    <CheckSquare className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-foreground leading-relaxed group-hover:text-primary transition-colors duration-200 ease-out mb-2 sm:mb-3">
                      {mainAction.title}
                    </h4>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 font-normal">
                        <FolderKanban className="h-4 w-4" />
                        <span>{mainAction.project.name}</span>
                      </span>
                      {mainAction.dueDate && (
                        <>
                          <span className="text-border">•</span>
                          <span className="flex items-center gap-2 font-normal">
                            <Calendar className="h-4 w-4" />
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
              </div>
              <ActionStatusWrapper>
                <ActionStatusButtons
                  actionId={mainAction.id}
                  currentStatus={mainAction.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                />
              </ActionStatusWrapper>
            </div>
          </Link>
        </FlowCardContent>
      </FlowCard>

      {/* Autres actions prioritaires (si présentes) - Design plus discret */}
      {otherActions.length > 0 && (
        <FlowCard variant="default">
          <FlowCardContent className="space-y-3">
            {otherActions.map((action) => {
              const actionDueMeta = getDueMeta(action.dueDate);
              const actionOverdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
              const actionIsBlocked = action.status === "BLOCKED";

              const getOtherActionColors = () => {
                if (actionOverdue) {
                  return {
                    bg: "bg-red-50/60",
                    border: "border-l-2 border-red-400",
                    iconBg: "bg-red-100",
                    iconColor: "text-red-600",
                  };
                }
                if (actionIsBlocked) {
                  return {
                    bg: "bg-orange-50/60",
                    border: "border-l-2 border-orange-400",
                    iconBg: "bg-orange-100",
                    iconColor: "text-orange-600",
                  };
                }
                return {
                  bg: "bg-blue-50/60",
                  border: "border-l-2 border-blue-400",
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
                  <div className={`flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-5 p-3 sm:p-4 rounded-lg sm:rounded-xl ${colors.bg} ${colors.border} hover:shadow-md transition-all duration-200 ease-out`}>
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex items-start gap-2 mb-1 sm:mb-1.5">
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colors.iconBg}`}>
                          <CheckSquare className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${colors.iconColor}`} strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors duration-150 ease-out">
                              {action.title}
                            </h5>
                            {actionOverdue && (
                              <Chip variant="danger" size="sm" className="bg-red-100 text-red-700 border-red-300 font-medium">
                                {t("overdueChip")}
                              </Chip>
                            )}
                            {actionIsBlocked && (
                              <Chip variant="warning" size="sm" className="bg-orange-100 text-orange-700 border-orange-300 font-medium">
                                {t("blockedChip")}
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground pl-6 sm:pl-7">
                        <span className="flex items-center gap-1">
                          <FolderKanban className="h-3 w-3" />
                          {action.project.name}
                        </span>
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
          </FlowCardContent>
        </FlowCard>
      )}
    </div>
  );
}
