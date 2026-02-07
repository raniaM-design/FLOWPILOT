"use client";

import Link from "next/link";
import { Calendar, FolderKanban, CheckSquare } from "lucide-react";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { isOverdue } from "@/lib/timeUrgency";

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
}

/**
 * Liste intelligente des priorités - Section principale du dashboard
 * Mélange : retard → bloqué → semaine/aujourd'hui
 */
export function PrioritiesList({ actions }: PrioritiesListProps) {
  const getActionStatus = (action: PriorityAction): { label: string; color: string; bg: string } => {
    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    const isBlocked = action.status === "BLOCKED";
    
    if (overdue) {
      return {
        label: "En retard",
        color: "text-red-700",
        bg: "bg-red-100",
      };
    }
    if (isBlocked) {
      return {
        label: "Bloquée",
        color: "text-orange-700",
        bg: "bg-orange-100",
      };
    }
    if (action.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(action.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return {
          label: "Aujourd'hui",
          color: "text-blue-700",
          bg: "bg-blue-100",
        };
      }
      if (diffDays <= 7) {
        return {
          label: "Cette semaine",
          color: "text-blue-700",
          bg: "bg-blue-100",
        };
      }
    }
    return {
      label: "À faire",
      color: "text-slate-700",
      bg: "bg-slate-100",
    };
  };

  const getActionBg = (action: PriorityAction): string => {
    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    const isBlocked = action.status === "BLOCKED";
    
    if (overdue) return "bg-red-50";
    if (isBlocked) return "bg-orange-50";
    return "bg-blue-50";
  };

  const getIconColor = (action: PriorityAction): string => {
    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    const isBlocked = action.status === "BLOCKED";
    
    if (overdue) return "bg-red-100 text-red-600";
    if (isBlocked) return "bg-orange-100 text-orange-600";
    return "bg-blue-100 text-blue-600";
  };

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-slate-600">Aucune priorité pour le moment. Tout est à jour !</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Mes priorités</h2>
        <p className="text-sm text-slate-600 mt-1">Ce qui nécessite votre attention maintenant</p>
      </div>
      <div className="divide-y divide-slate-100">
        {actions.slice(0, 7).map((action) => {
          const status = getActionStatus(action);
          const bg = getActionBg(action);
          const iconColor = getIconColor(action);
          
          return (
            <Link
              key={action.id}
              href={`/app/projects/${action.projectId}?actionId=${action.id}`}
              className={`block ${bg} hover:opacity-90 transition-opacity`}
            >
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColor}`}>
                    <CheckSquare className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900">
                        {action.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                        {status.label}
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
      {actions.length > 7 && (
        <div className="p-4 border-t border-slate-100">
          <Link
            href="/app/actions"
            className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Voir toutes les tâches ({actions.length})
          </Link>
        </div>
      )}
    </div>
  );
}

