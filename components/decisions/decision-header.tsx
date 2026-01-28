import { PageHeader } from "@/components/ui/page-header";
import { Chip } from "@/components/ui/chip";
import { DecisionRiskBadge } from "@/components/decision-risk-badge";
import { DecisionRisk } from "@/lib/decision-risk";
import { ListTodo, CheckCircle2, Ban, AlertCircle, Scale } from "lucide-react";
import { DecisionStatusDropdown } from "./decision-status-dropdown";
import { CreateActionButton } from "./create-action-button";
import { DecisionDeleteButton } from "./decision-delete-button";

interface DecisionHeaderProps {
  decision: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    project: {
      id: string;
      name: string;
    };
  };
  meta: {
    risk: DecisionRisk;
    actionCount: number;
    actionStats: {
      open: number;
      done: number;
      blocked: number;
    };
  };
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

export function DecisionHeader({ decision, meta }: DecisionHeaderProps) {
  const subtitle = `Projet ${decision.project.name} • ${new Date(decision.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
  
  const isDecided = decision.status === "DECIDED";
  const completionRate = meta.actionCount > 0 
    ? Math.round((meta.actionStats.done / meta.actionCount) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Badge "Engagement" visuel */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
          isDecided
            ? "bg-emerald-100"
            : "bg-indigo-100"
        }`}>
          <Scale className={`h-6 w-6 ${
            isDecided
              ? "text-emerald-600"
              : "text-indigo-600"
          }`} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-500 mb-1">Décision</div>
          <div className="text-sm text-slate-700">
            {isDecided 
              ? "Engagement pris et en cours d'exécution" 
              : "Engagement en préparation"}
          </div>
        </div>
      </div>

      <PageHeader
        title={decision.title}
        subtitle={subtitle}
        badge={{
          label: getDecisionStatusLabel(decision.status),
          variant: decision.status === "DECIDED" ? "default" : "secondary",
        }}
        actions={[
          {
            component: (
              <div className="flex items-center gap-2">
                <DecisionStatusDropdown decisionId={decision.id} currentStatus={decision.status as "DRAFT" | "DECIDED" | "ARCHIVED"} />
                <CreateActionButton decisionId={decision.id} />
                <DecisionDeleteButton decisionId={decision.id} />
              </div>
            ),
          },
        ]}
      />

      {/* Impact de l'engagement : Métriques visuelles */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gradient-to-br from-indigo-50/30 via-white to-emerald-50/20 rounded-xl border border-indigo-200/60">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ListTodo className="h-3.5 w-3.5" />
              <span>Total actions</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{meta.actionCount}</div>
          </div>
          
          {meta.actionStats.open > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <AlertCircle className="h-3.5 w-3.5 text-blue-600" />
                <span>En cours</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{meta.actionStats.open}</div>
            </div>
          )}
          
          {meta.actionStats.done > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Terminées</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700">{meta.actionStats.done}</div>
              <div className="text-xs text-slate-500">{completionRate}% complété</div>
            </div>
          )}
          
          {meta.actionStats.blocked > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Ban className="h-3.5 w-3.5 text-amber-600" />
                <span>Bloquées</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{meta.actionStats.blocked}</div>
            </div>
          )}
        </div>
        
        {/* Badge de risque en dessous */}
        <div className="flex items-center gap-3">
          <DecisionRiskBadge risk={meta.risk} />
        </div>
      </div>
    </div>
  );
}
