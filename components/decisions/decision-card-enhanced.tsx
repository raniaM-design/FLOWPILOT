"use client";

import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Scale, 
  Calendar, 
  CheckSquare2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  FolderKanban,
  ListTodo,
  TrendingUp,
  Zap
} from "lucide-react";
import { formatShortDate, isOverdue } from "@/lib/timeUrgency";
import { cn } from "@/lib/utils";

interface DecisionCardEnhancedProps {
  decision: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    project: {
      id: string;
      name: string;
    };
    actions: Array<{
      id: string;
      status: string;
      dueDate: string | null;
    }>;
  };
  meta: {
    risk: {
      level: "GREEN" | "YELLOW" | "RED";
      reason: string;
    };
    actionCount: number;
    nextDueDate: Date | null;
  };
}

export function DecisionCardEnhanced({ decision, meta }: DecisionCardEnhancedProps) {
  const isDecided = decision.status === "DECIDED";
  const isArchived = decision.status === "ARCHIVED";
  const isDraft = decision.status === "DRAFT";
  
  // Calculer le pourcentage de complétion
  const doneActions = decision.actions.filter((a) => a.status === "DONE").length;
  const completionRate = decision.actions.length > 0
    ? Math.round((doneActions / decision.actions.length) * 100)
    : 0;

  // Vérifier si en retard
  const nextDue = meta.nextDueDate 
    ? (meta.nextDueDate instanceof Date ? meta.nextDueDate : new Date(meta.nextDueDate))
    : null;
  const isOverdueDate = nextDue ? isOverdue(nextDue, "TODO", new Date()) : false;
  const hasRisk = meta.risk.level === "RED" || meta.risk.level === "YELLOW";

  // Obtenir le style du badge de statut avec couleurs cohérentes
  const getStatusBadge = () => {
    if (isArchived) {
      return {
        variant: "neutral" as const,
        label: "Archivée",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }
    if (isDecided) {
      return {
        variant: "success" as const,
        label: "Décidée",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }
    if (hasRisk) {
      return {
        variant: "warning" as const,
        label: isOverdueDate ? "En retard" : "À surveiller",
        className: isOverdueDate 
          ? "bg-red-100 text-red-700 border-red-200" 
          : "bg-amber-100 text-amber-700 border-amber-200",
      };
    }
    return {
      variant: "neutral" as const,
      label: "Brouillon",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };
  };

  const statusBadge = getStatusBadge();

  // Couleur de bordure gauche selon le statut/risque
  const getBorderColor = () => {
    if (isArchived) return "border-l-slate-300";
    if (isDecided) return "border-l-emerald-500";
    if (isOverdueDate) return "border-l-red-500";
    if (hasRisk) return "border-l-amber-500";
    return "border-l-blue-500";
  };

  // Format date de création
  const formatCreatedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const decisionDate = new Date(date);
    decisionDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - decisionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  // Style avec couleurs cohérentes de l'application
  const getCardStyle = () => {
    if (isArchived) {
      return {
        borderColor: "border-l-slate-300",
        bgGradient: "bg-gradient-to-br from-slate-50/40 via-white to-slate-50/20",
        accentColor: "slate",
      };
    }
    if (isDecided) {
      return {
        borderColor: "border-l-emerald-500",
        bgGradient: "bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20",
        accentColor: "emerald",
      };
    }
    if (isOverdueDate) {
      return {
        borderColor: "border-l-red-500",
        bgGradient: "bg-gradient-to-br from-red-50/40 via-white to-red-50/20",
        accentColor: "red",
      };
    }
    if (hasRisk) {
      return {
        borderColor: "border-l-amber-500",
        bgGradient: "bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20",
        accentColor: "amber",
      };
    }
    return {
      borderColor: "border-l-blue-500",
      bgGradient: "bg-gradient-to-br from-blue-50/40 via-white to-blue-50/20",
      accentColor: "blue",
    };
  };

  const cardStyle = getCardStyle();

  // Format date courte pour échéance
  const formatDueDateShort = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays < 0) return `Il y a ${Math.abs(diffDays)}j`;
    if (diffDays <= 7) return `Dans ${diffDays}j`;
    
    return due.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Couleurs cohérentes avec l'application
  const getIconStyle = (type: "action" | "due" | "empty") => {
    if (isDecided) {
      return {
        action: "bg-emerald-100 text-emerald-600",
        due: "bg-emerald-100 text-emerald-600",
        empty: "bg-slate-100 text-slate-400",
      };
    }
    if (isOverdueDate) {
      return {
        action: "bg-red-100 text-red-600",
        due: "bg-red-100 text-red-600",
        empty: "bg-slate-100 text-slate-400",
      };
    }
    if (hasRisk) {
      return {
        action: "bg-amber-100 text-amber-600",
        due: "bg-amber-100 text-amber-600",
        empty: "bg-slate-100 text-slate-400",
      };
    }
    return {
      action: "bg-blue-100 text-blue-600",
      due: "bg-blue-100 text-blue-600",
      empty: "bg-slate-100 text-slate-400",
    };
  };

  const iconStyle = getIconStyle("action");

  // Informations complémentaires pour les tooltips
  const getTooltipInfo = () => {
    const info = [];
    
    if (decision.project) {
      info.push(`Projet: ${decision.project.name}`);
    }
    
    if (meta.actionCount > 0) {
      const done = decision.actions.filter(a => a.status === "DONE").length;
      const open = decision.actions.filter(a => a.status !== "DONE" && a.status !== "BLOCKED").length;
      const blocked = decision.actions.filter(a => a.status === "BLOCKED").length;
      
      info.push(`${meta.actionCount} action${meta.actionCount > 1 ? "s" : ""}`);
      if (done > 0) info.push(`${done} terminée${done > 1 ? "s" : ""}`);
      if (open > 0) info.push(`${open} en cours`);
      if (blocked > 0) info.push(`${blocked} bloquée${blocked > 1 ? "s" : ""}`);
    }
    
    if (nextDue) {
      const dueDate = nextDue.toLocaleDateString("fr-FR", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      });
      info.push(`Échéance: ${dueDate}`);
    }
    
    info.push(`Créée: ${new Date(decision.createdAt).toLocaleDateString("fr-FR", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    })}`);
    
    return info.join(" • ");
  };

  const tooltipInfo = getTooltipInfo();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/app/decisions/${decision.id}`} className="block group">
            <FlowCard 
              variant="default" 
              className={cn(
                "bg-white border border-slate-200/60 rounded-xl shadow-sm transition-all duration-200",
                "hover:shadow-md hover:border-blue-300/40 hover:-translate-y-0.5",
                cardStyle.borderColor,
                cardStyle.bgGradient,
                "border-l-[3px]",
                isArchived && "opacity-70"
              )}
            >
              <FlowCardContent className="p-5">
                <div className="space-y-4">
                  {/* Header : Titre + Badges */}
                  <div className="space-y-2.5">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {decision.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip 
                        variant={statusBadge.variant} 
                        size="sm" 
                        className={cn(
                          "text-xs font-medium",
                          statusBadge.className
                        )}
                      >
                        {statusBadge.label}
                      </Chip>
                      {hasRisk && !isOverdueDate && (
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          meta.risk.level === "RED" 
                            ? "bg-red-100 text-red-700" 
                            : "bg-amber-100 text-amber-700"
                        )}>
                          <AlertCircle className="h-3 w-3" />
                          <span>{meta.risk.level === "RED" ? "Critique" : "Attention"}</span>
                        </div>
                      )}
                      {isOverdueDate && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          <Clock className="h-3 w-3" />
                          <span>En retard</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloc d'information avec couleurs cohérentes */}
                  <div className="space-y-3 pt-3 border-t border-slate-200/60">
                    {/* Actions */}
                    {meta.actionCount > 0 ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/40 border border-blue-100/60">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            completionRate === 100 
                              ? "bg-emerald-100 text-emerald-600" 
                              : iconStyle.action
                          )}>
                            <ListTodo className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-600 mb-0.5">Actions</div>
                            <div className="text-base font-semibold text-slate-900">
                              {meta.actionCount} <span className="text-sm font-medium text-slate-500">• {completionRate}%</span>
                            </div>
                          </div>
                        </div>
                        {completionRate === 100 && (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckSquare2 className="h-4 w-4 text-emerald-600" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/40 border border-slate-200/60">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-600 mb-0.5">Actions</div>
                          <div className="text-sm font-medium text-slate-400">Aucune action</div>
                        </div>
                      </div>
                    )}

                    {/* Échéance */}
                    {nextDue ? (
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isOverdueDate 
                          ? "bg-red-50/40 border-red-100/60" 
                          : "bg-amber-50/40 border-amber-100/60"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isOverdueDate 
                              ? "bg-red-100 text-red-600" 
                              : "bg-amber-100 text-amber-600"
                          )}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-600 mb-0.5">Échéance</div>
                            <div className={cn(
                              "text-base font-semibold",
                              isOverdueDate ? "text-red-600" : "text-slate-900"
                            )}>
                              {formatDueDateShort(nextDue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/40 border border-slate-200/60">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-600 mb-0.5">Créée</div>
                          <div className="text-sm font-medium text-slate-600">
                            {formatCreatedDate(decision.createdAt)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Barre de progression */}
                    {decision.actions.length > 0 && (
                      <div className="pt-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500 ease-out rounded-full",
                              completionRate === 100 
                                ? "bg-emerald-500" 
                                : "bg-blue-500"
                            )}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </FlowCardContent>
            </FlowCard>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs leading-relaxed">{tooltipInfo}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

