"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FolderKanban, CheckSquare } from "lucide-react";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";
import { ActionDueBadge } from "@/components/action-due-badge";
import { DueMeta } from "@/lib/timeUrgency";

// Fonction pour obtenir les couleurs selon le statut
function getActionStatusColors(status: string) {
  switch (status) {
    case "TODO":
      return {
        bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
        border: "border-blue-200/60",
        iconBg: "bg-blue-500",
        iconColor: "text-blue-600",
        text: "text-blue-900",
      };
    case "DOING":
      return {
        bg: "bg-gradient-to-br from-yellow-50 to-yellow-100/50",
        border: "border-yellow-200/60",
        iconBg: "bg-yellow-500",
        iconColor: "text-yellow-600",
        text: "text-yellow-900",
      };
    case "DONE":
      return {
        bg: "bg-gradient-to-br from-green-50 to-green-100/50",
        border: "border-green-200/60",
        iconBg: "bg-green-500",
        iconColor: "text-green-600",
        text: "text-green-900",
      };
    case "BLOCKED":
      return {
        bg: "bg-gradient-to-br from-red-50 to-red-100/50",
        border: "border-red-200/60",
        iconBg: "bg-red-500",
        iconColor: "text-red-600",
        text: "text-red-900",
      };
    default:
      return {
        bg: "bg-gradient-to-br from-slate-50 to-slate-100/50",
        border: "border-slate-200/60",
        iconBg: "bg-slate-500",
        iconColor: "text-slate-600",
        text: "text-slate-900",
      };
  }
}

interface DashboardActionItemProps {
  action: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    projectId: string;
    project: { id: string; name: string };
    decisionId?: string | null;
    decision?: { id: string } | null;
  };
  dueMeta: DueMeta;
  overdue: boolean;
}

export function DashboardActionItem({
  action,
  dueMeta,
  overdue,
}: DashboardActionItemProps) {
  const statusColors = getActionStatusColors(action.status);
  const isOverdueStyle = overdue && action.status !== "DONE";
  
  return (
    <Card
      className={`transition-all duration-200 rounded-xl shadow-sm ${
        isOverdueStyle
          ? "border-red-300/60 bg-gradient-to-br from-red-50/80 to-red-100/40 hover:shadow-md hover:border-red-400/60"
          : `${statusColors.bg} ${statusColors.border} border hover:shadow-md`
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={
              action.decisionId || action.decision?.id
                ? `/app/decisions/${action.decisionId || action.decision?.id}`
                : `/app/projects/${action.projectId}`
            }
            className="flex-1 min-w-0"
            onClick={(e) => {
              // Ne pas naviguer si on clique sur les contrôles
              if ((e.target as HTMLElement).closest('[data-action-control]')) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex items-start gap-3 mb-2">
              <div className={`p-1.5 rounded-lg ${statusColors.iconBg} text-white flex-shrink-0 mt-0.5`}>
                <CheckSquare className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={`font-semibold text-sm ${isOverdueStyle ? "text-red-900" : statusColors.text}`}>
                    {action.title}
                  </p>
                  <Badge 
                    variant={getActionStatusBadgeVariant(action.status)} 
                    className={`text-xs font-medium ${
                      action.status === "TODO" ? "bg-blue-100 text-blue-700 border-blue-300" :
                      action.status === "DOING" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                      action.status === "DONE" ? "bg-green-100 text-green-700 border-green-300" :
                      action.status === "BLOCKED" ? "bg-red-100 text-red-700 border-red-300" :
                      ""
                    }`}
                  >
                    {getActionStatusLabel(action.status)}
                  </Badge>
                  <ActionDueBadge dueMeta={dueMeta} overdue={overdue} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                {action.project.name}
              </span>
              {action.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Échéance : {new Date(action.dueDate).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </Link>
          <div data-action-control onClick={(e) => e.stopPropagation()}>
            <ActionStatusButtons
              actionId={action.id}
              currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

