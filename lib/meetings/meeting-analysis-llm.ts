/**
 * Parse la réponse LLM (nouveau schéma) et mappe vers le format applicatif.
 */

export type MeetingAnalysisLLMJson = {
  actions?: Array<{
    quoi?: string;
    qui?: string;
    deadline?: string;
    priorite?: string;
  }>;
  decisions?: Array<{
    decision?: string;
    contexte?: string;
  }>;
  points_vigilance?: Array<{
    point?: string;
    responsable?: string;
  }>;
  participants?: unknown[];
  resume_executif?: string;
};

export type MeetingAnalysisAppResult = {
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
};

export function extractJsonObjectFromLLMText(text: string): string | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) return fence[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return null;
}

export function tryParseMeetingLLMJson(content: string): MeetingAnalysisLLMJson | null {
  try {
    const slice = extractJsonObjectFromLLMText(content);
    if (!slice) return null;
    const raw = JSON.parse(slice) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    return raw as MeetingAnalysisLLMJson;
  } catch {
    return null;
  }
}

export function mapMeetingLLMJsonToAppResult(
  raw: MeetingAnalysisLLMJson
): MeetingAnalysisAppResult {
  const points_a_venir: string[] = [];

  if (Array.isArray(raw.participants) && raw.participants.length > 0) {
    const parts = raw.participants
      .map((p) =>
        typeof p === "string" ? p.trim() : String(p ?? "").trim()
      )
      .filter(Boolean);
    if (parts.length) {
      points_a_venir.push(`Participants : ${parts.join(", ")}`);
    }
  }

  if (typeof raw.resume_executif === "string" && raw.resume_executif.trim()) {
    points_a_venir.push(raw.resume_executif.trim());
  }

  const decisions = (Array.isArray(raw.decisions) ? raw.decisions : []).map(
    (d) => ({
      decision: String(d?.decision ?? "").trim() || "Non précisée",
      contexte: String(d?.contexte ?? "").trim() || "non précisé",
      impact_potentiel: "non précisé",
    })
  );

  const actions = (Array.isArray(raw.actions) ? raw.actions : []).map((a) => {
    let actionText = String(a?.quoi ?? "").trim();
    const p = String(a?.priorite ?? "normale").toLowerCase();
    if (p === "haute" || p === "basse") {
      actionText = `[Priorité ${p}] ${actionText}`.trim();
    }
    return {
      action: actionText || "—",
      responsable: String(a?.qui ?? "").trim() || "À assigner",
      echeance: String(a?.deadline ?? "").trim() || "Non précisée",
    };
  });

  const points_a_clarifier = (
    Array.isArray(raw.points_vigilance) ? raw.points_vigilance : []
  )
    .map((pv) => {
      const point = String(pv?.point ?? "").trim();
      const resp = String(pv?.responsable ?? "").trim();
      if (!point) return "";
      return resp ? `${point} (Responsable suivi : ${resp})` : point;
    })
    .filter(Boolean);

  return {
    decisions,
    actions,
    points_a_clarifier,
    points_a_venir: points_a_venir.length ? points_a_venir : undefined,
  };
}

export function parseMeetingAnalysisResponse(
  content: string
): MeetingAnalysisAppResult | null {
  const raw = tryParseMeetingLLMJson(content);
  if (!raw) return null;
  return mapMeetingLLMJsonToAppResult(raw);
}
