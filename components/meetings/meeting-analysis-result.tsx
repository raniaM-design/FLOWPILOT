"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlowCard, FlowCardContent, FlowCardHeader } from "@/components/ui/flow-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  ListTodo,
  CheckSquare2,
  AlertTriangle,
  FileText,
  LayoutGrid,
  UserPlus,
} from "lucide-react";
import {
  computeAnalysisQuality,
  isUnassignedResponsable,
  type AnalysisQuality,
} from "@/lib/meetings/analysis-quality";

export type { AnalysisQuality };
export { computeAnalysisQuality };

export type MeetingAnalysisResultData = {
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
  _meta?: { isTranscription?: boolean; reinforcedAnalysis?: boolean };
};

function parseActionQuoiPriorite(action: string): { quoi: string; priorite: string } {
  const m = action.match(/^\[Priorité\s+(haute|basse|normale)\]\s*(.*)$/i);
  if (m) {
    return {
      quoi: (m[2] ?? "").trim() || "—",
      priorite: m[1].toLowerCase(),
    };
  }
  return { quoi: action, priorite: "normale" };
}

function formatPrioriteLabel(p: string): string {
  if (p === "haute") return "Haute";
  if (p === "basse") return "Basse";
  return "Normale";
}

export function parseVigilanceLine(line: string): {
  point: string;
  responsable?: string;
} {
  const re = /^(.*?)\s*\(Responsable suivi\s*:\s*(.+?)\)\s*$/;
  const m = line.match(re);
  if (m) {
    return { point: m[1].trim(), responsable: m[2].trim() };
  }
  return { point: line };
}

function extractExecutiveSummary(points_a_venir?: string[]): string {
  if (!points_a_venir?.length) return "";
  const lines = points_a_venir.filter((l) => !/^\s*Participants\s*:/i.test(l));
  const text = lines.join("\n\n").trim();
  const split = text.split(/\n+/).filter(Boolean);
  return split.slice(0, 5).join("\n");
}

type MeetingAnalysisResultProps = {
  analysis: MeetingAnalysisResultData;
  meetingId: string;
  selectedDecisions: Set<number>;
  selectedActions: Set<number>;
  onToggleDecision: (index: number, checked: boolean) => void;
  onToggleAction: (index: number, checked: boolean) => void;
  /** Ancre ou id pour faire défiler vers l’éditeur du compte rendu */
  notesSectionId?: string;
};

export function MeetingAnalysisResult({
  analysis,
  meetingId,
  selectedDecisions,
  selectedActions,
  onToggleDecision,
  onToggleAction,
  notesSectionId = "meeting-notes",
}: MeetingAnalysisResultProps) {
  const router = useRouter();
  const quality = computeAnalysisQuality(analysis);
  const summaryText = extractExecutiveSummary(analysis.points_a_venir);

  const qualityStyles = {
    bonne: {
      bar: "bg-emerald-100 border-emerald-200 text-emerald-900",
      label: "Bonne",
    },
    moyenne: {
      bar: "bg-amber-100 border-amber-200 text-amber-950",
      label: "Moyenne",
    },
    faible: {
      bar: "bg-red-100 border-red-200 text-red-950",
      label: "Faible",
    },
  }[quality];

  const handleAssign = (index: number) => {
    const el = document.getElementById(notesSectionId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.info("Attribuer un responsable", {
      description: `Complétez le compte rendu pour l’action ${index + 1}, puis relancez l’analyse si besoin.`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Qualité + badge renforcée */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div
          className={`flex-1 rounded-xl border px-4 py-3 sm:px-5 ${qualityStyles.bar}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-sm sm:text-base">
              Qualité de l’analyse : {qualityStyles.label}
            </p>
            {analysis._meta?.reinforcedAnalysis && (
              <Chip
                variant="info"
                size="sm"
                className="bg-violet-100 text-violet-900 border-violet-200/80 font-medium"
              >
                Analyse renforcée
              </Chip>
            )}
          </div>
          {quality === "faible" && (
            <p className="text-sm mt-2 leading-relaxed opacity-95">
              Le compte rendu semble incomplet — pensez à préciser les
              responsables et les délais pour une meilleure analyse.
            </p>
          )}
        </div>
      </div>

      {/* —— Actions —— */}
      <section className="rounded-xl border border-sky-200/80 bg-sky-50/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-sky-200/60 bg-sky-100/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-sky-200/80 flex items-center justify-center">
              <ListTodo className="h-4 w-4 text-sky-900" />
            </div>
            <h3 className="font-semibold text-slate-900">Actions</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-sky-300 bg-white/80"
            onClick={() => router.push(`/app/meetings/${meetingId}/kanban`)}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Kanban
          </Button>
        </div>
        <div className="p-3 sm:p-4 overflow-x-auto">
          {analysis.actions.length === 0 ? (
            <p className="text-sm text-slate-600 py-4 text-center">
              Aucune action extraite.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="text-left text-slate-600 border-b border-sky-200/80">
                  <th className="pb-2 pr-2 w-10 font-medium"></th>
                  <th className="pb-2 pr-3 font-medium">Quoi</th>
                  <th className="pb-2 pr-3 font-medium w-[140px]">Qui</th>
                  <th className="pb-2 pr-3 font-medium w-[120px]">Deadline</th>
                  <th className="pb-2 font-medium w-[100px]">Priorité</th>
                  <th className="pb-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {analysis.actions.map((row, index) => {
                  const { quoi, priorite } = parseActionQuoiPriorite(row.action);
                  const missingAssignee = isUnassignedResponsable(row.responsable);
                  return (
                    <tr
                      key={index}
                      className={`border-b border-sky-200/50 align-top ${
                        missingAssignee ? "bg-orange-50/90" : "bg-white/50"
                      }`}
                    >
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedActions.has(index)}
                          onChange={(e) =>
                            onToggleAction(index, e.target.checked)
                          }
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          aria-label={`Sélectionner action ${index + 1}`}
                        />
                      </td>
                      <td className="py-3 pr-3 text-slate-900">{quoi}</td>
                      <td className="py-3 pr-3 text-slate-800">
                        {row.responsable}
                      </td>
                      <td className="py-3 pr-3 text-slate-800">
                        {row.echeance}
                      </td>
                      <td className="py-3 text-slate-800">
                        {formatPrioriteLabel(priorite)}
                      </td>
                      <td className="py-3">
                        {missingAssignee && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-orange-800 border-orange-300 bg-orange-50/80 hover:bg-orange-100 whitespace-nowrap"
                            onClick={() => handleAssign(index)}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Assigner
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* —— Décisions —— */}
      <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-200/60 bg-emerald-100/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-200/80 flex items-center justify-center">
            <CheckSquare2 className="h-4 w-4 text-emerald-900" />
          </div>
          <h3 className="font-semibold text-slate-900">Décisions</h3>
        </div>
        <div className="p-4 space-y-3">
          {analysis.decisions.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-2">
              Aucune décision extraite.
            </p>
          ) : (
            analysis.decisions.map((d, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-white/70 border border-emerald-200/50"
              >
                <input
                  type="checkbox"
                  checked={selectedDecisions.has(index)}
                  onChange={(e) => onToggleDecision(index, e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  aria-label={`Sélectionner décision ${index + 1}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex gap-2 items-start">
                    <span className="text-emerald-600 font-semibold shrink-0" aria-hidden>
                      ✓
                    </span>
                    <span className="font-medium text-slate-900 leading-snug">
                      {d.decision}
                    </span>
                  </p>
                  {d.contexte && d.contexte !== "non précisé" && (
                    <p className="text-sm text-slate-500 mt-2 pl-6 leading-relaxed">
                      {d.contexte}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* —— Points de vigilance —— */}
      <section className="rounded-xl border border-orange-200/90 bg-orange-50/85 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-orange-200/70 bg-orange-100/60">
          <div className="w-9 h-9 rounded-lg bg-orange-200/90 flex items-center justify-center text-lg">
            <span aria-hidden>⚠️</span>
          </div>
          <h3 className="font-semibold text-slate-900">Points de vigilance</h3>
        </div>
        <div className="p-4 space-y-3">
          {analysis.points_a_clarifier.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-2">
              Aucun point de vigilance identifié.
            </p>
          ) : (
            analysis.points_a_clarifier.map((line, index) => {
              const { point, responsable } = parseVigilanceLine(line);
              return (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg bg-white/75 border border-orange-200/60"
                >
                  <span className="text-lg shrink-0" aria-hidden>
                    ⚠️
                  </span>
                  <div className="min-w-0">
                    <p className="text-slate-900 text-sm leading-relaxed">
                      {point}
                    </p>
                    {responsable && (
                      <p className="text-xs text-slate-600 mt-1.5">
                        <span className="font-medium">Responsable suivi :</span>{" "}
                        {responsable}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* —— Résumé —— */}
      <section className="rounded-xl border border-slate-200 bg-slate-100/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 bg-slate-200/40">
          <div className="w-9 h-9 rounded-lg bg-slate-300/70 flex items-center justify-center">
            <FileText className="h-4 w-4 text-slate-800" />
          </div>
          <h3 className="font-semibold text-slate-900">Résumé exécutif</h3>
        </div>
        <div className="p-4">
          {summaryText ? (
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {summaryText}
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Aucun résumé exécutif fourni pour cette analyse.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
