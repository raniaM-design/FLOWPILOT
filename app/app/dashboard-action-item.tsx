"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FolderKanban } from "lucide-react";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";
import { ActionDueBadge } from "@/components/action-due-badge";
import { DueMeta } from "@/lib/timeUrgency";

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
  return (
    <Card
      className={`transition-colors ${
        overdue
          ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10"
          : "hover:bg-accent/50"
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-medium text-sm">{action.title}</p>
              <Badge variant={getActionStatusBadgeVariant(action.status)} className="text-xs">
                {getActionStatusLabel(action.status)}
              </Badge>
              <ActionDueBadge dueMeta={dueMeta} overdue={overdue} />
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

