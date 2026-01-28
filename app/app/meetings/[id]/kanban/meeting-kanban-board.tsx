"use client";

import { useMemo, useTransition } from "react";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/timeUrgency";
import { Calendar, User, FileText, AlertCircle, MoreVertical, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateActionStatus } from "@/app/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getActionStatusLabel } from "@/lib/utils/action-status";

type ActionItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null; // Sérialisé en string par Next.js
  assignee: {
    id: string;
    email: string;
  } | null;
  decision: {
    id: string;
    title: string;
  } | null;
};

interface MeetingKanbanBoardProps {
  actions: ActionItem[];
}

type StatusGroup = "TODO" | "DOING" | "BLOCKED" | "DONE";

const STATUS_CONFIG: Record<StatusGroup, { label: string; color: string }> = {
  TODO: { label: "À faire", color: "bg-slate-50 border-slate-200" },
  DOING: { label: "En cours", color: "bg-blue-50 border-blue-200" },
  BLOCKED: { label: "En attente", color: "bg-amber-50 border-amber-200" },
  DONE: { label: "Terminé", color: "bg-emerald-50 border-emerald-200" },
};

export function MeetingKanbanBoard({ actions }: MeetingKanbanBoardProps) {
  const router = useRouter();
  
  // Grouper les actions par statut avec fallback pour les statuts inconnus
  const groupedActions = useMemo(() => {
    const groups: Record<StatusGroup, ActionItem[]> = {
      TODO: [],
      DOING: [],
      BLOCKED: [],
      DONE: [],
    };

    actions.forEach((action) => {
      // Mapping fallback : si le statut n'est pas reconnu, mettre dans "À faire"
      // TODO: Vérifier que les actions ont bien un statut valide en base
      const status = (action.status as StatusGroup) || "TODO";
      if (status in groups) {
        groups[status].push(action);
      } else {
        // Fallback pour statuts inconnus
        groups.TODO.push(action);
      }
    });

    return groups;
  }, [actions]);

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = groupedActions[status as StatusGroup].length;
          return (
            <FlowCard key={status} className={cn("text-center", config.color)}>
              <FlowCardContent className="py-4">
                <div className="text-2xl font-bold text-slate-900">{count}</div>
                <div className="text-sm text-slate-600 mt-1">{config.label}</div>
              </FlowCardContent>
            </FlowCard>
          );
        })}
      </div>

      {/* Colonnes Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const statusActions = groupedActions[status as StatusGroup];
          return (
            <div key={status} className="flex flex-col">
              <FlowCard className={cn("flex-1 flex flex-col", config.color)}>
                <FlowCardHeader>
                  <FlowCardTitle className="flex items-center justify-between">
                    <span>{config.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {statusActions.length}
                    </Badge>
                  </FlowCardTitle>
                </FlowCardHeader>
                <FlowCardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
                  <div className="space-y-3">
                    {statusActions.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Aucune action
                      </div>
                    ) : (
                      statusActions.map((action) => (
                        <ActionCard key={action.id} action={action} />
                      ))
                    )}
                  </div>
                </FlowCardContent>
              </FlowCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: ActionItem }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const currentStatus = (action.status as StatusGroup) || "TODO";

  const formatDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return formatShortDate(date);
  };

  const handleStatusChange = (newStatus: StatusGroup) => {
    if (newStatus === currentStatus || isPending) return;

    startTransition(async () => {
      try {
        await updateActionStatus(action.id, newStatus);
        toast.success("Action mise à jour", {
          description: `Statut changé vers "${getActionStatusLabel(newStatus)}"`,
        });
        router.refresh();
      } catch (error) {
        toast.error("Erreur", {
          description: error instanceof Error ? error.message : "Impossible de mettre à jour le statut",
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow relative">
      {/* Menu dropdown pour changer le statut */}
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={isPending}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">
              Déplacer vers
            </div>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const statusKey = status as StatusGroup;
              const isCurrentStatus = statusKey === currentStatus;
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(statusKey)}
                  disabled={isCurrentStatus || isPending}
                  className={cn(
                    "cursor-pointer",
                    isCurrentStatus && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    {isCurrentStatus && (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className={cn(isCurrentStatus && "font-medium")}>
                      {config.label}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Titre */}
      <h4 className="font-medium text-sm text-slate-900 mb-2 line-clamp-2 pr-8">
        {action.title}
      </h4>

      {/* Description */}
      {action.description && (
        <p className="text-xs text-slate-600 mb-3 line-clamp-2">
          {action.description}
        </p>
      )}

      {/* Badge Décision */}
      {action.decision && (
        <div className="mb-3">
          <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit max-w-full">
            <FileText className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {action.decision.title ? `Décision: ${action.decision.title}` : "Décision"}
            </span>
          </Badge>
        </div>
      )}

      {/* Métadonnées */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {/* Responsable */}
        {action.assignee ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{action.assignee.email}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Responsable manquant</span>
          </div>
        )}

        {/* Date d'échéance */}
        {action.dueDate ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatDate(action.dueDate)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>Date à définir</span>
          </div>
        )}
      </div>
    </div>
  );
}

