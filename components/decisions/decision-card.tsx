import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { DecisionRiskBadge } from "@/components/decision-risk-badge";
import { DecisionUrgencyBar } from "@/components/decision-urgency-bar";
import { DecisionRisk } from "@/lib/decision-risk";
import { FolderKanban, ListTodo, Calendar, Scale, TrendingUp, Target } from "lucide-react";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";

/**
 * Meta calculée pour une décision (doit être calculée côté serveur)
 */
export interface DecisionCardMeta {
  risk: DecisionRisk;
  actionCount: number;
  nextDueDate: Date | null;
}

/**
 * Props pour DecisionCard (Server Component)
 * Toutes les props doivent être sérialisables
 */
export interface DecisionCardProps {
  decision: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    project: {
      id: string;
      name: string;
    };
    actions: Array<{
      id: string;
      status: string;
      dueDate: Date | null;
    }>;
  };
  meta: DecisionCardMeta;
  href?: string; // Optionnel, par défaut /app/decisions/{id}
  showUrgencyBar?: boolean; // Optionnel, par défaut true
}

/**
 * Helper pour obtenir le variant Chip du statut de décision
 */
function getDecisionStatusChipVariant(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "DRAFT":
      return "neutral";
    case "DECIDED":
      return "success";
    case "ARCHIVED":
      return "neutral";
    default:
      return "neutral";
  }
}

/**
 * Helper pour obtenir le label du statut de décision
 */
function getDecisionStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "DECIDED":
      return "Décidée";
    case "ARCHIVED":
      return "Archivée";
    default:
      return status;
  }
}

/**
 * Helper pour formater la prochaine échéance
 */
function formatNextDueDate(date: Date | null): string {
  if (!date) {
    return "Aucune échéance";
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Aujourd'hui";
  }
  if (diffDays === 1) {
    return "Demain";
  }
  if (diffDays < 0) {
    return `En retard (${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? "s" : ""})`;
  }
  if (diffDays <= 7) {
    return `Dans ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  }
  
  return dueDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Composant DecisionCard - Carte moderne réutilisable pour afficher une décision
 * Design renforcé pour évoquer l'engagement et distinguer des actions
 * Server Component - tous les calculs doivent être faits côté serveur avant de passer les props
 */
export function DecisionCard({ decision, meta, href, showUrgencyBar = true }: DecisionCardProps) {
  const cardHref = href || `/app/decisions/${decision.id}`;
  const hasRisk = meta.risk.level === "RED";
  const isDecided = decision.status === "DECIDED";
  
  // Calculer le pourcentage d'actions terminées pour l'impact visuel
  const doneActions = decision.actions.filter(a => a.status === "DONE").length;
  const completionRate = decision.actions.length > 0 
    ? Math.round((doneActions / decision.actions.length) * 100) 
    : 0;

  return (
    <Link href={cardHref} className="block group">
      <FlowCard 
        variant="default" 
        interactive 
        className="relative transition-all duration-150 ease-out"
      >
        {/* Barre verticale à gauche - Plus marquée pour évoquer l'importance */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
          hasRisk 
            ? "bg-red-500" 
            : isDecided
            ? "bg-emerald-500"
            : "bg-indigo-500"
        }`} />
        
        <FlowCardContent className="pl-6">
          {/* En-tête : Icône décision + Titre + Statut */}
          <div className="flex items-start gap-2 mb-4">
            {/* Icône Décision - Repère visuel systématique */}
            <Target className="mt-0.5 h-4 w-4 text-slate-700 dark:text-slate-300 flex-shrink-0" strokeWidth={1.75} />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {decision.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Chip 
                  variant={getDecisionStatusChipVariant(decision.status)} 
                  size="sm"
                  className=""
                >
                  {getDecisionStatusLabel(decision.status)}
                </Chip>
                <DecisionRiskBadge risk={meta.risk} />
              </div>
            </div>
          </div>

          {/* Impact visuel : Métriques d'engagement */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-section-bg/40 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListTodo className="h-3.5 w-3.5" />
                <span>Actions liées</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{meta.actionCount}</span>
                {decision.actions.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({completionRate}% terminées)
                  </span>
                )}
              </div>
            </div>
            {meta.nextDueDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Prochaine échéance</span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatNextDueDate(meta.nextDueDate)}
                </div>
              </div>
            )}
          </div>

          {/* Projet + Actions - Discrètement en bas */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>{decision.project.name}</span>
            </div>
            <EntityActionsMenu
              entityType="decision"
              entityId={decision.id}
              entityLabel={decision.title}
              redirectTo="/app/decisions"
            />
          </div>

          {/* Mini Urgency Bar - Impact visuel de l'exécution */}
          {showUrgencyBar && decision.actions.length > 0 && (
            <div className="mt-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">Avancement</span>
                <span className="text-xs text-muted-foreground">{completionRate}%</span>
              </div>
              <DecisionUrgencyBar actions={decision.actions} />
            </div>
          )}
        </FlowCardContent>
      </FlowCard>
    </Link>
  );
}
