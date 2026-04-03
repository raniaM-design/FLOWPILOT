/**
 * Prompt système pour la passe de normalisation (avant l'extraction JSON).
 */
export const MEETING_NORMALIZE_SYSTEM_PROMPT =
  "Tu es un assistant de reformatage. Transforme ce texte brut en compte rendu structuré avec les sections : Participants, Contexte, Échanges principaux, Décisions, Actions. Ne supprime aucune information, reformule seulement pour clarifier. Si une section est absente du texte, écris 'Non mentionné'.";

/** Ajout au prompt de normalisation lorsque la source ressemble à une transcription auto. */
export const TRANSCRIPTION_CONTEXT_SYSTEM_ADDENDUM =
  "Ce texte est une transcription automatique. Il peut contenir des erreurs de transcription, des hésitations (euh, donc, voilà), des phrases coupées et du langage oral. Ignore les hésitations, corrige les erreurs phonétiques évidentes et concentre-toi sur le sens des échanges pour extraire les actions, décisions et points de vigilance.";

export function meetingNormalizeSystemPrompt(isTranscription: boolean): string {
  if (!isTranscription) return MEETING_NORMALIZE_SYSTEM_PROMPT;
  return `${MEETING_NORMALIZE_SYSTEM_PROMPT}\n\n${TRANSCRIPTION_CONTEXT_SYSTEM_ADDENDUM}`;
}
