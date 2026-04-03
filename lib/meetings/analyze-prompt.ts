/**
 * Prompt système pour l'extraction structurée (après normalisation du texte).
 */

import { TRANSCRIPTION_CONTEXT_SYSTEM_ADDENDUM } from "./normalize-prompt";

export const MEETING_ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en analyse de réunions. Ton rôle est d'extraire des informations structurées depuis un compte rendu, même si ce texte est mal rédigé, incomplet ou informel.

RÈGLES STRICTES :
- Si une personne est citée avec un verbe d'action (va faire, doit, prend en charge, s'occupe de, prévu pour), c'est une ACTION
- Si une phrase contient 'on décide', 'validé', 'acté', 'retenu', 'approuvé' ou une conclusion claire, c'est une DÉCISION  
- Si une phrase contient 'attention', 'risque', 'à surveiller', 'problème', 'point bloquant', 'vérifier', c'est un POINT DE VIGILANCE
- Si aucun responsable n'est clairement nommé pour une action, mets responsable: 'À assigner'
- Si aucune date n'est mentionnée, mets deadline: 'Non précisée'

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "actions": [{ "quoi": "", "qui": "", "deadline": "", "priorite": "normale" }],
  "decisions": [{ "decision": "", "contexte": "" }],
  "points_vigilance": [{ "point": "", "responsable": "" }],
  "participants": [],
  "resume_executif": ""
}

Utilise pour "priorite" une seule valeur parmi : "haute", "normale", "basse". Les chaînes du tableau "participants" sont des noms ou prénoms. "resume_executif" est une synthèse courte ou une chaîne vide.`;

export function buildMeetingAnalysisSystemPrompt(isTranscription: boolean): string {
  if (!isTranscription) return MEETING_ANALYSIS_SYSTEM_PROMPT;
  return `${MEETING_ANALYSIS_SYSTEM_PROMPT}\n\n${TRANSCRIPTION_CONTEXT_SYSTEM_ADDENDUM}`;
}

/** Même schéma JSON que l’analyse principale (pour parseMeetingAnalysisResponse). */
const JSON_STRUCTURE_BLOCK = `Réponds UNIQUEMENT en JSON valide avec exactement cette structure :
{
  "actions": [{ "quoi": "", "qui": "", "deadline": "", "priorite": "normale" }],
  "decisions": [{ "decision": "", "contexte": "" }],
  "points_vigilance": [{ "point": "", "responsable": "" }],
  "participants": [],
  "resume_executif": ""
}

Utilise pour "priorite" une seule valeur parmi : "haute", "normale", "basse".`;

export const MEETING_ANALYSIS_RECOVERY_SYSTEM_PROMPT = `Le texte suivant est un compte rendu de réunion. Même s'il est très court ou mal structuré, identifie AU MOINS :
- Ce qui a été décidé ou acté (même implicitement)
- Ce que les personnes présentes doivent faire ensuite
- Ce qui pourrait poser problème

Sois large dans ton interprétation. Réponds en JSON.

${JSON_STRUCTURE_BLOCK}`;

export function buildMeetingRecoverySystemPrompt(isTranscription: boolean): string {
  if (!isTranscription) return MEETING_ANALYSIS_RECOVERY_SYSTEM_PROMPT;
  return `${MEETING_ANALYSIS_RECOVERY_SYSTEM_PROMPT}\n\n${TRANSCRIPTION_CONTEXT_SYSTEM_ADDENDUM}`;
}

const STRICT_JSON_REMINDER =
  "Réponds uniquement en JSON, sans texte avant ou après.";

/** Message utilisateur : compte rendu à analyser (sans le rappel strict). */
export function buildAnalysisPrompt(meetingText: string): string {
  let text = meetingText.trim();
  const wasTruncated = text.length > MAX_MEETING_TEXT_LENGTH;
  if (wasTruncated) {
    text =
      text.slice(0, MAX_MEETING_TEXT_LENGTH) +
      "\n\n[... texte tronqué pour optimisation ...]";
  }
  return `Compte rendu à analyser :\n\n${text}`;
}

/** Même contenu + rappel pour second appel après échec de parsing. */
export function buildAnalysisPromptStrictRetry(meetingText: string): string {
  return `${buildAnalysisPrompt(meetingText)}\n\n${STRICT_JSON_REMINDER}`;
}

const MAX_MEETING_TEXT_LENGTH = 16000;
