import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { FileText, Scale } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-field";

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
export function DecisionSummaryCard({ context, decision }: DecisionSummaryCardProps) {
  const hasContent = context || decision;
  const isDecided = decision !== null && decision.trim() !== "";

  return (
    <FlowCard variant="default">
      <FlowCardHeader>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-border ${
            isDecided
              ? "bg-emerald-50 dark:bg-emerald-950/30"
              : "bg-indigo-50 dark:bg-indigo-950/30"
          }`}>
            <Scale className={`h-5 w-5 ${
              isDecided
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-indigo-600 dark:text-indigo-400"
            }`} />
          </div>
          <FlowCardTitle className="text-lg font-semibold tracking-tight">
            Engagement
          </FlowCardTitle>
        </div>
      </FlowCardHeader>
      <FlowCardContent>
        {!hasContent ? (
          <div className="py-16 text-center">
            <FileText className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <p className="text-base font-semibold text-foreground mb-2">
              Aucun engagement documenté
            </p>
            <p className="text-sm text-muted-foreground">
              Documentez le contexte et la décision pour tracer cet engagement
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne gauche: Contexte */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                Contexte
              </h3>
              {context ? (
                <RichTextDisplay content={context} className="text-sm" />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Aucun contexte renseigné
                </p>
              )}
            </div>

            {/* Colonne droite: Décision prise (engagement) */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isDecided ? "bg-emerald-500 dark:bg-emerald-400" : "bg-indigo-500 dark:bg-indigo-400"
                }`} />
                Décision prise
                {isDecided && (
                  <Chip variant="success" size="sm" className="ml-2">
                    Engagée
                  </Chip>
                )}
              </h3>
              {decision ? (
                <div className="relative">
                  <RichTextDisplay content={decision} className="text-sm font-medium" />
                  {isDecided && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Engagement actif — Actions en cours d'exécution
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Aucune décision documentée
                </p>
              )}
            </div>
          </div>
        )}
      </FlowCardContent>
    </FlowCard>
  );
}
