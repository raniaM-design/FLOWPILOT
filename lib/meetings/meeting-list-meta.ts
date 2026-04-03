import { computeAnalysisQuality, type AnalysisQuality } from "@/lib/meetings/analysis-quality";

export type MeetingAnalysisListStatus = "pending" | "partial" | "analyzed";

export type MeetingListAnalysisFields = {
  analysisStatus: MeetingAnalysisListStatus;
  extractedActionsCount: number;
  extractedDecisionsCount: number;
  /** Affichage « X actions · Y décisions » */
  displayActionsCount: number;
  displayDecisionsCount: number;
  analysisQuality: AnalysisQuality | null;
};

type ParsedShape = {
  decisions: unknown[];
  actions: unknown[];
};

function parseAnalysisJson(json: string | null): ParsedShape | null {
  if (!json || !json.trim()) return null;
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    const decisions = Array.isArray(o.decisions) ? o.decisions : [];
    const actions = Array.isArray(o.actions) ? o.actions : [];
    return { decisions, actions };
  } catch {
    return null;
  }
}

/**
 * Métadonnées liste réunions : statut d’analyse, compteurs extraits, qualité (même logique que l’UI d’analyse).
 */
export function buildMeetingListAnalysisMeta(
  analysisJson: string | null,
  analyzedAt: Date | null,
  linkedActionsCount: number,
  linkedDecisionsCount: number,
): MeetingListAnalysisFields {
  const parsed = parseAnalysisJson(analysisJson);
  const hasRun = !!analyzedAt && !!parsed;

  const extractedActionsCount = parsed?.actions.length ?? 0;
  const extractedDecisionsCount = parsed?.decisions.length ?? 0;

  let analysisStatus: MeetingAnalysisListStatus;
  let analysisQuality: AnalysisQuality | null = null;

  if (!hasRun) {
    analysisStatus = "pending";
  } else if (extractedActionsCount < 2) {
    analysisStatus = "partial";
    analysisQuality = computeAnalysisQuality({
      actions: (parsed!.actions as ParsedShape["actions"]) as Array<{
        responsable: string;
        echeance: string;
      }>,
    });
  } else {
    analysisStatus = "analyzed";
    analysisQuality = computeAnalysisQuality({
      actions: (parsed!.actions as ParsedShape["actions"]) as Array<{
        responsable: string;
        echeance: string;
      }>,
    });
  }

  const displayActionsCount = hasRun ? extractedActionsCount : linkedActionsCount;
  const displayDecisionsCount = hasRun ? extractedDecisionsCount : linkedDecisionsCount;

  return {
    analysisStatus,
    extractedActionsCount,
    extractedDecisionsCount,
    displayActionsCount,
    displayDecisionsCount,
    analysisQuality,
  };
}
