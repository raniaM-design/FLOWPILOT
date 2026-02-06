import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { FileText, Scale } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-field";
import { DecisionContextEditor } from "./decision-context-editor";

interface DecisionSummaryCardProps {
  context: string | null;
  decision: string | null;
  decisionId: string;
  onUpdate?: () => void;
}

/**
 * Bloc "Résumé" avec contexte et décision en 2 colonnes
 * Design renforcé pour évoquer l'engagement
 */
export function DecisionSummaryCard({ context, decision, decisionId }: DecisionSummaryCardProps) {
  const hasContent = context || decision;
  const isDecided = decision !== null && decision.trim() !== "";

  return (
    <FlowCard variant="default" className="bg-white border-slate-200/80 shadow-lg shadow-slate-200/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/20">
      <FlowCardHeader className="bg-gradient-to-r from-blue-50/60 via-white to-emerald-50/30 border-b border-slate-200/60 px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-md transition-all duration-300 hover:scale-105 ${
            isDecided
              ? "bg-gradient-to-br from-emerald-100 via-emerald-50 to-white border-emerald-200/60"
              : "bg-gradient-to-br from-blue-100 via-blue-50 to-white border-blue-200/60"
          }`}>
            <Scale className={`h-6 w-6 ${
              isDecided
                ? "text-emerald-600 drop-shadow-sm"
                : "text-blue-600 drop-shadow-sm"
            }`} />
          </div>
          <FlowCardTitle className="text-xl font-bold tracking-tight text-slate-900">
            Engagement
          </FlowCardTitle>
        </div>
      </FlowCardHeader>
      <FlowCardContent className="p-6 lg:p-8">
        {!hasContent ? (
          <div className="py-20 text-center bg-gradient-to-br from-slate-50/50 to-blue-50/20 rounded-xl border-2 border-dashed border-slate-200/60">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 shadow-sm">
              <FileText className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-base font-bold text-slate-900 mb-2">
              Aucun engagement documenté
            </p>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Documentez le contexte et la décision pour tracer cet engagement
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne gauche: Contexte */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                <span>Contexte</span>
              </h3>
              <DecisionContextEditor decisionId={decisionId} initialContext={context} />
            </div>

            {/* Colonne droite: Décision prise (engagement) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shadow-sm ${
                  isDecided ? "bg-emerald-500" : "bg-blue-500"
                }`} />
                <span>Décision prise</span>
                {isDecided && (
                  <Chip variant="success" size="sm" className="ml-2 shadow-sm">
                    Engagée
                  </Chip>
                )}
              </h3>
              {decision ? (
                <div className="relative">
                  <div className={`rounded-lg p-4 border-2 ${
                    isDecided 
                      ? "bg-emerald-50/50 border-emerald-200/60" 
                      : "bg-blue-50/50 border-blue-200/60"
                  }`}>
                    <RichTextDisplay content={decision} className="text-sm font-semibold leading-relaxed" />
                  </div>
                  {isDecided && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200/60 inline-flex">
                        <span>✓</span>
                        <span>Engagement actif — Actions en cours d'exécution</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50/30 rounded-lg p-4 border border-dashed border-slate-200">
                  <p className="text-sm text-muted-foreground italic text-center">
                    Aucune décision documentée
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </FlowCardContent>
    </FlowCard>
  );
}
