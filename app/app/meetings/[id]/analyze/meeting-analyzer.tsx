"use client";

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { showActionsCreatedToast } from "@/lib/toast-actions";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { MeetingEditor } from "@/components/meetings/meeting-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Plus, RefreshCw, Clock, Sparkles, AlertCircle, Mic } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { MeetingAnalysisResult } from "@/components/meetings/meeting-analysis-result";
import { createDecisionsAndActionsFromMeeting } from "./actions";
import { useRouter } from "next/navigation";
import { convertHtmlToPlainText } from "@/lib/meetings/convert-editor-content";
import { MeetingNotesTemplateSelector } from "@/components/meetings/meeting-notes-template-selector";
import type { MeetingNotesTemplateSelection } from "@/components/meetings/meeting-notes-template-selector";

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
  points_a_venir?: string[];
  /** Présent si l’analyse a été faite sur un texte détecté comme transcription auto, ou passe renforcée. */
  _meta?: { isTranscription?: boolean; reinforcedAnalysis?: boolean };
};

type Meeting = {
  id: string;
  title: string;
  raw_notes: string;
  analysisJson: string | null;
  analyzedAt: Date | null;
  notesTemplatePreset: string | null;
  notesCustomTemplateId: string | null;
};

export function MeetingAnalyzer({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [text, setText] = useState(meeting.raw_notes);
  const textRef = useRef(text);
  const [templateSelection, setTemplateSelection] = useState<MeetingNotesTemplateSelection>({
    presetKey: meeting.notesTemplatePreset,
    customTemplateId: meeting.notesCustomTemplateId,
  });

  const editorAdapter = useMemo(
    () => ({
      getContent: () => textRef.current,
      setContent: (html: string) => setText(html),
    }),
    [],
  );

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    setTemplateSelection({
      presetKey: meeting.notesTemplatePreset,
      customTemplateId: meeting.notesCustomTemplateId,
    });
  }, [meeting.id, meeting.notesTemplatePreset, meeting.notesCustomTemplateId]);
  
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
          text: plainText,
          htmlContent: text,
          notesTemplatePreset: templateSelection.presetKey,
          notesCustomTemplateId: templateSelection.customTemplateId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        console.error("Erreur API:", errorData);
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Vérifier que le résultat est valide
      if (!result || (typeof result !== 'object')) {
        throw new Error("Résultat d'analyse invalide");
      }
      
      // Vérifier si l'analyse a trouvé quelque chose
      const hasDecisions = Array.isArray(result.decisions) && result.decisions.length > 0;
      const hasActions = Array.isArray(result.actions) && result.actions.length > 0;
      const hasClarify = Array.isArray(result.points_a_clarifier) && result.points_a_clarifier.length > 0;
      const hasNext = Array.isArray(result.points_a_venir) && result.points_a_venir.length > 0;
      
      if (!hasDecisions && !hasActions && !hasClarify && !hasNext) {
        toast.info("Aucun élément extrait", {
          description: "L'analyse n'a trouvé aucun élément structuré. Conseil : utilisez des sections (Décisions, Actions, À venir) ou des formulations explicites comme « Nous avons décidé de… » ou « Jean va préparer… ».",
        });
      }
      
      setAnalysis(result);
      // Sélectionner tout par défaut
      setSelectedDecisions(new Set(result.decisions?.map((_: any, i: number) => i) || []));
      setSelectedActions(new Set(result.actions?.map((_: any, i: number) => i) || []));
      
      // Rafraîchir la page pour mettre à jour les points à clarifier
      router.refresh();
      
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
      <FlowCard id="meeting-notes" className="bg-white border-slate-200/60 shadow-sm scroll-mt-24">
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
        <FlowCardContent className="p-0 space-y-0">
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50">
            <MeetingNotesTemplateSelector
              editorAdapter={editorAdapter}
              selection={templateSelection}
              onSelectionChange={setTemplateSelection}
            />
          </div>
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
          {analysis._meta?.isTranscription && (
            <FlowCard className="bg-amber-50/90 border-amber-200/80 shadow-sm">
              <FlowCardContent>
                <div className="flex gap-3 p-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-amber-800" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-amber-950">
                      Source détectée : transcription automatique
                    </p>
                    <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
                      Le texte ressemble à une transcription audio (horodatages, locuteurs, oral…).
                      L’analyse tient compte de ce contexte, mais peut être un peu moins précise
                      qu’avec un compte rendu rédigé à la main. Vérifiez les extractions avant validation.
                    </p>
                  </div>
                </div>
              </FlowCardContent>
            </FlowCard>
          )}
          {/* Message si aucune donnée trouvée */}
          {analysis.decisions.length === 0 && 
           analysis.actions.length === 0 && 
           analysis.points_a_clarifier.length === 0 && 
           (analysis.points_a_venir?.length === 0 || !analysis.points_a_venir) && (
            <FlowCard className="bg-white border-slate-200/60 shadow-sm">
              <FlowCardContent>
                <div className="flex items-center gap-3 p-4 text-slate-600">
                  <AlertCircle className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">Aucun élément trouvé</p>
                    <p className="text-sm mt-1">
                      L'analyse n'a trouvé aucun élément structuré. Conseil : utilisez des sections (Décisions, Actions, À venir)
                      ou des formulations explicites comme « Nous avons décidé de… » ou « Jean va préparer… ».
                    </p>
                  </div>
                </div>
              </FlowCardContent>
            </FlowCard>
          )}
          {!(
            analysis.decisions.length === 0 &&
            analysis.actions.length === 0 &&
            analysis.points_a_clarifier.length === 0 &&
            (analysis.points_a_venir?.length === 0 || !analysis.points_a_venir)
          ) && (
            <MeetingAnalysisResult
              analysis={analysis}
              meetingId={meeting.id}
              selectedDecisions={selectedDecisions}
              selectedActions={selectedActions}
              onToggleDecision={(index, checked) => {
                const next = new Set(selectedDecisions);
                if (checked) next.add(index);
                else next.delete(index);
                setSelectedDecisions(next);
              }}
              onToggleAction={(index, checked) => {
                const next = new Set(selectedActions);
                if (checked) next.add(index);
                else next.delete(index);
                setSelectedActions(next);
              }}
              notesSectionId="meeting-notes"
            />
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

