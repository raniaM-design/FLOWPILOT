"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { ActionDueBadge } from "@/components/action-due-badge";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { DueMeta } from "@/lib/timeUrgency";
import { FolderKanban, Scale, ArrowRight, CheckCircle2, CheckSquare } from "lucide-react";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";

interface ActionCardProps {
  action: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueMeta: DueMeta;
    overdue: boolean;
    project: {
      id: string;
      name: string;
    };
    decision: {
      id: string;
      title: string;
    } | null;
  };
}

export function ActionCard({ action }: ActionCardProps) {
  const router = useRouter();
  const isDone = action.status === "DONE";
  const isInProgress = action.status === "DOING";
  const isBlocked = action.status === "BLOCKED";
  
  // Lien vers la décision si présente
  const decisionHref = action.decision ? `/app/decisions/${action.decision.id}` : null;
  const projectHref = `/app/projects/${action.project.id}?actionId=${action.id}`;

  const handleDecisionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (decisionHref) {
      router.push(decisionHref);
    }
  };

  return (
    <Link href={projectHref} className="block group">
      <FlowCard 
        variant="default" 
        interactive
        className="relative transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]"
      >
        
        {/* Barre verticale à gauche selon le statut */}
        {action.overdue && !isDone && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />
        )}
        {isBlocked && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl" />
        )}
        {isInProgress && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
        )}
        {isDone && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl" />
        )}

        <FlowCardContent className={`p-5 ${action.overdue || isBlocked || isInProgress || isDone ? "pl-5" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Titre avec icône Action systématique */}
              <div className="flex items-start gap-2 mb-3">
                {/* Icône Action - Repère visuel systématique */}
                <CheckSquare className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" strokeWidth={1.75} />
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-base text-foreground mb-2 leading-tight group-hover:text-primary transition-colors ${
                    isDone ? "line-through text-muted-foreground" : ""
                  }`}>
                    {action.title}
                  </h4>
                  
                  {/* Lien vers la décision - Renforce le lien action → décision */}
                  {action.decision && decisionHref && (
                    <button
                      type="button"
                      onClick={handleDecisionClick}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mb-3 group/decision transition-colors cursor-pointer"
                    >
                      <Scale className="h-3 w-3" />
                      <span>Décision : {action.decision.title}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover/decision:opacity-100 group-hover/decision:translate-x-0.5 transition-all" />
                    </button>
                  )}
                </div>
              </div>

              {/* Badges de statut et urgence */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Chip 
                  variant={
                    getActionStatusBadgeVariant(action.status) === "destructive" 
                      ? "danger" 
                      : getActionStatusBadgeVariant(action.status) === "secondary"
                      ? "warning"
                      : getActionStatusBadgeVariant(action.status) === "default"
                      ? "success"
                      : "neutral"
                  } 
                  size="sm"
                  className=""
                >
                  {getActionStatusLabel(action.status)}
                </Chip>
                {!isDone && <ActionDueBadge dueMeta={action.dueMeta} overdue={action.overdue} />}
              </div>

              {/* Description */}
              {action.description && !isDone && (
                <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap line-clamp-2">
                  {action.description}
                </p>
              )}

              {/* Meta : Projet */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>{action.project.name}</span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-2">
              <ActionStatusWrapper>
                <ActionStatusButtons
                  actionId={action.id}
                  currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                />
              </ActionStatusWrapper>
              <EntityActionsMenu
                entityType="action"
                entityId={action.id}
                entityLabel={action.title}
                redirectTo="/app/actions"
              />
            </div>
          </div>
        </FlowCardContent>
      </FlowCard>
    </Link>
  );
}
