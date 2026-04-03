"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown, FileText, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatShortDate } from "@/lib/timeUrgency";
import { useSearch } from "@/contexts/search-context";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PriorityKey = "high" | "normal" | "low";

export interface ActionListItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  blockReason: string | null;
  dueDate: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
  decision: {
    id: string;
    title: string;
  } | null;
  overdue: boolean;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  dueMeta: {
    label: string;
    color: string;
  };
}

type ActionsTab = "all" | "inProgress" | "blocked" | "completed";

interface ActionsListWithFiltersProps {
  actions: ActionListItem[];
  /** Ex. `?tab=blocked` */
  initialTab?: ActionsTab;
  /** Ex. `?plan=overdue` — filtre les actions en retard */
  initialQuickFilter?: "overdue" | null;
}

function normPriority(p: string): PriorityKey {
  const x = (p || "normal").toLowerCase();
  if (x === "high") return "high";
  if (x === "low") return "low";
  return "normal";
}

function initials(name: string | null, email: string): string {
  const s = (name && name.trim()) || email || "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase().slice(0, 2);
  }
  return s.slice(0, 2).toUpperCase();
}

type DueGroupKey = "overdue" | "week" | "later" | "none" | "done";

function getDueGroup(
  action: ActionListItem,
  now: Date,
  nextWeek: Date,
): DueGroupKey {
  if (action.status === "DONE") return "done";
  if (!action.dueDate) return "none";
  if (action.overdue) return "overdue";
  const due = new Date(action.dueDate);
  due.setHours(0, 0, 0, 0);
  if (due >= now && due <= nextWeek) return "week";
  return "later";
}

export function ActionsListWithFilters({
  actions,
  initialTab,
  initialQuickFilter,
}: ActionsListWithFiltersProps) {
  const t = useTranslations("actions");
  const [activeTab, setActiveTab] = useState<ActionsTab>(
    initialTab ?? "all",
  );
  const [quickOverdueOnly] = useState(initialQuickFilter === "overdue");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<"project" | "assignee" | "due">(
    "project",
  );
  const { searchQuery } = useSearch();

  const now = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const nextWeek = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }, [now]);

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of actions) {
      map.set(a.project.id, a.project.name);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [actions]);

  const assigneeOptions = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string | null; email: string }
    >();
    for (const a of actions) {
      if (a.assignee) {
        map.set(a.assignee.id, {
          id: a.assignee.id,
          name: a.assignee.name,
          email: a.assignee.email,
        });
      }
    }
    return [...map.values()].sort((a, b) => {
      const la =
        (a.name && a.name.trim()) || a.email;
      const lb =
        (b.name && b.name.trim()) || b.email;
      return la.localeCompare(lb, "fr");
    });
  }, [actions]);

  const filteredByTab = useMemo(() => {
    switch (activeTab) {
      case "inProgress":
        return actions.filter((a) => a.status === "DOING" || a.status === "TODO");
      case "blocked":
        return actions.filter((a) => a.status === "BLOCKED");
      case "completed":
        return actions.filter((a) => a.status === "DONE");
      default:
        return actions;
    }
  }, [actions, activeTab]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return filteredByTab;
    return filteredByTab.filter((a) => a.status === statusFilter);
  }, [filteredByTab, statusFilter]);

  const filteredByProject = useMemo(() => {
    if (projectFilter === "all") return filteredByStatus;
    return filteredByStatus.filter((a) => a.project.id === projectFilter);
  }, [filteredByStatus, projectFilter]);

  const filteredByAssignee = useMemo(() => {
    if (assigneeFilter === "all") return filteredByProject;
    if (assigneeFilter === "unassigned") {
      return filteredByProject.filter((a) => !a.assignee);
    }
    return filteredByProject.filter((a) => a.assignee?.id === assigneeFilter);
  }, [filteredByProject, assigneeFilter]);

  const filteredByPriority = useMemo(() => {
    if (priorityFilter === "all") return filteredByAssignee;
    return filteredByAssignee.filter(
      (a) => normPriority(a.priority) === priorityFilter,
    );
  }, [filteredByAssignee, priorityFilter]);

  const filteredByOverdueQuick = useMemo(() => {
    if (!quickOverdueOnly) return filteredByPriority;
    return filteredByPriority.filter(
      (a) => a.overdue && a.status !== "DONE",
    );
  }, [filteredByPriority, quickOverdueOnly]);

  const filteredActions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return filteredByOverdueQuick;
    const query = searchQuery.toLowerCase().trim();
    return filteredByOverdueQuick.filter((action) => {
      const titleMatch = action.title?.toLowerCase().includes(query) ?? false;
      const descriptionMatch =
        action.description?.toLowerCase().includes(query) ?? false;
      const projectMatch =
        action.project?.name?.toLowerCase().includes(query) ?? false;
      const decisionMatch =
        action.decision?.title?.toLowerCase().includes(query) ?? false;
      const assigneeMatch = action.assignee
        ? (action.assignee.name?.toLowerCase().includes(query) ?? false) ||
          action.assignee.email.toLowerCase().includes(query)
        : false;
      return (
        titleMatch ||
        descriptionMatch ||
        projectMatch ||
        decisionMatch ||
        assigneeMatch
      );
    });
  }, [filteredByOverdueQuick, searchQuery]);

  const counts = useMemo(() => {
    const all = actions.length;
    const inProgress = actions.filter(
      (a) => a.status === "DOING" || a.status === "TODO",
    ).length;
    const blocked = actions.filter((a) => a.status === "BLOCKED").length;
    const completed = actions.filter((a) => a.status === "DONE").length;
    return { all, inProgress, blocked, completed };
  }, [actions]);

  const selectedProjectLabel =
    projectFilter === "all"
      ? t("allProjects")
      : projectOptions.find((p) => p.id === projectFilter)?.name ?? t("allProjects");

  const selectedAssigneeLabel =
    assigneeFilter === "all"
      ? t("allAssignees")
      : assigneeFilter === "unassigned"
        ? t("unassigned")
        : (() => {
            const u = assigneeOptions.find((x) => x.id === assigneeFilter);
            if (!u) return t("allAssignees");
            return (u.name && u.name.trim()) || u.email;
          })();

  const selectedPriorityLabel =
    priorityFilter === "all"
      ? t("allPriorities")
      : priorityFilter === "high"
        ? t("priorityHigh")
        : priorityFilter === "low"
          ? t("priorityLow")
          : t("priorityNormal");

  const groupedEntries = useMemo(() => {
    const list = [...filteredActions];
    const groupOrder: string[] = [];
    const groups = new Map<string, ActionListItem[]>();

    const push = (key: string, action: ActionListItem) => {
      if (!groups.has(key)) {
        groups.set(key, []);
        groupOrder.push(key);
      }
      groups.get(key)!.push(action);
    };

    if (groupBy === "project") {
      list.sort((a, b) =>
        a.project.name.localeCompare(b.project.name, "fr"),
      );
      for (const a of list) {
        push(a.project.name, a);
      }
    } else if (groupBy === "assignee") {
      list.sort((a, b) => {
        const la = a.assignee
          ? (a.assignee.name && a.assignee.name.trim()) || a.assignee.email
          : t("unassigned");
        const lb = b.assignee
          ? (b.assignee.name && b.assignee.name.trim()) || b.assignee.email
          : t("unassigned");
        return la.localeCompare(lb, "fr");
      });
      for (const a of list) {
        const key = a.assignee
          ? (a.assignee.name && a.assignee.name.trim()) || a.assignee.email
          : t("unassigned");
        push(key, a);
      }
    } else {
      const orderRank: Record<DueGroupKey, number> = {
        overdue: 0,
        week: 1,
        later: 2,
        none: 3,
        done: 4,
      };
      const labels: Record<DueGroupKey, string> = {
        overdue: t("dueGroupOverdue"),
        week: t("dueGroupThisWeek"),
        later: t("dueGroupLater"),
        none: t("dueGroupNoDate"),
        done: t("dueGroupDone"),
      };
      list.sort((a, b) => {
        const ra = orderRank[getDueGroup(a, now, nextWeek)];
        const rb = orderRank[getDueGroup(b, now, nextWeek)];
        if (ra !== rb) return ra - rb;
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      for (const a of list) {
        const k = getDueGroup(a, now, nextWeek);
        push(labels[k], a);
      }
    }

    return { groupOrder, groups };
  }, [filteredActions, groupBy, now, nextWeek, t]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DOING":
        return {
          variant: "success" as const,
          label: "En cours",
          className: "bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]",
        };
      case "BLOCKED":
        return {
          variant: "danger" as const,
          label: "Bloquée",
          className: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
        };
      case "DONE":
        return {
          variant: "success" as const,
          label: "Complétée",
          className: "bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]",
        };
      default:
        return {
          variant: "info" as const,
          label: "À faire",
          className: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
        };
    }
  };

  const priorityChip = (p: string) => {
    const k = normPriority(p);
    if (k === "high") {
      return {
        label: t("priorityHigh"),
        className: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
      };
    }
    if (k === "low") {
      return {
        label: t("priorityLow"),
        className: "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]",
      };
    }
    return {
      label: t("priorityNormal"),
      className: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    };
  };

  const renderActionCard = (action: ActionListItem) => {
    const statusStyle = getStatusVariant(action.status);
    const pr = priorityChip(action.priority);
    const assignee = action.assignee;

    return (
      <Link
        key={action.id}
        href={`/app/projects/${action.project.id}?actionId=${action.id}`}
        className="block group"
      >
        <FlowCard
          variant="default"
          className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200"
        >
          <FlowCardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-[#111111] group-hover:text-[#2563EB] transition-colors">
                      {action.title}
                    </h3>
                    <Chip
                      variant="info"
                      size="sm"
                      className={`text-xs ${pr.className}`}
                    >
                      {pr.label}
                    </Chip>
                  </div>
                  <p className="text-sm text-[#667085]">{action.project.name}</p>
                </div>
              </div>

              {action.status === "BLOCKED" && (
                <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 text-sm">
                  <span className="font-medium text-[#92400E]">
                    {t("blockReasonLabel")} :{" "}
                  </span>
                  <span className="text-[#78350F]">
                    {action.blockReason?.trim()
                      ? action.blockReason.trim()
                      : t("blockReasonEmpty")}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E5E7EB]">
                <Chip
                  variant={statusStyle.variant}
                  size="sm"
                  className={statusStyle.className}
                >
                  {statusStyle.label}
                </Chip>
                {action.dueDate && (
                  <span className="text-xs text-[#667085] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatShortDate(new Date(action.dueDate))}
                  </span>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {assignee ? (
                    <>
                      <Avatar className="h-7 w-7 border border-[#E5E7EB]">
                        <AvatarImage
                          src={
                            assignee.avatarUrl &&
                            assignee.avatarUrl.trim() !== ""
                              ? assignee.avatarUrl
                              : undefined
                          }
                          alt=""
                        />
                        <AvatarFallback className="text-[10px] bg-[#2563EB] text-white font-medium">
                          {initials(assignee.name, assignee.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-[#374151] max-w-[140px] truncate">
                        {(assignee.name && assignee.name.trim()) ||
                          assignee.email}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-[#667085]">
                      {t("unassigned")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </FlowCardContent>
        </FlowCard>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          >
            <TabsList className="bg-white border border-[#E5E7EB] w-max min-w-full sm:min-w-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap"
              >
                Toutes{" "}
                {counts.all > 0 && (
                  <span className="ml-1.5">({counts.all})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="inProgress"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap"
              >
                En cours{" "}
                {counts.inProgress > 0 && (
                  <span className="ml-1.5">({counts.inProgress})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="blocked"
                className={`data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap ${counts.blocked > 0 ? "text-[#B91C1C]" : ""}`}
              >
                Bloquées{" "}
                {counts.blocked > 0 && (
                  <span className="ml-1.5">({counts.blocked})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap"
              >
                Complétées{" "}
                {counts.completed > 0 && (
                  <span className="ml-1.5">({counts.completed})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[#E5E7EB] bg-white gap-1.5 h-9"
                >
                  {t("filterByProject")}{" "}
                  <span className="font-medium text-[#111111] max-w-[120px] truncate">
                    {selectedProjectLabel}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => setProjectFilter("all")}>
                  {t("allProjects")}
                </DropdownMenuItem>
                {projectOptions.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => setProjectFilter(p.id)}
                  >
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[#E5E7EB] bg-white gap-1.5 h-9"
                >
                  {t("filterByAssignee")}{" "}
                  <span className="font-medium text-[#111111] max-w-[120px] truncate">
                    {selectedAssigneeLabel}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => setAssigneeFilter("all")}>
                  {t("allAssignees")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAssigneeFilter("unassigned")}
                >
                  {t("unassigned")}
                </DropdownMenuItem>
                {assigneeOptions.map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => setAssigneeFilter(u.id)}
                  >
                    {(u.name && u.name.trim()) || u.email}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[#E5E7EB] bg-white gap-1.5 h-9"
                >
                  {t("filterByPriority")}{" "}
                  <span className="font-medium text-[#111111]">
                    {selectedPriorityLabel}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
                  {t("allPriorities")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                  {t("priorityHigh")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("normal")}>
                  {t("priorityNormal")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                  {t("priorityLow")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-medium text-[#667085] shrink-0">
                {t("groupBy")}
              </span>
              <SegmentedControl
                value={groupBy}
                onChange={(v) =>
                  setGroupBy(v as "project" | "assignee" | "due")
                }
                options={[
                  { value: "project", label: t("groupByProject") },
                  { value: "assignee", label: t("groupByAssignee") },
                  { value: "due", label: t("groupByDue") },
                ]}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-[#667085] flex-shrink-0">
                <span>Filtrer : </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-[#111111] font-medium cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="DOING">En cours</option>
                  <option value="TODO">À faire</option>
                  <option value="BLOCKED">Bloquées</option>
                  <option value="DONE">Complétées</option>
                </select>
              </div>
              <div className="px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] flex-shrink-0">
                <span className="text-sm font-semibold text-[#111111]">
                  {filteredActions.length} résultat
                  {filteredActions.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredActions.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Aucune action ne correspond aux filtres ou à la recherche. Tu peux élargir les critères ou repartir de la liste complète."
          ctaLabel="Voir toutes les actions"
          ctaAction="/app/actions"
        />
      ) : (
        <div className="space-y-8">
          {groupedEntries.groupOrder.map((groupKey) => (
            <div key={groupKey} className="space-y-3">
              <h3 className="text-sm font-semibold text-[#111111] px-1 border-b border-[#E5E7EB] pb-2">
                {groupKey}
                <span className="text-[#667085] font-normal ml-2">
                  ({groupedEntries.groups.get(groupKey)?.length ?? 0})
                </span>
              </h3>
              <div className="space-y-4">
                {(groupedEntries.groups.get(groupKey) ?? []).map((action) =>
                  renderActionCard(action),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
