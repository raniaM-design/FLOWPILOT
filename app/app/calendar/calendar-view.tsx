"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chip } from "@/components/ui/chip";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, Ban, CheckSquare2, TrendingUp, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DueMeta } from "@/lib/timeUrgency";
import { ActionDueBadge } from "@/components/action-due-badge";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";

type ActionItem = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  dueMeta: DueMeta;
  overdue: boolean;
  project: { id: string; name: string };
  decision: { id: string; title: string } | null;
};

interface CalendarViewProps {
  actions: ActionItem[];
  projects: Array<{ id: string; name: string }>;
  initialProjectId?: string;
  initialStatus?: string;
}

export function CalendarView({
  actions,
  projects,
  initialProjectId,
  initialStatus,
}: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("calendar");
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || "all");

  // Navigation semaine/mois
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Appliquer les filtres
  const updateFilters = (projectId: string, status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) {
      params.set("projectId", projectId);
    } else {
      params.delete("projectId");
    }
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`/app/calendar?${params.toString()}`);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    updateFilters(projectId, selectedStatus);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    updateFilters(selectedProjectId, status);
  };

  // Filtrer les actions selon les filtres
  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if (selectedProjectId && action.project.id !== selectedProjectId) {
        return false;
      }
      if (selectedStatus === "open" && action.status === "DONE") {
        return false;
      }
      if (selectedStatus === "done" && action.status !== "DONE") {
        return false;
      }
      if (selectedStatus === "blocked" && action.status !== "BLOCKED") {
        return false;
      }
      return true;
    });
  }, [actions, selectedProjectId, selectedStatus]);

  // Helper pour obtenir les actions d'un jour donné
  const getActionsForDate = (date: Date): ActionItem[] => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredActions.filter((action) => {
      if (!action.dueDate) return false;
      const actionDateStr = new Date(action.dueDate).toISOString().split("T")[0];
      return actionDateStr === dateStr;
    });
  };

  // Calculer les statistiques d'un jour
  const getDayStats = (date: Date) => {
    const dayActions = getActionsForDate(date);
    const overdueCount = dayActions.filter((a) => a.overdue).length;
    const blockedCount = dayActions.filter((a) => a.status === "BLOCKED").length;
    const doneCount = dayActions.filter((a) => a.status === "DONE").length;
    const openCount = dayActions.filter((a) => a.status !== "DONE").length;
    
    // Calculer la charge (0-100)
    const totalActions = dayActions.length;
    const maxActionsInWeek = Math.max(...Array.from({ length: 7 }, (_, i) => {
      const weekStart = new Date(currentDate);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + i);
      return getActionsForDate(checkDate).length;
    }), 1);
    
    const loadPercentage = maxActionsInWeek > 0 ? (totalActions / maxActionsInWeek) * 100 : 0;
    
    return {
      total: totalActions,
      overdue: overdueCount,
      blocked: blockedCount,
      done: doneCount,
      open: openCount,
      loadPercentage,
      isCritical: overdueCount > 0 || blockedCount > 0,
      isHeavy: totalActions >= 5,
      isLight: totalActions <= 2,
    };
  };

  // Vue Semaine
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    const navigateWeek = (direction: "prev" | "next") => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      setCurrentDate(newDate);
    };

    const isToday = (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      return dateOnly.getTime() === today.getTime();
    };

    // Calculer les stats de la semaine pour le résumé
    const weekStats = weekDays.map((date) => ({
      date,
      stats: getDayStats(date),
    }));

    const totalWeekActions = weekStats.reduce((sum, day) => sum + day.stats.total, 0);
    const totalWeekOverdue = weekStats.reduce((sum, day) => sum + day.stats.overdue, 0);
    const totalWeekBlocked = weekStats.reduce((sum, day) => sum + day.stats.blocked, 0);
    const criticalDays = weekStats.filter((day) => day.stats.isCritical).length;
    const heavyDays = weekStats.filter((day) => day.stats.isHeavy).length;

    return (
      <div className="space-y-6">
        {/* Résumé stratégique de la semaine */}
        <FlowCard variant="elevated" className="border-border dark:shadow-sm">
          <FlowCardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                  Vue d'ensemble de la semaine
                </h3>
                <p className="text-sm text-muted-foreground">
                  Charge et points critiques
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-transparent dark:bg-card dark:border-border dark:shadow-none">
                <div className="text-2xl font-bold text-foreground mb-1">{totalWeekActions}</div>
                <div className="text-xs text-muted-foreground font-medium">Actions totales</div>
              </div>
              {totalWeekOverdue > 0 && (
                <div className="text-center p-3 bg-red-950/30 dark:bg-red-950/40 rounded-xl border border-red-500/20 dark:border-red-500/30">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{totalWeekOverdue}</div>
                  <div className="text-xs text-muted-foreground font-medium">En retard</div>
                </div>
              )}
              {totalWeekBlocked > 0 && (
                <div className="text-center p-3 bg-amber-950/30 dark:bg-amber-950/40 rounded-xl border border-amber-500/20 dark:border-amber-500/30">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">{totalWeekBlocked}</div>
                  <div className="text-xs text-muted-foreground font-medium">Bloquées</div>
                </div>
              )}
              {criticalDays > 0 && (
                <div className="text-center p-3 bg-orange-950/30 dark:bg-orange-950/40 rounded-xl border border-orange-500/20 dark:border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{criticalDays}</div>
                  <div className="text-xs text-muted-foreground font-medium">Jours critiques</div>
                </div>
              )}
              {heavyDays > 0 && (
                <div className="text-center p-3 bg-blue-950/30 dark:bg-blue-950/40 rounded-xl border border-blue-500/20 dark:border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{heavyDays}</div>
                  <div className="text-xs text-muted-foreground font-medium">Jours chargés</div>
                </div>
              )}
            </div>

            {/* Barre de charge par jour */}
            <div className="grid grid-cols-7 gap-2">
              {weekStats.map(({ date, stats }) => {
                const isTodayDate = isToday(date);
                const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" });
                const dayNumber = date.getDate();
                
                // Déterminer la couleur selon la charge
                let summaryColors;
                if (isTodayDate) {
                  summaryColors = {
                    border: "border-primary border-2 bg-primary/10 dark:bg-primary/5 ring-1 ring-primary/10 dark:ring-primary/20",
                    text: "text-primary",
                    bar: "bg-primary",
                  };
                } else if (stats.isCritical || stats.isHeavy) {
                  summaryColors = {
                    border: "border-red-500/50 dark:border-red-500/60 bg-red-50/50 dark:bg-red-950/30",
                    text: "text-red-700 dark:text-red-400",
                    bar: "bg-red-500 dark:bg-red-400",
                  };
                } else if (stats.isLight && stats.total > 0) {
                  summaryColors = {
                    border: "border-emerald-500/50 dark:border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30",
                    text: "text-emerald-700 dark:text-emerald-400",
                    bar: "bg-emerald-500 dark:bg-emerald-400",
                  };
                } else if (stats.total === 0) {
                  summaryColors = {
                    border: "border-border/50 bg-card/50 opacity-60",
                    text: "text-muted-foreground/50",
                    bar: "bg-muted",
                  };
                } else {
                  summaryColors = {
                    border: "border-border bg-card",
                    text: "text-foreground",
                    bar: "bg-blue-500 dark:bg-blue-400",
                  };
                }

                return (
                    <div
                      key={date.toISOString()}
                      className={`text-center p-2 rounded-lg border transition-all ${summaryColors.border}`}
                    >
                      <div className={`text-xs font-medium mb-1 ${summaryColors.text}`}>
                        {dayName}
                      </div>
                      <div className={`text-base font-bold mb-1.5 ${summaryColors.text}`}>
                        {dayNumber}
                      </div>
                      {stats.total > 0 && (
                        <>
                          <div className={`text-xs font-semibold mb-1 ${summaryColors.text}`}>{stats.total}</div>
                          {/* Barre de charge visuelle */}
                          <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mb-1">
                            <div
                              className={`h-full transition-all ${summaryColors.bar}`}
                              style={{ width: `${Math.min(stats.loadPercentage, 100)}%` }}
                            />
                          </div>
                        {(stats.overdue > 0 || stats.blocked > 0) && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {stats.overdue > 0 && (
                              <div className="flex items-center gap-0.5">
                                <AlertCircle className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                                <span className="text-[9px] font-medium text-orange-600 dark:text-orange-400">{stats.overdue}</span>
                              </div>
                            )}
                            {stats.blocked > 0 && stats.overdue === 0 && (
                              <div className="flex items-center gap-0.5">
                                <Ban className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                                <span className="text-[9px] font-medium text-orange-600 dark:text-orange-400">{stats.blocked}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </FlowCardContent>
        </FlowCard>

        {/* Navigation semaine */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateWeek("prev")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="font-medium text-base text-foreground">
              {startOfWeek.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}{" "}
              —{" "}
              {weekDays[6].toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="font-medium"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek("next")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Grille semaine */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((date, index) => {
            const dayActions = getActionsForDate(date);
            const dayStats = getDayStats(date);
            const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" });
            const dayNumber = date.getDate();
            const isTodayDate = isToday(date);

            // Trier les actions : critiques d'abord (overdue, blocked), puis urgentes, puis le reste
            const sortedActions = [...dayActions].sort((a, b) => {
              if (a.overdue && !b.overdue) return -1;
              if (!a.overdue && b.overdue) return 1;
              if (a.status === "BLOCKED" && b.status !== "BLOCKED") return -1;
              if (a.status !== "BLOCKED" && b.status === "BLOCKED") return 1;
              if (a.dueMeta.kind === "TODAY" && b.dueMeta.kind !== "TODAY") return -1;
              if (a.dueMeta.kind !== "TODAY" && b.dueMeta.kind === "TODAY") return 1;
              return 0;
            });

            // Déterminer la couleur de la journée selon la charge
            const getDayColorClasses = () => {
              if (isTodayDate) {
                return {
                  border: "border-primary border-2 ring-2 ring-primary/10 dark:ring-primary/20",
                  bg: "bg-primary/5 dark:bg-primary/10",
                  text: "text-primary",
                  headerBg: "bg-primary/10 dark:bg-primary/20",
                };
              }
              if (dayStats.isCritical || dayStats.isHeavy) {
                // Rouge pour journées très chargées (5+ actions ou critiques)
                return {
                  border: "border-red-500/50 dark:border-red-500/60 border-2",
                  bg: "bg-red-50/50 dark:bg-red-950/30",
                  text: "text-red-700 dark:text-red-400",
                  headerBg: "bg-red-100/50 dark:bg-red-950/40",
                };
              }
              if (dayStats.isLight && dayStats.total > 0) {
                // Vert pour journées moins chargées (1-2 actions)
                return {
                  border: "border-emerald-500/50 dark:border-emerald-500/60 border-2",
                  bg: "bg-emerald-50/50 dark:bg-emerald-950/30",
                  text: "text-emerald-700 dark:text-emerald-400",
                  headerBg: "bg-emerald-100/50 dark:bg-emerald-950/40",
                };
              }
              // Par défaut
              return {
                border: "border-border",
                bg: "bg-card",
                text: "text-foreground",
                headerBg: "bg-section-bg/30",
              };
            };

            const dayColors = getDayColorClasses();

            return (
              <FlowCard
                key={index}
                variant="default"
                className={`transition-all shadow-sm hover:shadow-md ${
                  dayActions.length === 0 ? "min-h-[120px]" : "min-h-[200px]"
                } ${dayColors.border} ${dayColors.bg}`}
              >
                <FlowCardContent className={`p-4 ${dayActions.length === 0 ? "py-3" : ""}`}>
                  {/* En-tête du jour */}
                  <div className={`${dayActions.length > 0 ? "mb-4 pb-3 border-b border-border/50" : "mb-2"} ${dayColors.headerBg} -mx-4 -mt-4 px-4 pt-4 rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium ${
                          isTodayDate ? "text-primary font-semibold" : dayColors.text
                        }`}>
                          {dayName}
                        </p>
                        <p className={`font-bold ${
                          isTodayDate ? "text-2xl text-primary" : `text-xl ${dayColors.text}`
                        }`}>
                          {dayNumber}
                        </p>
                      </div>
                      {dayStats.total > 0 && (
                        <div className="text-right">
                          <div className={`text-base font-semibold ${dayColors.text}`}>
                            {dayStats.total}
                          </div>
                          <div className={`text-[10px] ${dayColors.text}/70`}>actions</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicateurs critiques - seulement si critiques */}
                    {(dayStats.overdue > 0 || dayStats.blocked > 0) && dayActions.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {dayStats.overdue > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            <span className="font-medium">{dayStats.overdue}</span>
                          </div>
                        )}
                        {dayStats.blocked > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                            <Ban className="h-3 w-3" />
                            <span className="font-medium">{dayStats.blocked}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Liste des actions */}
                  <div className="space-y-1.5">
                    {sortedActions.map((action) => {
                      const isDone = action.status === "DONE";
                      const isOverdue = action.overdue;
                      const isBlocked = action.status === "BLOCKED";
                      
                      // Déterminer la couleur de l'icône et du texte
                      let iconColor = "text-muted-foreground";
                      let textColor = "text-foreground";
                      let borderColor = "border-border";
                      let bgColor = "bg-card";
                      
                      if (isOverdue) {
                        iconColor = "text-orange-600 dark:text-orange-400";
                        textColor = "text-foreground";
                        borderColor = "border-orange-500/30 dark:border-orange-500/40";
                        bgColor = "bg-orange-950/10 dark:bg-orange-950/20";
                      } else if (isBlocked) {
                        iconColor = "text-orange-600 dark:text-orange-400";
                        textColor = "text-foreground";
                        borderColor = "border-orange-500/30 dark:border-orange-500/40";
                        bgColor = "bg-orange-950/10 dark:bg-orange-950/20";
                      } else if (isDone) {
                        iconColor = "text-emerald-600 dark:text-emerald-500";
                        textColor = "text-muted-foreground";
                        borderColor = "border-border";
                        bgColor = "bg-card";
                      } else {
                        iconColor = "text-blue-600 dark:text-blue-400";
                        textColor = "text-foreground";
                        borderColor = "border-border";
                        bgColor = "bg-card";
                      }
                      
                      return (
                        <Link
                          key={action.id}
                          href={
                            action.decision
                              ? `/app/decisions/${action.decision.id}`
                              : `/app/projects/${action.project.id}`
                          }
                          className="block group"
                        >
                          <div
                            className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:border-primary/40 cursor-pointer ${borderColor} ${bgColor} ${
                              isDone ? "opacity-70" : ""
                            }`}
                          >
                            {/* Icône Action systématique */}
                            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" strokeWidth={1.75} />
                            
                            {/* Titre et métadonnées sur une ligne */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium line-clamp-1 ${isDone ? "line-through" : ""} ${textColor} group-hover:text-primary transition-colors`}>
                                {action.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                {action.project.name}
                                {action.decision && ` • ${action.decision.title}`}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    {dayActions.length === 0 && (
                      <div className="text-center py-4">
                        <Calendar className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1.5" />
                        <p className="text-[11px] text-muted-foreground/70 font-normal">Journée libre</p>
                      </div>
                    )}
                  </div>
                </FlowCardContent>
              </FlowCard>
            );
          })}
        </div>
      </div>
    );
  };

  // Vue Mois
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1)); // Lundi

    const navigateMonth = (direction: "prev" | "next") => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      setCurrentDate(newDate);
    };

    const isToday = (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      return (
        dateOnly.getTime() === today.getTime() &&
        dateOnly.getMonth() === today.getMonth() &&
        dateOnly.getFullYear() === today.getFullYear()
      );
    };

    const isCurrentMonth = (date: Date) => {
      return date.getMonth() === month && date.getFullYear() === year;
    };

    const days: Date[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="space-y-4">
        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="font-semibold text-lg">
              {currentDate.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Grille mois */}
        <div className="space-y-2">
          {/* En-têtes jours */}
          <div className="grid grid-cols-7 gap-2">
            {[
              t("days.monday"),
              t("days.tuesday"),
              t("days.wednesday"),
              t("days.thursday"),
              t("days.friday"),
              t("days.saturday"),
              t("days.sunday"),
            ].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille calendrier */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              const dayActions = getActionsForDate(date);
              const dayStats = getDayStats(date);
              const dayNumber = date.getDate();
              const isTodayDate = isToday(date);
              const isCurrentMonthDate = isCurrentMonth(date);

              // Trier les actions : critiques d'abord
              const sortedActions = [...dayActions].sort((a, b) => {
                if (a.overdue && !b.overdue) return -1;
                if (!a.overdue && b.overdue) return 1;
                if (a.status === "BLOCKED" && b.status !== "BLOCKED") return -1;
                if (a.status !== "BLOCKED" && b.status === "BLOCKED") return 1;
                return 0;
              });

              // Déterminer la couleur selon la charge pour la vue mois
              const getMonthDayColorClasses = () => {
                if (isTodayDate) {
                  return {
                    border: "border-primary border-2 ring-1 ring-primary/10 dark:ring-primary/20",
                    bg: "bg-primary/5 dark:bg-primary/10",
                    text: "text-primary",
                    bar: "bg-primary",
                  };
                }
                if (dayStats.isCritical || dayStats.isHeavy) {
                  return {
                    border: "border-red-500/50 dark:border-red-500/60 border-2",
                    bg: "bg-red-50/50 dark:bg-red-950/30",
                    text: "text-red-700 dark:text-red-400",
                    bar: "bg-red-500 dark:bg-red-400",
                  };
                }
                if (dayStats.isLight && dayStats.total > 0) {
                  return {
                    border: "border-emerald-500/50 dark:border-emerald-500/60 border-2",
                    bg: "bg-emerald-50/50 dark:bg-emerald-950/30",
                    text: "text-emerald-700 dark:text-emerald-400",
                    bar: "bg-emerald-500 dark:bg-emerald-400",
                  };
                }
                if (!isCurrentMonthDate) {
                  return {
                    border: "border-border/50",
                    bg: "bg-card/30",
                    text: "text-muted-foreground/50",
                    bar: "bg-muted",
                  };
                }
                return {
                  border: "border-border",
                  bg: "bg-card",
                  text: "text-foreground",
                  bar: "bg-blue-500 dark:bg-blue-400",
                };
              };

              const monthColors = getMonthDayColorClasses();

              return (
                <FlowCard
                  key={index}
                  variant="default"
                  className={`min-h-[120px] transition-all shadow-sm hover:shadow-md ${monthColors.border} ${monthColors.bg} ${!isCurrentMonthDate ? "opacity-40" : ""}`}
                >
                  <FlowCardContent className="p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className={`text-sm font-bold ${monthColors.text}`}>
                        {dayNumber}
                      </p>
                      {dayStats.total > 0 && (
                        <div className={`text-xs font-semibold ${monthColors.text}`}>
                          {dayStats.total}
                        </div>
                      )}
                    </div>
                    
                    {/* Barre de charge */}
                    {dayStats.total > 0 && (
                      <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full ${monthColors.bar}`}
                          style={{ width: `${Math.min(dayStats.loadPercentage, 100)}%` }}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {sortedActions.slice(0, 3).map((action) => {
                        const isCritical = action.overdue || action.status === "BLOCKED";
                        return (
                          <Link
                            key={action.id}
                            href={
                              action.decision
                                ? `/app/decisions/${action.decision.id}`
                                : `/app/projects/${action.project.id}`
                            }
                          >
                            <div
                              className={`text-[10px] p-1.5 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                                action.overdue
                                  ? "border-red-500/30 dark:border-red-500/40 bg-red-950/20 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                                  : action.status === "BLOCKED"
                                  ? "border-amber-500/30 dark:border-amber-500/40 bg-amber-950/20 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                                  : "border-border bg-card hover:bg-muted/30 text-foreground"
                              } ${isCritical ? "ring-1 ring-red-500/20 dark:ring-red-500/30" : ""}`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                {action.overdue && (
                                  <AlertCircle className="h-2 w-2 text-red-600 dark:text-red-400 flex-shrink-0" />
                                )}
                                {action.status === "BLOCKED" && !action.overdue && (
                                  <Ban className="h-2 w-2 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                )}
                                <p className={`font-medium line-clamp-1 flex-1 ${
                                  action.status === "DONE" ? "line-through text-muted-foreground" : ""
                                }`}>
                                  {action.title}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      {dayActions.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          +{dayActions.length - 3} autre{dayActions.length - 3 > 1 ? "s" : ""}
                        </p>
                      )}
                      {dayActions.length === 0 && isCurrentMonthDate && (
                        <div className="text-center py-2">
                          <div className="h-1 w-full bg-muted rounded-full" />
                        </div>
                      )}
                    </div>
                  </FlowCardContent>
                </FlowCard>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <FlowCard variant="default" className="border-border">
        <FlowCardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Projet:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Tous les projets</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Statut:</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">Tous</option>
                <option value="open">Ouvertes</option>
                <option value="done">Terminées</option>
                <option value="blocked">Bloquées</option>
              </select>
            </div>
            <div className="flex-1" />
            <Chip variant="neutral" size="md">
              {filteredActions.length} action{filteredActions.length > 1 ? "s" : ""}
            </Chip>
          </div>
        </FlowCardContent>
      </FlowCard>

      {/* Switch vue */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "week" | "month")}>
        <TabsList>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="month">Mois</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Vue calendrier */}
      {viewMode === "week" ? renderWeekView() : renderMonthView()}
    </div>
  );
}
