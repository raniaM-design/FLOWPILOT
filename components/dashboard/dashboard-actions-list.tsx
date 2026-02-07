"use client";

import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { Calendar, FolderKanban, CheckSquare } from "lucide-react";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { useSearch } from "@/contexts/search-context";
import { useMemo } from "react";

interface DashboardAction {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  projectId: string;
  project: { id: string; name: string };
  decisionId: string | null;
  decision: { id: string } | null;
}

interface DashboardActionsListProps {
  actions: DashboardAction[];
  type: "overdue" | "blocked" | "upcoming";
}

const getUrgencyLabel = (dueDate: Date | null, overdue: boolean): string | null => {
  if (!dueDate) return null;
  if (overdue) return "En retard";
  const dueMeta = getDueMeta(dueDate);
  switch (dueMeta.kind) {
    case "TODAY":
      return "Aujourd'hui";
    case "THIS_WEEK":
      return "Cette semaine";
    default:
      return null;
  }
};

export function DashboardActionsList({ actions, type }: DashboardActionsListProps) {
  const { searchQuery } = useSearch();

  // Filtrer selon la recherche textuelle
  const filteredActions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return actions;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = actions.filter((action) => {
      const titleMatch = action.title?.toLowerCase().includes(query) || false;
      const projectMatch = action.project?.name?.toLowerCase().includes(query) || false;
      return titleMatch || projectMatch;
    });
    
    // Log pour déboguer
    if (searchQuery.trim()) {
      console.log(`[DashboardActionsList-${type}] Recherche:`, searchQuery, "- Résultats:", filtered.length, "/", actions.length);
    }
    
    return filtered;
  }, [actions, searchQuery, type]);

  if (filteredActions.length === 0) {
    if (type === "overdue") {
      return (
        <div className="py-12 text-center">
          <p className="text-sm font-normal text-text-secondary leading-relaxed">
            {searchQuery 
              ? `Aucune action en retard ne correspond à "${searchQuery}".`
              : "Aucune action en retard. Tout est à jour pour aujourd'hui."}
          </p>
        </div>
      );
    }
    if (type === "upcoming") {
      return (
        <div className="py-16 text-center">
          <p className="text-sm font-normal text-text-secondary leading-relaxed">
            {searchQuery
              ? `Aucune action de la semaine ne correspond à "${searchQuery}".`
              : "Aucune action prévue cette semaine. Profitez-en pour vous concentrer sur vos priorités du jour."}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-3">
      {filteredActions.map((action) => {
        const dueMeta = getDueMeta(action.dueDate);
        const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
        const urgencyLabel = getUrgencyLabel(action.dueDate, overdue);
        
        const bgColor = type === "overdue" 
          ? "from-red-50/80 via-red-50/40" 
          : type === "blocked"
          ? "from-orange-50/80 via-amber-50/40"
          : "from-blue-50/80 via-indigo-50/40";
        
        const borderColor = type === "overdue"
          ? "border-red-500"
          : type === "blocked"
          ? "border-orange-500"
          : "border-blue-500";
        
        const iconBg = type === "overdue"
          ? "bg-red-100"
          : type === "blocked"
          ? "bg-orange-100"
          : "bg-blue-100";
        
        const iconColor = type === "overdue"
          ? "text-red-600"
          : type === "blocked"
          ? "text-orange-600"
          : "text-blue-600";
        
        const hoverColor = type === "overdue"
          ? "group-hover:text-red-700"
          : type === "blocked"
          ? "group-hover:text-orange-700"
          : "group-hover:text-blue-700";

        return (
          <Link
            key={action.id}
            href={`/app/projects/${action.projectId}?actionId=${action.id}`}
            className="block group"
          >
            <div className={`${type === "overdue" ? "bg-red-50" : type === "blocked" ? "bg-orange-50" : "bg-blue-50"} rounded-lg shadow-sm p-3 hover:shadow-md transition-all`}>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
                      <CheckSquare className={`h-3 w-3 ${iconColor}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {action.title}
                        </h4>
                        {urgencyLabel && type === "overdue" && (
                          <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-xs font-bold">
                            {urgencyLabel}
                          </span>
                        )}
                        {urgencyLabel && type === "upcoming" && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold">
                            {urgencyLabel}
                          </span>
                        )}
                        {overdue && type === "blocked" && (
                          <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-xs font-bold">
                            En retard
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
            </div>
          </Link>
        );
      })}
    </div>
  );
}

