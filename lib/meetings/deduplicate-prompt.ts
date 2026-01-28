/**
 * Prompt pour nettoyer et dédupliquer les résultats d'extraction
 */

export const DEDUPLICATE_PROMPT = `Tu reçois un JSON d'extraction (décisions, actions, points à clarifier).

Objectif :
- supprimer doublons
- fusionner uniquement si clairement identique
- simplifier la formulation sans changer le sens
- ne rien inventer

Règles :
- ne crée pas de nouveaux éléments
- si doute : ne fusionne pas
- renvoie uniquement du JSON valide, même format que l'entrée

JSON à nettoyer :
{{EXTRACTED_JSON}}`;

/**
 * Remplace le placeholder {{EXTRACTED_JSON}} par le JSON réel
 */
export function buildDeduplicatePrompt(extractedJson: string): string {
  return DEDUPLICATE_PROMPT.replace("{{EXTRACTED_JSON}}", extractedJson);
}

