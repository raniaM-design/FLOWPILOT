"use client";

import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, Ban, CheckSquare, ListTodo, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CalendarWeekTimeGrid } from "@/components/calendar/calendar-week-time-grid";
import {
  getPerfactiveProjectColors,
  isUrgentAction,
} from "@/lib/calendar/perfactive-colors";
import { cn } from "@/lib/utils";
import { useSearch } from "@/contexts/search-context";
import { DueMeta } from "@/lib/timeUrgency";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";

type ActionItem = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | string | null;
  dueMeta: DueMeta;
  overdue: boolean;
  project: { id: string; name: string };
  decision: { id: string; title: string } | null;
};

/** Entrée affichée sur une case jour (placement logique semaine) */
type CalendarWeekActionEntry = {
  action: ActionItem;
  /** Échéance « cette semaine » : affichée le lundi, badge ~ */
  approximateWeek?: boolean;
  /** Retard regroupé sur aujourd’hui */
  overdueOnToday?: boolean;
};

function atLocalMidnight(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function coerceDate(value: Date | string): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function localDateKey(d: Date): string {
  const x = atLocalMidnight(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(reference: Date): Date {
  const x = atLocalMidnight(reference);
  const dow = x.getDay();
  const diff = x.getDate() - dow + (dow === 0 ? -6 : 1);
  x.setDate(diff);
  return x;
}

function endOfWeekSunday(weekStartMonday: Date): Date {
  const x = atLocalMidnight(weekStartMonday);
  x.setDate(x.getDate() + 6);
  return x;
}

type WeekPlacement = {
  day: Date;
  approximateWeek?: boolean;
  overdueOnToday?: boolean;
};

/**
 * Détermine sur quel(s) jour(s) de la semaine affichée placer l’action.
 */
function getPlacementsForWeek(
  action: ActionItem,
  weekStartMonday: Date,
  weekEndSunday: Date,
  today: Date,
): WeekPlacement[] {
  const ws = atLocalMidnight(weekStartMonday);
  const we = atLocalMidnight(weekEndSunday);
  const todayN = atLocalMidnight(today);
  const weekContainsToday = todayN.getTime() >= ws.getTime() && todayN.getTime() <= we.getTime();

  if (action.status === "DONE") {
    if (!action.dueDate) return [];
    const due = atLocalMidnight(coerceDate(action.dueDate));
    if (due.getTime() < ws.getTime() || due.getTime() > we.getTime()) return [];
    return [{ day: due }];
  }

  if (!action.dueDate) return [];
  const due = atLocalMidnight(coerceDate(action.dueDate));

  if (action.overdue) {
    if (weekContainsToday) {
      return [{ day: new Date(todayN), overdueOnToday: true }];
    }
    if (due.getTime() < ws.getTime() || due.getTime() > we.getTime()) return [];
    return [{ day: due }];
  }

  if (action.dueMeta?.kind === "THIS_WEEK") {
    const monday = startOfWeekMonday(due);
    if (monday.getTime() < ws.getTime() || monday.getTime() > we.getTime()) return [];
    return [{ day: monday, approximateWeek: true }];
  }

  if (due.getTime() < ws.getTime() || due.getTime() > we.getTime()) return [];
  return [{ day: due }];
}

interface CalendarViewProps {
  actions: ActionItem[];
  projects: Array<{ id: string; name: string }>;
  initialProjectId?: string;
  initialStatus?: string;
}

type CalendarMainView = "month" | "weekGrid" | "day" | "planning";

function CalendarProjectLegend({
  projects,
  title,
  urgentLabel,
}: {
  projects: Array<{ id: string; name: string }>;
  title: string;
  urgentLabel: string;
}) {
  return (
    <aside className="hidden w-44 shrink-0 flex-col pr-4 lg:flex">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <ul className="space-y-1.5">
        {projects.map((p) => {
          const c = getPerfactiveProjectColors(p.name, {});
          return (
            <li key={p.id} className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.bg }}
                aria-hidden
              />
              <span className="truncate text-xs text-slate-700">{p.name}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: "#FFB8C8" }}
            aria-hidden
          />
          <span className="text-xs leading-snug text-slate-600">{urgentLabel}</span>
        </div>
      </div>
    </aside>
  );
}

function CalendarMonthOverview({
  monthAnchor,
  entriesByDayKey,
  onCellPick,
  isTodayFn,
  weekDayLabels,
}: {
  monthAnchor: Date;
  entriesByDayKey: Map<string, CalendarWeekActionEntry[]>;
  onCellPick: (d: Date) => void;
  isTodayFn: (d: Date) => boolean;
  weekDayLabels: string[];
}) {
  const y = monthAnchor.getFullYear();
  const m = monthAnchor.getMonth();
  const first = atLocalMidnight(new Date(y, m, 1));
  const gridStart = startOfWeekMonday(first);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekDayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === m;
          const key = localDateKey(d);
          const n = entriesByDayKey.get(key)?.length ?? 0;
          const dayToday = isTodayFn(d);
          const c =
            n > 0
              ? getPerfactiveProjectColors(
                  entriesByDayKey.get(key)![0]!.action.project.name,
                  {}
                )
              : null;

          return (
            <button
              key={`${key}-${i}`}
              type="button"
              onClick={() => onCellPick(d)}
              className={cn(
                "flex aspect-square flex-col items-center justify-start rounded-lg border border-transparent p-1 text-left text-xs transition-colors hover:border-slate-200 hover:bg-slate-50",
                !inMonth && "opacity-35",
                dayToday && "bg-[#FAFBFD] ring-1 ring-[#2D5BE3]/25"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center text-xs font-semibold",
                  dayToday
                    ? "rounded-full bg-[#2D5BE3] font-bold text-white"
                    : "text-slate-800"
                )}
              >
                {d.getDate()}
              </span>
              {n > 0 && c && (
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.bg }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
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
  entries,
  stats,
  isToday: isTodayDate,
  isSelected,
  onSelect,
}: {
  date: Date;
  entries: CalendarWeekActionEntry[];
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
            {entries.slice(0, 6).map(({ action, approximateWeek, overdueOnToday }) => {
              const isDone = action.status === "DONE";
              const urgent =
                isUrgentAction(!!overdueOnToday, action.status) ||
                (action.overdue && !approximateWeek);
              const colors = isDone
                ? { bg: "#F1F5F9", text: "#64748B" }
                : getPerfactiveProjectColors(action.project.name, { urgent });

              return (
                <Link
                  key={`${action.id}-${approximateWeek ? "w" : "d"}${overdueOnToday ? "t" : ""}`}
                  href={
                    action.decision
                      ? `/app/decisions/${action.decision.id}`
                      : `/app/projects/${action.project.id}`
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="block"
                >
                  <div
                    className="touch-manipulation rounded-[7px] px-[7px] py-[5px] transition-opacity hover:opacity-95 active:opacity-90"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      boxShadow: "none",
                      border: "none",
                    }}
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p
                        className={`line-clamp-2 font-bold leading-tight ${
                          isDone ? "line-through opacity-70" : ""
                        }`}
                        style={{ fontSize: 11, color: colors.text }}
                      >
                        {overdueOnToday ? (
                          <span className="mr-0.5" title="En retard">
                            ⚠️
                          </span>
                        ) : null}
                        {action.title}
                        {approximateWeek ? (
                          <span
                            className="ml-0.5 text-[10px] font-bold opacity-80"
                            title="Échéance cible : cette semaine"
                          >
                            ~
                          </span>
                        ) : null}
                      </p>
                      <p
                        className="line-clamp-1 text-[10px] leading-tight"
                        style={{ color: colors.text, opacity: 0.75 }}
                      >
                        {action.project.name}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {entries.length > 6 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="w-full text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium py-1 touch-manipulation"
              >
                +{entries.length - 6} autres
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
  entries,
  isOpen,
  onClose,
}: {
  date: Date | null;
  entries: CalendarWeekActionEntry[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("calendar");

  if (!date) return null;

  const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const dayNumber = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "long" });
  const year = date.getFullYear();

  const sortedEntries = [...entries].sort((a, b) => {
    const x = a.action;
    const y = b.action;
    if (a.overdueOnToday && !b.overdueOnToday) return -1;
    if (!a.overdueOnToday && b.overdueOnToday) return 1;
    if (x.overdue && !y.overdue) return -1;
    if (!x.overdue && y.overdue) return 1;
    if (x.status === "BLOCKED" && y.status !== "BLOCKED") return -1;
    if (x.status !== "BLOCKED" && y.status === "BLOCKED") return 1;
    return 0;
  });

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
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
              href={`/app/meetings/new?date=${localDateKey(date)}`}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600 mb-1" />
              <span className="text-xs font-medium text-blue-700">Réunion</span>
            </Link>
            <Link
              href={`/app/decisions/new?date=${localDateKey(date)}`}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <CheckSquare className="h-5 w-5 text-emerald-600 mb-1" />
              <span className="text-xs font-medium text-emerald-700">Décision</span>
            </Link>
            <Link
              href={`/app/actions/new?dueDate=${localDateKey(date)}`}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <ListTodo className="h-5 w-5 text-amber-600 mb-1" />
              <span className="text-xs font-medium text-amber-700">Action</span>
            </Link>
          </div>
          
          {sortedEntries.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-400">{t("day.freeDay")}</p>
            </div>
          ) : (
            sortedEntries.map(({ action, approximateWeek, overdueOnToday }) => {
              const isOverdue = action.overdue;
              const isBlocked = action.status === "BLOCKED";
              const isDone = action.status === "DONE";

              return (
                <Link
                  key={`${action.id}-${approximateWeek ? "w" : "d"}${overdueOnToday ? "t" : ""}`}
                  href={`/app/actions?actionId=${action.id}`}
                  className="block"
                >
                  <div
                    className={`transition-all hover:shadow-lg rounded-xl p-5 ${
                      isOverdue || overdueOnToday
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
                        isOverdue || overdueOnToday
                          ? "bg-red-200"
                          : isBlocked
                          ? "bg-amber-200"
                          : isDone
                          ? "bg-slate-200"
                          : "bg-blue-200"
                      }`}>
                        {overdueOnToday ? (
                          <span className="text-lg leading-none text-red-600">⚠️</span>
                        ) : (
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
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p
                            className={`text-base font-semibold ${
                              isDone ? "line-through text-slate-400" : "text-slate-700"
                            }`}
                          >
                            {action.title}
                          </p>
                          {approximateWeek && (
                            <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                              ~
                            </span>
                          )}
                        </div>
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
                            {(isOverdue || overdueOnToday) && (
                              <span className="text-xs font-bold text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {t("day.overdue")}
                              </span>
                            )}
                            {isBlocked && !isOverdue && !overdueOnToday && (
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
  const locale = useLocale();
  const { searchQuery } = useSearch();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || "all");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [mainView, setMainView] = useState<CalendarMainView>("weekGrid");

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

  // Filtrer selon la recherche textuelle et le filtre "critical"
  const filteredActions = useMemo(() => {
    let result = filteredByFilters;

    if (selectedStatus === "critical") {
      const ws = startOfWeekMonday(currentDate);
      const we = endOfWeekSunday(ws);
      const todayN = atLocalMidnight(new Date());
      result = result.filter((action) => {
        if (action.overdue || action.status === "BLOCKED") return true;
        const placements = getPlacementsForWeek(action, ws, we, todayN);
        if (placements.length === 0) return false;
        for (const { day } of placements) {
          const key = localDateKey(day);
          let count = 0;
          for (const other of filteredByFilters) {
            const op = getPlacementsForWeek(other, ws, we, todayN);
            if (op.some((p) => localDateKey(p.day) === key)) count++;
          }
          if (count >= 5) return true;
        }
        return false;
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
  }, [filteredByFilters, selectedStatus, searchQuery, currentDate]);

  const weekStartMonday = useMemo(() => startOfWeekMonday(currentDate), [currentDate]);
  const weekEndSunday = useMemo(() => endOfWeekSunday(weekStartMonday), [weekStartMonday]);

  const entriesByDayKey = useMemo(() => {
    const today = new Date();
    const map = new Map<string, CalendarWeekActionEntry[]>();
    for (const action of filteredActions) {
      const placements = getPlacementsForWeek(action, weekStartMonday, weekEndSunday, today);
      for (const p of placements) {
        const key = localDateKey(p.day);
        const list = map.get(key) ?? [];
        list.push({
          action,
          approximateWeek: p.approximateWeek,
          overdueOnToday: p.overdueOnToday,
        });
        map.set(key, list);
      }
    }
    return map;
  }, [filteredActions, weekStartMonday, weekEndSunday]);

  const getEntriesForDate = (date: Date): CalendarWeekActionEntry[] =>
    entriesByDayKey.get(localDateKey(date)) ?? [];

  const getDayStats = (date: Date) => {
    const entries = getEntriesForDate(date);
    const overdueCount = entries.filter(
      (e) => e.action.overdue || e.overdueOnToday,
    ).length;
    const blockedCount = entries.filter((e) => e.action.status === "BLOCKED").length;
    const totalActions = entries.length;

    return {
      total: totalActions,
      overdue: overdueCount,
      blocked: blockedCount,
      isCritical: overdueCount > 0 || blockedCount > 0 || totalActions >= 5,
      isHeavy: totalActions >= 5,
    };
  };

  const weekHasNoPlacedActions = useMemo(() => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartMonday);
      d.setDate(weekStartMonday.getDate() + i);
      if ((entriesByDayKey.get(localDateKey(d))?.length ?? 0) > 0) return false;
    }
    return true;
  }, [entriesByDayKey, weekStartMonday]);

  const overdueCountForBanner = useMemo(
    () => filteredActions.filter((a) => a.overdue).length,
    [filteredActions],
  );

  // Calculer les KPIs globaux
  const kpis = useMemo(() => {
    const totalActions = filteredActions.length;
    const overdueCount = filteredActions.filter((a) => a.overdue).length;

    let criticalDaysCount = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStartMonday);
      checkDate.setDate(weekStartMonday.getDate() + i);
      const stats = getDayStats(checkDate);
      if (stats.isCritical) criticalDaysCount++;
    }

    return { totalActions, overdueCount, criticalDaysCount };
  }, [filteredActions, weekStartMonday, entriesByDayKey]);

  const weekDays = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartMonday);
      date.setDate(weekStartMonday.getDate() + i);
      out.push(date);
    }
    return out;
  }, [weekStartMonday]);

  const displayWeekDays = useMemo(() => {
    if (mainView === "day") {
      return [atLocalMidnight(new Date(currentDate))];
    }
    return weekDays;
  }, [mainView, currentDate, weekDays]);

  const weekdayLabels = useMemo(
    () => [
      t("days.monday"),
      t("days.tuesday"),
      t("days.wednesday"),
      t("days.thursday"),
      t("days.friday"),
      t("days.saturday"),
      t("days.sunday"),
    ],
    [t]
  );

  const timeGridWeekdayLabels = useMemo(() => {
    if (mainView === "day" && displayWeekDays[0]) {
      const dow = displayWeekDays[0].getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      return [weekdayLabels[idx]!];
    }
    return weekdayLabels;
  }, [mainView, displayWeekDays, weekdayLabels]);

  const periodLabel = useMemo(() => {
    if (mainView === "month") {
      return currentDate.toLocaleDateString(locale, { month: "long", year: "numeric" });
    }
    if (mainView === "day") {
      return currentDate.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return null;
  }, [mainView, currentDate, locale]);

  const navigatePeriod = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const delta = direction === "next" ? 1 : -1;
    if (mainView === "month") {
      newDate.setMonth(newDate.getMonth() + delta);
    } else if (mainView === "day") {
      newDate.setDate(newDate.getDate() + delta);
    } else {
      newDate.setDate(newDate.getDate() + 7 * delta);
    }
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
                type="button"
                onClick={() => navigatePeriod("prev")}
                className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 sm:h-9 sm:w-9"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <div className="min-w-0 flex-1 text-center sm:flex-none sm:min-w-[200px]">
                <p className="text-xs font-semibold leading-tight text-slate-800 sm:text-sm">
                  {periodLabel ? (
                    <span className="capitalize">{periodLabel}</span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">
                        {weekStartMonday.toLocaleDateString(locale, {
                          day: "numeric",
                          month: "long",
                        })}{" "}
                        —{" "}
                        {weekDays[6]!.toLocaleDateString(locale, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="sm:hidden">
                        {weekStartMonday.toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        - {weekDays[6]!.getDate()}/{weekDays[6]!.getMonth() + 1}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigatePeriod("next")}
                className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 sm:h-9 sm:w-9"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <div
                className="hidden rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 sm:inline-flex"
                role="tablist"
                aria-label={t("title")}
              >
                {(
                  [
                    ["month", t("navigation.viewMonth")],
                    ["weekGrid", t("navigation.viewWeek")],
                    ["day", t("navigation.viewDay")],
                    ["planning", t("navigation.viewPlanning")],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={mainView === id}
                    onClick={() => setMainView(id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      mainView === id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="h-8 touch-manipulation whitespace-nowrap rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 sm:h-9 sm:px-4 sm:text-sm"
              >
                {t("navigation.today")}
              </button>
            </div>
          </div>
          <div className="flex justify-center sm:hidden">
            <div
              className="inline-flex rounded-lg border border-slate-200 bg-slate-100/90 p-0.5"
              role="tablist"
            >
              {(
                [
                  ["month", t("navigation.viewMonth")],
                  ["weekGrid", t("navigation.viewWeek")],
                  ["day", t("navigation.viewDay")],
                  ["planning", t("navigation.viewPlanning")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mainView === id}
                  onClick={() => setMainView(id)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors",
                    mainView === id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
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

      {(mainView === "planning" || mainView === "weekGrid") && weekHasNoPlacedActions && (
        <div className="mb-4">
          <EmptyState
            icon={Calendar}
            title="Aucune action planifiée cette semaine"
            description={
              overdueCountForBanner > 0
                ? `Tes ${overdueCountForBanner} action${overdueCountForBanner > 1 ? "s" : ""} en retard méritent une date.`
                : "Ajoute des échéances à tes actions pour les voir sur cette semaine."
            }
            ctaLabel={
              overdueCountForBanner > 0
                ? "Planifier maintenant"
                : "Voir mes actions"
            }
            ctaAction={
              overdueCountForBanner > 0
                ? "/app/actions?plan=overdue"
                : "/app/actions"
            }
          />
        </div>
      )}

      {/* Grille : semaine horaire (Perfactive), mois, jour, ou planning (cartes) */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {(mainView === "weekGrid" || mainView === "planning") && (
          <CalendarProjectLegend
            projects={projects}
            title={t("navigation.projectsLegend")}
            urgentLabel={t("navigation.urgentLegend")}
          />
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {(mainView === "weekGrid" || mainView === "day") && (
            <CalendarWeekTimeGrid
              weekDays={displayWeekDays}
              getEntriesForDate={getEntriesForDate}
              onSelectDay={handleDaySelect}
              weekdayLabels={timeGridWeekdayLabels}
            />
          )}

          {mainView === "month" && (
            <CalendarMonthOverview
              monthAnchor={currentDate}
              entriesByDayKey={entriesByDayKey}
              onCellPick={(d) => {
                setCurrentDate(d);
                setMainView("weekGrid");
              }}
              isTodayFn={isToday}
              weekDayLabels={weekdayLabels}
            />
          )}

          {mainView === "planning" && (
            <>
              <div className="hidden h-full min-h-[420px] md:grid md:grid-cols-7 md:gap-3">
                {weekDays.map((date) => {
                  const dayEntries = getEntriesForDate(date);
                  const dayStats = getDayStats(date);
                  const isTodayDate = isToday(date);
                  const isSelected =
                    !!selectedDate && localDateKey(selectedDate) === localDateKey(date);

                  const sortedEntries = [...dayEntries].sort((a, b) => {
                    const x = a.action;
                    const y = b.action;
                    if (a.overdueOnToday && !b.overdueOnToday) return -1;
                    if (!a.overdueOnToday && b.overdueOnToday) return 1;
                    if (x.overdue && !y.overdue) return -1;
                    if (!x.overdue && y.overdue) return 1;
                    if (x.status === "BLOCKED" && y.status !== "BLOCKED") return -1;
                    if (x.status !== "BLOCKED" && y.status === "BLOCKED") return 1;
                    return 0;
                  });

                  return (
                    <DayCard
                      key={localDateKey(date)}
                      date={date}
                      entries={sortedEntries}
                      stats={dayStats}
                      isToday={isTodayDate}
                      isSelected={isSelected}
                      onSelect={() => handleDaySelect(date)}
                    />
                  );
                })}
              </div>

              <div
                className="md:hidden -mx-1 overflow-x-auto px-1 pb-2"
                style={{ scrollbarWidth: "thin" }}
              >
                <div className="flex h-full min-h-[400px] min-w-max gap-2">
                  {weekDays.map((date) => {
                    const dayEntries = getEntriesForDate(date);
                    const dayStats = getDayStats(date);
                    const isTodayDate = isToday(date);
                    const isSelected =
                      !!selectedDate && localDateKey(selectedDate) === localDateKey(date);

                    const sortedEntries = [...dayEntries].sort((a, b) => {
                      const x = a.action;
                      const y = b.action;
                      if (a.overdueOnToday && !b.overdueOnToday) return -1;
                      if (!a.overdueOnToday && b.overdueOnToday) return 1;
                      if (x.overdue && !y.overdue) return -1;
                      if (!x.overdue && y.overdue) return 1;
                      if (x.status === "BLOCKED" && y.status !== "BLOCKED") return -1;
                      if (x.status !== "BLOCKED" && y.status === "BLOCKED") return 1;
                      return 0;
                    });

                    return (
                      <div key={localDateKey(date)} className="w-[280px] shrink-0">
                        <DayCard
                          date={date}
                          entries={sortedEntries}
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
            </>
          )}
        </div>
      </div>

      {/* Panneau détail */}
      <DayDetailsPanel
        date={selectedDate}
        entries={selectedDate ? getEntriesForDate(selectedDate) : []}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDate(null);
        }}
      />
    </div>
  );
}
