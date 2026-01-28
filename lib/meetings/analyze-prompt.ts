/**
 * Prompt pour l'extraction de décisions/actions depuis un compte rendu de réunion
 */

export const MEETING_ANALYSIS_PROMPT = `Tu es un assistant de pilotage opérationnel.

Tâche :
À partir du compte rendu de réunion fourni, extrais UNIQUEMENT :
- les décisions réellement prises
- les actions concrètes à réaliser
- les points à clarifier (questions ouvertes, sujets non tranchés)

Règles strictes :
- N'invente rien. N'ajoute aucune information.
- Si responsable/échéance/contexte/impact ne sont pas explicitement indiqués, mets "non précisé".
- Ne renvoie que du JSON valide. Aucune phrase autour.
- Reste concis : phrases courtes, sans blabla.
- Ne duplique pas : si un élément est répété, garde une seule version.
- Une "décision" = quelque chose acté. Une "action" = quelque chose à faire.

Format JSON STRICT à respecter :

{
  "decisions": [
    {
      "decision": "string",
      "contexte": "string",
      "impact_potentiel": "string"
    }
  ],
  "actions": [
    {
      "action": "string",
      "responsable": "string",
      "echeance": "string"
    }
  ],
  "points_a_clarifier": ["string"]
}

Compte rendu :
"""
{{MEETING_TEXT}}
"""`;

/**
 * Remplace le placeholder {{MEETING_TEXT}} par le texte réel
 */
export function buildAnalysisPrompt(meetingText: string): string {
  return MEETING_ANALYSIS_PROMPT.replace("{{MEETING_TEXT}}", meetingText);
}

