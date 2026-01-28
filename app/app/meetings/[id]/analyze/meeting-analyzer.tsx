"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { showActionsCreatedToast } from "@/lib/toast-actions";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { MeetingEditor } from "@/components/meetings/meeting-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckSquare2, AlertTriangle, FileText, Loader2, Plus, RefreshCw, Clock, Sparkles, ListTodo, LayoutGrid } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { createDecisionsAndActionsFromMeeting } from "./actions";
import { useRouter } from "next/navigation";
import { convertHtmlToPlainText } from "@/lib/meetings/convert-editor-content";

type AnalysisResult = {
  decisions: Array<{
    decision: string;
    contexte: string;
    impact_potentiel: string;
  }>;
  actions: Array<{
    action: string;
    responsable: string;
    echeance: string;
  }>;
  points_a_clarifier: string[];
};

type Meeting = {
  id: string;
  title: string;
  raw_notes: string;
  analysisJson: string | null;
  analyzedAt: Date | null;
};

export function MeetingAnalyzer({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [text, setText] = useState(meeting.raw_notes);
  
  // Mettre à jour le texte si meeting.raw_notes change (après rechargement ou création)
  useEffect(() => {
    setText(meeting.raw_notes);
  }, [meeting.raw_notes]);
  
  // Charger l'analyse depuis le cache si disponible et que raw_notes n'a pas changé
  const initialAnalysis = meeting.analysisJson && meeting.raw_notes === text
    ? (() => {
        try {
          return JSON.parse(meeting.analysisJson) as AnalysisResult;
        } catch {
          return null;
        }
      })()
    : null;
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDecisions, setSelectedDecisions] = useState<Set<number>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<number>>(new Set());
  const [isCreating, startCreate] = useTransition();
  const hasInitializedSelection = useRef(false);
  const hasRefreshedAfterMount = useRef(false);
  
  // Rafraîchir les données une seule fois après le montage si c'est une nouvelle réunion (sans analyse)
  // Note: Ceci garantit que l'analyse peut fonctionner immédiatement après création sans navigation
  useEffect(() => {
    // Réinitialiser le flag si le meeting change
    hasRefreshedAfterMount.current = false;
  }, [meeting.id]);
  
  useEffect(() => {
    // Si pas d'analyse, que raw_notes existe, et qu'on n'a pas encore rafraîchi
    if (!hasRefreshedAfterMount.current && !meeting.analysisJson && meeting.raw_notes && meeting.raw_notes.trim().length > 0) {
      hasRefreshedAfterMount.current = true;
      // Petit délai pour laisser le temps au redirect de se terminer
      const timeoutId = setTimeout(() => {
        router.refresh();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [meeting.id, meeting.analysisJson, meeting.raw_notes, router]);

  // Initialiser les sélections si une analyse existe (UNE SEULE FOIS)
  useEffect(() => {
    if (!initialAnalysis || hasInitializedSelection.current) return;

    setSelectedDecisions(
      new Set(initialAnalysis.decisions.map((_, i) => i))
    );
    setSelectedActions(
      new Set(initialAnalysis.actions.map((_, i) => i))
    );

    hasInitializedSelection.current = true;
  }, [initialAnalysis]);

  // Vérifier si raw_notes a changé depuis la dernière sauvegarde en DB
  const notesChanged = text !== meeting.raw_notes;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Convertir le HTML en texte propre avant l'analyse
      // L'analyse se base sur du texte propre, pas sur du HTML
      const plainText = convertHtmlToPlainText(text);
      
      const response = await fetch("/api/meetings/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId: meeting.id,
          text: plainText, // Envoyer le texte nettoyé pour l'analyse
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse");
      }

      const result = await response.json();
      setAnalysis(result);
      // Sélectionner tout par défaut
      setSelectedDecisions(new Set(result.decisions.map((_: any, i: number) => i)));
      setSelectedActions(new Set(result.actions.map((_: any, i: number) => i)));
      
      // Rafraîchir la page pour mettre à jour le badge
      router.refresh();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'analyse du compte rendu");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreate = async () => {
    // Empêcher les doubles clics - désactiver immédiatement
    if (!analysis || isCreating) return;

    const decisionsToCreate = analysis.decisions.filter((_, i) =>
      selectedDecisions.has(i)
    );
    const actionsToCreate = analysis.actions.filter((_, i) =>
      selectedActions.has(i)
    );

    // Vérifier qu'il y a au moins une décision ou une action à créer
    if (decisionsToCreate.length === 0 && actionsToCreate.length === 0) {
      return;
    }

    // Désactiver le bouton immédiatement en démarrant la transition
    startCreate(async () => {
      try {
        await createDecisionsAndActionsFromMeeting(
          meeting.id,
          decisionsToCreate,
          actionsToCreate
        );
        
        // Afficher le toast de succès
        // Si seulement des actions sont créées, utiliser le message uniforme "Action créée avec succès"
        if (actionsToCreate.length > 0 && decisionsToCreate.length === 0) {
          showActionsCreatedToast(actionsToCreate.length);
        } else if (actionsToCreate.length > 0 || decisionsToCreate.length > 0) {
          // Si actions + décisions, afficher un message combiné
          const totalCreated = decisionsToCreate.length + actionsToCreate.length;
          const messages = [];
          if (decisionsToCreate.length > 0) {
            messages.push(`${decisionsToCreate.length} décision${decisionsToCreate.length > 1 ? "s" : ""}`);
          }
          if (actionsToCreate.length > 0) {
            messages.push(`${actionsToCreate.length} action${actionsToCreate.length > 1 ? "s" : ""}`);
          }
          
          toast.success("Création réussie", {
            description: `${messages.join(" et ")} ${totalCreated > 1 ? "ont été créées" : "a été créée"} avec succès.`,
          });
        }
      } catch (error) {
        // En cas d'erreur, le bouton sera réactivé automatiquement par la transition
        toast.error("Erreur lors de la création", {
          description: error instanceof Error ? error.message : "Une erreur est survenue",
        });
      }
    });
  };

  // Formater la date de dernière analyse
  const formatAnalysisDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Textarea avec texte prérempli */}
      <FlowCard className="bg-white border-slate-200/60 shadow-sm">
        <FlowCardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <FlowCardTitle className="text-lg font-semibold tracking-tight">
                Compte rendu de la réunion
              </FlowCardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Collez/éditez votre compte rendu puis lancez l'analyse
              </p>
            </div>
          </div>
        </FlowCardHeader>
        <FlowCardContent className="p-0">
          <MeetingEditor
            value={text}
            onChange={(html) => setText(html)}
            placeholder="Collez ici le compte rendu complet de la réunion..."
          />
        </FlowCardContent>
      </FlowCard>

      {/* Actions d'analyse */}
      <FlowCard className="bg-white border-slate-200/60 shadow-sm">
        <FlowCardContent>
          <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {notesChanged && analysis && (
                  <Chip variant="warning" size="sm">
                    Le texte a été modifié
                  </Chip>
                )}
                {meeting.analyzedAt && !notesChanged && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Dernière analyse : {formatAnalysisDate(meeting.analyzedAt)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notesChanged && meeting.analyzedAt && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !text.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Ré-analyser
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !text.trim()}
                  className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {notesChanged && analysis ? "Ré-analyser" : "Analyser"}
                    </>
                  )}
                </Button>
              </div>
          </div>
        </FlowCardContent>
      </FlowCard>

      {/* Résultats de l'analyse */}
      {analysis && (
        <>
          {/* Décisions */}
          {analysis.decisions.length > 0 && (
            <FlowCard className="bg-white border-slate-200/60 shadow-sm">
              <FlowCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CheckSquare2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <FlowCardTitle className="text-lg font-semibold tracking-tight">
                        Décisions
                      </FlowCardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {selectedDecisions.size} sur {analysis.decisions.length} sélectionnée{selectedDecisions.size > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </FlowCardHeader>
              <FlowCardContent>
                <div className="space-y-3">
                  {analysis.decisions.map((decision, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDecisions.has(index)}
                        onChange={(e) => {
                          const newSet = new Set(selectedDecisions);
                          if (e.target.checked) {
                            newSet.add(index);
                          } else {
                            newSet.delete(index);
                          }
                          setSelectedDecisions(newSet);
                        }}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 space-y-2 min-w-0">
                        <p className="font-medium text-slate-900 leading-snug">
                          {decision.decision}
                        </p>
                        {(decision.contexte !== "non précisé" || decision.impact_potentiel !== "non précisé") && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {decision.contexte !== "non précisé" && (
                              <span className="text-slate-600">
                                <span className="font-medium">Contexte:</span> {decision.contexte}
                              </span>
                            )}
                            {decision.impact_potentiel !== "non précisé" && (
                              <span className="text-slate-600">
                                <span className="font-medium">Impact:</span> {decision.impact_potentiel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Actions */}
          {analysis.actions.length > 0 && (
            <FlowCard className="bg-white border-slate-200/60 shadow-sm">
              <FlowCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ListTodo className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <FlowCardTitle className="text-lg font-semibold tracking-tight">
                        Actions
                      </FlowCardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {selectedActions.size} sur {analysis.actions.length} sélectionnée{selectedActions.size > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/app/meetings/${meeting.id}/kanban`)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Voir en Kanban
                  </Button>
                </div>
              </FlowCardHeader>
              <FlowCardContent>
                <div className="space-y-3">
                  {analysis.actions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedActions.has(index)}
                        onChange={(e) => {
                          const newSet = new Set(selectedActions);
                          if (e.target.checked) {
                            newSet.add(index);
                          } else {
                            newSet.delete(index);
                          }
                          setSelectedActions(newSet);
                        }}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 space-y-2 min-w-0">
                        <p className="font-medium text-slate-900 leading-snug">
                          {action.action}
                        </p>
                        {(action.responsable !== "non précisé" || action.echeance !== "non précisé") && (
                          <div className="flex flex-wrap gap-2">
                            {action.responsable !== "non précisé" && (
                              <Chip variant="info" size="sm">
                                Responsable: {action.responsable}
                              </Chip>
                            )}
                            {action.echeance !== "non précisé" && (
                              <Chip variant="warning" size="sm">
                                Échéance: {action.echeance}
                              </Chip>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Points à clarifier */}
          {analysis.points_a_clarifier.length > 0 && (
            <FlowCard className="bg-white border-slate-200/60 shadow-sm">
              <FlowCardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <FlowCardTitle className="text-lg font-semibold tracking-tight">
                      Points à clarifier
                    </FlowCardTitle>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {analysis.points_a_clarifier.length} point{analysis.points_a_clarifier.length > 1 ? "s" : ""} nécessitant une clarification
                    </p>
                  </div>
                </div>
              </FlowCardHeader>
              <FlowCardContent>
                <div className="space-y-2">
                  {analysis.points_a_clarifier.map((point, index) => (
                    <div
                      key={index}
                      className="text-sm text-slate-700 p-3 rounded-lg bg-orange-50/50 border border-orange-200/60 leading-relaxed"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Bouton de création */}
          {(selectedDecisions.size > 0 || selectedActions.size > 0) && (
            <FlowCard className="bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/30 border-blue-200/60 shadow-md">
              <FlowCardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Prêt à créer dans PILOTYS ?
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedDecisions.size > 0 && `${selectedDecisions.size} décision${selectedDecisions.size > 1 ? "s" : ""}`}
                      {selectedDecisions.size > 0 && selectedActions.size > 0 && " et "}
                      {selectedActions.size > 0 && `${selectedActions.size} action${selectedActions.size > 1 ? "s" : ""}`}
                      {" seront créées dans votre espace de travail"}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating}
                    size="lg"
                    className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white font-medium px-8"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Créer {selectedDecisions.size} décision
                        {selectedDecisions.size > 1 ? "s" : ""} et{" "}
                        {selectedActions.size} action
                        {selectedActions.size > 1 ? "s" : ""} dans PILOTYS
                      </>
                    )}
                  </Button>
                </div>
              </FlowCardContent>
            </FlowCard>
          )}
        </>
      )}
    </div>
  );
}

