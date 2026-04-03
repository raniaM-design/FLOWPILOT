/**
 * Qualité d’une analyse de réunion (dérivée des actions extraites : responsables / échéances).
 * Partagé serveur + client.
 */

export type AnalysisQuality = "bonne" | "moyenne" | "faible";

export function isUnassignedResponsable(value: string): boolean {
  const v = value.trim().toLowerCase();
  return !v || v === "à assigner" || v.startsWith("non précis");
}

export function isUnspecifiedDeadline(value: string): boolean {
  const v = value.trim().toLowerCase();
  return !v || v === "non précisée" || v.startsWith("non précis");
}

export function computeAnalysisQuality(
  analysis: Pick<{ actions: Array<{ responsable: string; echeance: string }> }, "actions">,
): AnalysisQuality {
  const { actions } = analysis;
  if (actions.length === 0) return "bonne";

  let issues = 0;
  for (const a of actions) {
    if (isUnassignedResponsable(a.responsable)) issues++;
    if (isUnspecifiedDeadline(a.echeance)) issues++;
  }
  const slots = actions.length * 2;
  const ratio = issues / slots;
  if (ratio === 0) return "bonne";
  if (ratio <= 0.5) return "moyenne";
  return "faible";
}
