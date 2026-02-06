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
      {/* Badge "Engagement" visuel amélioré */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200/60">
        <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105 ${
          isDecided
            ? "bg-gradient-to-br from-emerald-100 via-emerald-50 to-white border-2 border-emerald-200/60"
            : "bg-gradient-to-br from-blue-100 via-blue-50 to-white border-2 border-blue-200/60"
        }`}>
          <Scale className={`h-7 w-7 ${
            isDecided
              ? "text-emerald-600 drop-shadow-sm"
              : "text-blue-600 drop-shadow-sm"
          }`} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Décision</div>
          <div className="text-base font-semibold text-slate-800 leading-relaxed">
            {isDecided 
              ? "Engagement pris et en cours d'exécution" 
              : "Engagement en préparation"}
          </div>
        </div>
      </div>

      <div className="pt-2">
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
      </div>

      {/* Impact de l'engagement : Métriques visuelles harmonisées */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/30 rounded-xl border border-blue-200/50 shadow-md shadow-blue-100/20 backdrop-blur-sm">
          <div className="space-y-2 group">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <ListTodo className="h-4 w-4 text-slate-600" />
              </div>
              <span>Total actions</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{meta.actionCount}</div>
          </div>
          
          {meta.actionStats.open > 0 && (
            <div className="space-y-2 group">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
                <span>En cours</span>
              </div>
              <div className="text-3xl font-bold text-blue-700 tracking-tight">{meta.actionStats.open}</div>
            </div>
          )}
          
          {meta.actionStats.done > 0 && (
            <div className="space-y-2 group">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <span>Terminées</span>
              </div>
              <div className="text-3xl font-bold text-emerald-700 tracking-tight">{meta.actionStats.done}</div>
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block border border-emerald-200/60 shadow-sm">
                {completionRate}% complété
              </div>
            </div>
          )}
          
          {meta.actionStats.blocked > 0 && (
            <div className="space-y-2 group">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Ban className="h-4 w-4 text-amber-600" />
                </div>
                <span>Bloquées</span>
              </div>
              <div className="text-3xl font-bold text-amber-700 tracking-tight">{meta.actionStats.blocked}</div>
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
