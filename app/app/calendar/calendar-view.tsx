"use client";

import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, Ban, CheckSquare, Clock, Zap, ListTodo, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSearch } from "@/contexts/search-context";
import { DueMeta } from "@/lib/timeUrgency";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

// Composant KPIs compact en haut
function CalendarKpis({ 
  totalActions, 
  overdueCount, 
  criticalDaysCount 
}: { 
  totalActions: number; 
  overdueCount: number; 
  criticalDaysCount: number;
}) {
  const t = useTranslations("calendar.kpis");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
      <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-100">
        <div className="text-xl sm:text-2xl font-bold text-slate-800">{totalActions}</div>
        <div className="text-xs text-slate-600 font-medium">{t("totalActions")}</div>
      </div>
      {overdueCount > 0 && (
        <div className="bg-red-50 rounded-lg p-2.5 sm:p-3 border border-red-100">
          <div className="text-xl sm:text-2xl font-bold text-red-600">{overdueCount}</div>
          <div className="text-xs text-slate-600 font-medium">{t("overdue")}</div>
        </div>
      )}
      {criticalDaysCount > 0 && (
        <div className={`bg-amber-50 rounded-lg p-2.5 sm:p-3 border border-amber-100 ${overdueCount === 0 ? 'col-span-2 sm:col-span-1' : 'col-span-2 sm:col-span-1'}`}>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">{criticalDaysCount}</div>
          <div className="text-xs text-slate-600 font-medium">{t("criticalDays")}</div>
        </div>
      )}
    </div>
  );
}

// Composant Carte Jour - style épuré avec en-tête bleu
function DayCard({
  date,
  actions,
  stats,
  isToday: isTodayDate,
  isSelected,
  onSelect,
}: {
  date: Date;
  actions: ActionItem[];
  stats: {
    total: number;
    overdue: number;
    blocked: number;
    isCritical: boolean;
    isHeavy: boolean;
  };
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("calendar");
  const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase();
  const dayNumber = date.getDate();

  // Style minimaliste inspiré de l'image
  const headerBg = isTodayDate 
    ? "bg-blue-400" 
    : stats.isCritical 
    ? "bg-red-200" 
    : stats.isHeavy 
    ? "bg-amber-200" 
    : "bg-blue-200";

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 flex flex-col h-full cursor-pointer hover:shadow-md active:shadow-lg transition-shadow touch-manipulation ${
        isSelected ? "ring-2 ring-blue-400" : ""
      }`}
      onClick={onSelect}
    >
      {/* En-tête bleu clair */}
      <div className={`${headerBg} px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 truncate pr-2">{dayName}</h3>
          {stats.total > 0 && (
            <span className="text-xs font-bold text-slate-700 bg-white/60 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">
              {stats.total}
            </span>
          )}
        </div>
      </div>

      {/* Contenu avec actions */}
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
        {stats.total === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 opacity-30" />
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {actions.slice(0, 6).map((action) => {
              const isOverdue = action.overdue;
              const isBlocked = action.status === "BLOCKED";
              const isDone = action.status === "DONE";

              return (
                <Link
                  key={action.id}
                  href={
                    action.decision
                      ? `/app/decisions/${action.decision.id}`
                      : `/app/projects/${action.project.id}`
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="block"
                >
                  <div
                    className={`p-2 sm:p-2.5 rounded border-l-3 sm:border-l-4 ${
                      isOverdue
                        ? "bg-red-50 border-red-400 hover:bg-red-100 active:bg-red-200"
                        : isBlocked
                        ? "bg-amber-50 border-amber-400 hover:bg-amber-100 active:bg-amber-200"
                        : isDone
                        ? "bg-slate-50 border-slate-300 opacity-60"
                        : "bg-blue-50 border-blue-400 hover:bg-blue-100 active:bg-blue-200"
                    } transition-colors touch-manipulation`}
                  >
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <CheckSquare
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 ${
                          isOverdue
                            ? "text-red-600"
                            : isBlocked
                            ? "text-amber-600"
                            : isDone
                            ? "text-slate-400"
                            : "text-blue-600"
                        }`}
                        strokeWidth={2.5}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold line-clamp-2 mb-0.5 sm:mb-1 ${
                            isDone ? "line-through text-slate-400" : "text-slate-700"
                          }`}
                        >
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {action.project.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {actions.length > 6 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="w-full text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium py-1 touch-manipulation"
              >
                +{actions.length - 6} autres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Badge d'état en bas */}
      {stats.total > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-lg">
          <div className="flex items-center gap-2 flex-wrap">
            {stats.overdue > 0 && (
              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.overdue}
              </span>
            )}
            {stats.blocked > 0 && stats.overdue === 0 && (
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                <Ban className="h-3 w-3" />
                {stats.blocked}
              </span>
            )}
            {!stats.isCritical && stats.total > 0 && stats.overdue === 0 && stats.blocked === 0 && (
              <span className="text-xs font-bold text-emerald-600">✓ OK</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant Panneau détail jour
function DayDetailsPanel({
  date,
  actions,
  isOpen,
  onClose,
}: {
  date: Date | null;
  actions: ActionItem[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("calendar");

  if (!date) return null;

  const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const dayNumber = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "long" });
  const year = date.getFullYear();

  const sortedActions = [...actions].sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    if (a.status === "BLOCKED" && b.status !== "BLOCKED") return -1;
    if (a.status !== "BLOCKED" && b.status === "BLOCKED") return 1;
    return 0;
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-slate-50">
        <SheetHeader className="mb-6 pb-4 border-b border-slate-200">
          <SheetTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
            {dayName} {dayNumber} {month} {year}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {/* Boutons d'action rapide */}
          <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-slate-200">
            <Link
              href={`/app/meetings/new?date=${date.toISOString().split('T')[0]}`}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600 mb-1" />
              <span className="text-xs font-medium text-blue-700">Réunion</span>
            </Link>
            <Link
              href={`/app/decisions/new?date=${date.toISOString().split('T')[0]}`}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <CheckSquare className="h-5 w-5 text-emerald-600 mb-1" />
              <span className="text-xs font-medium text-emerald-700">Décision</span>
            </Link>
            <Link
              href={`/app/actions/new?dueDate=${date.toISOString().split('T')[0]}`}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <ListTodo className="h-5 w-5 text-amber-600 mb-1" />
              <span className="text-xs font-medium text-amber-700">Action</span>
            </Link>
          </div>
          
          {sortedActions.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-400">{t("day.freeDay")}</p>
            </div>
          ) : (
            sortedActions.map((action) => {
              const isOverdue = action.overdue;
              const isBlocked = action.status === "BLOCKED";
              const isDone = action.status === "DONE";

              return (
                <Link
                  key={action.id}
                  href={`/app/actions?actionId=${action.id}`}
                  className="block"
                >
                  <div
                    className={`transition-all hover:shadow-lg rounded-xl p-5 ${
                      isOverdue
                        ? "bg-red-50 border-2 border-red-200"
                        : isBlocked
                        ? "bg-amber-50 border-2 border-amber-200"
                        : isDone
                        ? "bg-slate-50 border-2 border-slate-200 opacity-60"
                        : "bg-white border-2 border-blue-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isOverdue
                          ? "bg-red-200"
                          : isBlocked
                          ? "bg-amber-200"
                          : isDone
                          ? "bg-slate-200"
                          : "bg-blue-200"
                      }`}>
                        <CheckSquare
                          className={`h-5 w-5 ${
                            isOverdue
                              ? "text-red-600"
                              : isBlocked
                              ? "text-amber-600"
                              : isDone
                              ? "text-slate-400"
                              : "text-blue-600"
                          }`}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-base font-semibold mb-2 ${
                            isDone ? "line-through text-slate-400" : "text-slate-700"
                          }`}
                        >
                          {action.title}
                        </p>
                        <div className="space-y-1.5">
                          <p className="text-sm text-slate-600 font-medium">
                            {action.project.name}
                          </p>
                          {action.decision && (
                            <p className="text-sm text-slate-500">
                              {action.decision.title}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap mt-3">
                            {isOverdue && (
                              <span className="text-xs font-bold text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {t("day.overdue")}
                              </span>
                            )}
                            {isBlocked && !isOverdue && (
                              <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100">
                                <Ban className="h-3.5 w-3.5" />
                                {t("day.blocked")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
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
  const { searchQuery } = useSearch();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || "all");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
  const filteredByFilters = useMemo(() => {
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
      if (selectedStatus === "overdue" && !action.overdue) {
        return false;
      }
      return true;
    });
  }, [actions, selectedProjectId, selectedStatus]);

  // Helper pour obtenir les actions d'un jour donné
  const getActionsForDateFromList = (date: Date, actionsList: ActionItem[]): ActionItem[] => {
    const dateStr = date.toISOString().split("T")[0];
    return actionsList.filter((action) => {
      if (!action.dueDate) return false;
      const actionDateStr = new Date(action.dueDate).toISOString().split("T")[0];
      return actionDateStr === dateStr;
    });
  };

  // Filtrer selon la recherche textuelle et le filtre "critical"
  const filteredActions = useMemo(() => {
    let result = filteredByFilters;

    if (selectedStatus === "critical") {
      result = result.filter((action) => {
        if (!action.dueDate) return false;
        const dayActions = getActionsForDateFromList(new Date(action.dueDate), filteredByFilters);
        const overdueCount = dayActions.filter((a) => a.overdue).length;
        const blockedCount = dayActions.filter((a) => a.status === "BLOCKED").length;
        const totalActions = dayActions.length;
        const isCritical = overdueCount > 0 || blockedCount > 0 || totalActions >= 5;
        return isCritical;
      });
    }

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((action) => {
        const titleMatch = action.title?.toLowerCase().includes(query) || false;
        const projectMatch = action.project?.name?.toLowerCase().includes(query) || false;
        return titleMatch || projectMatch;
      });
    }

    return result;
  }, [filteredByFilters, selectedStatus, searchQuery]);

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
    const totalActions = dayActions.length;
    
    return {
      total: totalActions,
      overdue: overdueCount,
      blocked: blockedCount,
      isCritical: overdueCount > 0 || blockedCount > 0 || totalActions >= 5,
      isHeavy: totalActions >= 5,
    };
  };

  // Calculer les KPIs globaux
  const kpis = useMemo(() => {
    const totalActions = filteredActions.length;
    const overdueCount = filteredActions.filter((a) => a.overdue).length;
    
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    let criticalDaysCount = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startOfWeek);
      checkDate.setDate(startOfWeek.getDate() + i);
      const stats = getDayStats(checkDate);
      if (stats.isCritical) criticalDaysCount++;
    }

    return { totalActions, overdueCount, criticalDaysCount };
  }, [filteredActions, currentDate]);

  // Vue Semaine
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
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

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    setIsDetailsOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* En-tête avec navigation et filtres - compact */}
      <div className="mb-4 space-y-3">
        {/* KPIs compacts */}
        <CalendarKpis
          totalActions={kpis.totalActions}
          overdueCount={kpis.overdueCount}
          criticalDaysCount={kpis.criticalDaysCount}
        />

        {/* Navigation et filtres - responsive */}
        <div className="space-y-2 sm:space-y-0">
          {/* Navigation */}
          <div className="flex items-center justify-between gap-2 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none">
              <button
                onClick={() => navigateWeek("prev")}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <div className="text-center flex-1 sm:flex-none sm:min-w-[200px]">
                <p className="font-semibold text-xs sm:text-sm text-slate-800 leading-tight">
                  <span className="hidden sm:inline">
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
                  </span>
                  <span className="sm:hidden">
                    {startOfWeek.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    - {weekDays[6].getDate()}/{weekDays[6].getMonth() + 1}
                  </span>
                </p>
              </div>
              <button
                onClick={() => navigateWeek("next")}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="h-8 px-3 sm:h-9 sm:px-4 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation whitespace-nowrap"
            >
              {t("navigation.today")}
            </button>
          </div>

          {/* Filtres compacts - empilés sur mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            >
              <option value="">{t("filters.allProjects")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm sm:min-w-[140px] focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            >
              <option value="all">{t("filters.allStatuses")}</option>
              <option value="open">{t("filters.open")}</option>
              <option value="done">{t("filters.done")}</option>
              <option value="blocked">{t("filters.blocked")}</option>
              <option value="overdue">{t("filters.overdue")}</option>
              <option value="critical">{t("filters.critical")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille semaine - scroll horizontal sur mobile, grille sur desktop */}
      <div className="flex-1 min-h-0">
        {/* Version desktop - grille 7 colonnes */}
        <div className="hidden md:grid md:grid-cols-7 gap-3 h-full">
          {weekDays.map((date) => {
            const dayActions = getActionsForDate(date);
            const dayStats = getDayStats(date);
            const isTodayDate = isToday(date);
            const isSelected = selectedDate?.toISOString().split("T")[0] === date.toISOString().split("T")[0];

            const sortedActions = [...dayActions].sort((a, b) => {
              if (a.overdue && !b.overdue) return -1;
              if (!a.overdue && b.overdue) return 1;
              if (a.status === "BLOCKED" && b.status !== "BLOCKED") return -1;
              if (a.status !== "BLOCKED" && b.status === "BLOCKED") return 1;
              return 0;
            });

            return (
              <DayCard
                key={date.toISOString()}
                date={date}
                actions={sortedActions}
                stats={dayStats}
                isToday={isTodayDate}
                isSelected={isSelected}
                onSelect={() => handleDaySelect(date)}
              />
            );
          })}
        </div>

        {/* Version mobile - scroll horizontal */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex gap-2 min-w-max h-full" style={{ minHeight: '400px' }}>
            {weekDays.map((date) => {
              const dayActions = getActionsForDate(date);
              const dayStats = getDayStats(date);
              const isTodayDate = isToday(date);
              const isSelected = selectedDate?.toISOString().split("T")[0] === date.toISOString().split("T")[0];

              const sortedActions = [...dayActions].sort((a, b) => {
                if (a.overdue && !b.overdue) return -1;
                if (!a.overdue && b.overdue) return 1;
                if (a.status === "BLOCKED" && b.status !== "BLOCKED") return -1;
                if (a.status !== "BLOCKED" && b.status === "BLOCKED") return 1;
                return 0;
              });

              return (
                <div key={date.toISOString()} className="w-[280px] flex-shrink-0">
                  <DayCard
                    date={date}
                    actions={sortedActions}
                    stats={dayStats}
                    isToday={isTodayDate}
                    isSelected={isSelected}
                    onSelect={() => handleDaySelect(date)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
        {weekDays.map((date) => {
          const dayActions = getActionsForDate(date);
          const dayStats = getDayStats(date);
          const isTodayDate = isToday(date);
          const isSelected = selectedDate?.toISOString().split("T")[0] === date.toISOString().split("T")[0];

          const sortedActions = [...dayActions].sort((a, b) => {
            if (a.overdue && !b.overdue) return -1;
            if (!a.overdue && b.overdue) return 1;
            if (a.status === "BLOCKED" && b.status !== "BLOCKED") return -1;
            if (a.status !== "BLOCKED" && b.status === "BLOCKED") return 1;
            return 0;
          });

          return (
            <DayCard
              key={date.toISOString()}
              date={date}
              actions={sortedActions}
              stats={dayStats}
              isToday={isTodayDate}
              isSelected={isSelected}
              onSelect={() => handleDaySelect(date)}
            />
          );
        })}
      </div>

      {/* Panneau détail */}
      <DayDetailsPanel
        date={selectedDate}
        actions={selectedDate ? getActionsForDate(selectedDate) : []}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDate(null);
        }}
      />
    </div>
  );
}
