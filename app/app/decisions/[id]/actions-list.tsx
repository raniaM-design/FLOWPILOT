"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";
import { ActionDueBadge } from "@/components/action-due-badge";
import { DueMeta } from "@/lib/timeUrgency";

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  dueMeta: DueMeta;
  overdue: boolean;
}

interface ActionsListProps {
  actions: ActionItem[];
}

type FilterType = "all" | "overdue" | "blocked" | "open";

export function ActionsList({ actions }: ActionsListProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  // Filtrage local côté client
  const filteredActions = actions.filter((action) => {
    switch (filter) {
      case "overdue":
        return action.overdue;
      case "blocked":
        return action.status === "BLOCKED";
      case "open":
        return action.status !== "DONE";
      default:
        return true;
    }
  });


  return (
    <div className="space-y-4">
      {/* Filtres */}
      {actions.length > 0 && (
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="overdue">
              En retard
              {actions.filter((a) => a.overdue).length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {actions.filter((a) => a.overdue).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="blocked">
              Bloquées
              {actions.filter((a) => a.status === "BLOCKED").length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {actions.filter((a) => a.status === "BLOCKED").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="open">
              Ouvertes
              {actions.filter((a) => a.status !== "DONE").length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {actions.filter((a) => a.status !== "DONE").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Liste des actions */}
      {filteredActions.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>
            {filter === "all"
              ? "Aucune action liée à cette décision"
              : filter === "overdue"
              ? "Aucune action en retard"
              : filter === "blocked"
              ? "Aucune action bloquée"
              : "Aucune action ouverte"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActions.map((action) => (
            <div
              key={action.id}
              className={`flex items-start justify-between gap-4 p-3 rounded-lg border transition-colors ${
                action.overdue
                  ? "border-destructive/50 bg-destructive/5"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <CheckSquare className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-sm">{action.title}</p>
                  <Badge variant={getActionStatusBadgeVariant(action.status)} className="text-xs">
                    {getActionStatusLabel(action.status)}
                  </Badge>
                    <ActionDueBadge dueMeta={action.dueMeta} overdue={action.overdue} />
                  </div>
                  {action.description && (
                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                      {action.description}
                    </p>
                  )}
                </div>
              </div>
              <ActionStatusButtons
                actionId={action.id}
                currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

