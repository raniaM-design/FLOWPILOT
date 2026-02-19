/**
 * Extraction heuristique des décisions et actions depuis un texte non structuré
 * Utilisé en fallback quand extractSections ne trouve aucune section explicite
 */

import { filterValidItems, isMetadataLabel, isMetadataValue } from "./filter-items";
import { extractResponsible, extractDueDate, extractContext, extractImpact } from "./extract-metadata";

const BULLET_PATTERN = /^[\s\u00A0]*[-•*◦▪▫→➜➤✓☐☑▸▹▻►▶▪▫\u2022\u2023\u2043\u204C\u204D\u2219\u25E6\u25AA\u25AB\u25CF\u25CB\u25A1\u25A0]+[\s\u00A0]*/u;
const NUMBER_PATTERN = /^[\s\u00A0]*\d+[\.\)]\s*/u;

// Patterns pour identifier une DÉCISION (acté, validé, convenu...)
const DECISION_PATTERNS = [
  /\b(?:décidé|décidée|décidés|décidées|décision|décisions)\b/i,
  /\b(?:convenu|convenue|convenus|convenues|convenu\s+de|il\s+a\s+été\s+convenu)\b/i,
  /\b(?:validé|validée|validation|approuvé|approbation)\b/i,
  /\b(?:acté|actée|actés|actées)\b/i,
  /\b(?:on\s+garde(?:nt)?)\b/i,
  /\b(?:on\s+conser(?:ve|vent)?)\b/i,
  /\b(?:on\s+ne\s+(?:montre|présente|fait)\s+pas)\b/i,
  /\b(?:tout\s+le\s+monde\s+acquiesce)\b/i,
  /\b(?:on\s+considère\s+que)\b/i,
  /\b(?:on\s+note\s+que)\b/i,
  /\b(?:il\s+a\s+été\s+décidé)\b/i,
  /\b(?:la\s+priorité\s+est\s+donnée\s+à)\b/i,
  /\b(?:choix\s+(?:fait|effectué|réalisé))\b/i,
  /\b(?:sera\s+conservé|seront\s+conservés)\b/i,
  /\b(?:ne\s+sera\s+pas\s+(?:présenté|montré))\b/i,
];

// Patterns pour identifier une ACTION (va faire, doit, préparer, envoyer...)
const ACTION_PATTERNS = [
  /\b(?:va|vont|fera|feront)\s+(?:faire|préparer|envoyer|créer|réviser|organiser)/i,
  /\b(?:doit|doivent|devrait|devraient)\s+/i,
  /\b(?:s'occupe|s'occupent|interviendra|interviendront)\s+(?:de|sur)\b/i,
  /\b(?:à\s+faire|action\s*:)\b/i,
  /\b(?:il\s+faudrait|quelqu'un\s+doit)\b/i,
  // Verbes d'action en début de ligne
  /^(?:préparer|envoyer|contacter|réviser|créer|mettre|organiser|planifier|développer|implémenter|finaliser|compléter|valider|vérifier|analyser|présenter|partager|distribuer|soumettre|transmettre|communiquer|informer|consulter|examiner|étudier|évaluer|tester|déployer|lancer|démarrer|initier|terminer|améliorer|optimiser|stabiliser|investiguer|rédiger|surveiller)\b/i,
  // Format informel : "Nom jour sur sujet"
  /^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüÿç]+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüÿç]+)?\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|\d{1,2})\s+(?:sur|pour|avec)/i,
  // "Nom : action" ou "Nom – action"
  /^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüÿç]+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüÿç]+)?\s*[:\-–]\s+.+/i,
];

// Patterns pour identifier un POINT À CLARIFIER ou À VENIR
const CLARIFY_PATTERNS = [
  /\b(?:à\s+définir|à\s+clarifier|à\s+confirmer|en\s+attente)\b/i,
  /\b(?:question\s*:|\?\s*$)\b/i,
  /\b(?:ou\s+.+\s*\?)\b/i,
  /\b(?:pas\s+sûr|on\s+ne\s+sait\s+pas)\b/i,
  /\b(?:à\s+venir|prochaine\s+étape|prochaines?\s+étapes?)\b/i,
  /\b(?:sujet\s+reporté|pour\s+la\s+suite)\b/i,
];

function cleanLine(line: string): string {
  let cleaned = line
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(BULLET_PATTERN, "").replace(NUMBER_PATTERN, "").trim();
  return cleaned;
}

function looksLikeDecision(text: string): boolean {
  const cleaned = cleanLine(text);
  if (cleaned.length < 8) return false;
  return DECISION_PATTERNS.some((p) => p.test(cleaned));
}

function looksLikeAction(text: string): boolean {
  const cleaned = cleanLine(text);
  if (cleaned.length < 5) return false;
  // Si déjà identifié comme décision, pas une action
  if (looksLikeDecision(cleaned)) return false;
  return ACTION_PATTERNS.some((p) => p.test(cleaned));
}

function looksLikeClarifyOrNext(text: string): boolean {
  const cleaned = cleanLine(text);
  if (cleaned.length < 6) return false;
  return CLARIFY_PATTERNS.some((p) => p.test(cleaned));
}

/**
 * Extrait les éléments de liste (puces, numérotation) du texte brut
 */
function extractListItems(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const cleaned = cleanLine(line);
    if (!cleaned || cleaned.length < 5) continue;
    if (isMetadataLabel(cleaned) || isMetadataValue(cleaned)) continue;
    // Exclure les titres de section
    if (/^(?:points?|decisions?|décisions?|actions?|à\s+venir|prochaines?\s+étapes?)\s*:?\s*$/i.test(cleaned)) continue;
    items.push(cleaned);
  }
  return items;
}

/**
 * Extrait les décisions et actions depuis un texte non structuré (sans sections explicites)
 */
export function extractFromUnstructuredText(text: string): {
  decisions: Array<{ decision: string; contexte: string; impact_potentiel: string }>;
  actions: Array<{ action: string; responsable: string; echeance: string }>;
  points_a_clarifier: string[];
  points_a_venir: string[];
} {
  if (!text || typeof text !== "string") {
    return { decisions: [], actions: [], points_a_clarifier: [], points_a_venir: [] };
  }

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

  const lines = normalized.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // Détecter les lignes qui sont des éléments de liste (commence par puce, numéro, ou verbe)
  const listItems = extractListItems(lines);

  // Si peu de lignes, considérer tout le texte comme une liste de phrases (split par . ou -)
  let candidates: string[] = listItems;
  if (listItems.length < 3 && normalized.length > 50) {
    // Split par points ou tirets pour extraire des phrases
    const sentences = normalized
      .split(/[.\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10);
    candidates = [...listItems, ...sentences];
  }

  const decisions: Array<{ decision: string; contexte: string; impact_potentiel: string }> = [];
  const actions: Array<{ action: string; responsable: string; echeance: string }> = [];
  const points_a_clarifier: string[] = [];
  const points_a_venir: string[] = [];

  const normalizeForDedup = (s: string) => s.toLowerCase().trim();
  const seenDecisions = new Set<string>();
  const seenActions = new Set<string>();
  const seenClarify = new Set<string>();

  for (const item of candidates) {
    const cleaned = cleanLine(item);
    if (cleaned.length < 6) continue;
    if (filterValidItems([cleaned]).length === 0) continue;

    const norm = normalizeForDedup(cleaned);

    if (looksLikeDecision(cleaned) && !seenDecisions.has(norm)) {
      seenDecisions.add(norm);
      const contexte = extractContext(cleaned) !== "non précisé" ? extractContext(cleaned) : "non précisé";
      const impact = extractImpact(cleaned) !== "non précisé" ? extractImpact(cleaned) : "non précisé";
      decisions.push({ decision: cleaned, contexte, impact_potentiel: impact });
    } else if (looksLikeAction(cleaned) && !seenActions.has(norm)) {
      seenActions.add(norm);
      const responsable = extractResponsible(cleaned);
      const echeance = extractDueDate(cleaned);
      actions.push({
        action: cleaned,
        responsable: responsable !== "non précisé" ? responsable : "non précisé",
        echeance: echeance !== "non précisé" ? echeance : "non précisé",
      });
    } else if (looksLikeClarifyOrNext(cleaned) && !seenClarify.has(norm)) {
      seenClarify.add(norm);
      if (/\b(?:à\s+venir|prochaine|sujet\s+reporté|pour\s+la\s+suite)\b/i.test(cleaned)) {
        points_a_venir.push(cleaned);
      } else {
        points_a_clarifier.push(cleaned);
      }
    } else if (!seenDecisions.has(norm) && !seenActions.has(norm) && !seenClarify.has(norm)) {
      // Défaut : classifier selon le sens
      // Verbe à l'infinitif en début = action probable
      const startsWithActionVerb = /^(?:préparer|envoyer|contacter|réviser|créer|faire|mettre|organiser|stabiliser|investiguer|améliorer|proposer|rédiger|surveiller|analyser)\b/i.test(cleaned);
      if (startsWithActionVerb) {
        seenActions.add(norm);
        actions.push({
          action: cleaned,
          responsable: extractResponsible(cleaned) !== "non précisé" ? extractResponsible(cleaned) : "non précisé",
          echeance: extractDueDate(cleaned) !== "non précisé" ? extractDueDate(cleaned) : "non précisé",
        });
      }
      // Sinon on n'ajoute pas pour éviter le bruit (mieux vaut manquer que du faux positif)
    }
  }

  return {
    decisions: decisions.slice(0, 20),
    actions: actions.slice(0, 30),
    points_a_clarifier: points_a_clarifier.slice(0, 15),
    points_a_venir: points_a_venir.slice(0, 15),
  };
}
