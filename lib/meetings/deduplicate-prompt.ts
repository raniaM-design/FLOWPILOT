/**
 * Prompt pour nettoyer et dédupliquer les résultats d'extraction
 */

export const DEDUPLICATE_PROMPT = `Tu es un expert en nettoyage et optimisation de données structurées.

TÂCHE :
Nettoyer et dédupliquer un JSON d'extraction de décisions et actions depuis un compte rendu de réunion.

OBJECTIFS :
1. SUPPRIMER les doublons exacts ou quasi-identiques
2. FUSIONNER uniquement les éléments qui sont clairement la même chose exprimée différemment
3. AMÉLIORER la formulation pour plus de clarté et d'actionnabilité
4. CONSERVER toutes les informations importantes (responsables, échéances, contextes, impacts)
5. NE RIEN INVENTER : ne pas créer de nouveaux éléments, ne pas ajouter d'informations absentes

RÈGLES STRICTES :

1. DÉDUPLICATION :
   - Deux éléments sont des doublons s'ils expriment la même décision/action avec des mots différents
   - Exemple de doublons à fusionner :
     * "Préparer le document" et "Document à préparer"
     * "Lancer le projet X" et "Nous lançons le projet X"
   - Si doute : NE PAS fusionner, garder les deux

2. AMÉLIORATION DE FORMULATION :
   - Actions : utiliser l'infinitif, être concret et actionnable
   - Décisions : être factuel et clair
   - Éviter les formulations vagues ou ambiguës

3. CONSERVATION D'INFORMATIONS :
   - Si un élément a un responsable/échéance/contexte/impact et l'autre non, fusionner en conservant toutes les infos
   - Si deux éléments ont des infos complémentaires, les fusionner intelligemment

4. STRUCTURE :
   - Respecter exactement le format JSON d'entrée
   - Tous les champs sont obligatoires
   - Ne renvoie QUE du JSON valide, sans texte autour

Format JSON à respecter :
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

JSON à nettoyer :
{{EXTRACTED_JSON}}`;

/**
 * Remplace le placeholder {{EXTRACTED_JSON}} par le JSON réel
 */
export function buildDeduplicatePrompt(extractedJson: string): string {
  return DEDUPLICATE_PROMPT.replace("{{EXTRACTED_JSON}}", extractedJson);
}

