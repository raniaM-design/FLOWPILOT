/**
 * Heuristiques pour détecter un texte typique de transcription automatique (audio → texte).
 */

const MIN_LENGTH = 120;

/** Mot répété 3 fois ou plus d'affilée (stutter / erreur ASR) */
const CONSECUTIVE_WORD_REPEAT = /(\b[\p{L}]{3,}\b)(\s+\1\b){2,}/iu;

/** Horodatage entre crochets [mm:ss] ou [hh:mm:ss] */
const BRACKET_TIMESTAMP = /\[\s*\d{1,3}:\d{2}(?::\d{2})?\s*\]/;

/** Libellé type outil de diarisation */
const SPEAKER_LABEL = /\b(?:Speaker|Interlocuteur|Locuteur)\s*\d+\s*:/i;

/** Début de ligne : timestamp puis tiret */
const LINE_START_TIMESTAMP =
  /^\s*\d{1,3}:\d{2}(?::\d{2})?\s*[–—\-]\s*\S/m;

/** Timestamp entre parenthèses façon (12:34) */
const PAREN_TIMESTAMP = /\(\s*\d{1,2}:\d{2}\s*\)/;

const ORAL_FILLERS = /\b(euh|hum|hmm|hé|ben|hein)\b/gi;

/**
 * Retourne true si le texte présente assez d'indices de transcription auto.
 */
export function isLikelyAutomaticTranscription(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_LENGTH) {
    return false;
  }

  let score = 0;

  if (BRACKET_TIMESTAMP.test(t)) score += 3;
  if (SPEAKER_LABEL.test(t)) score += 3;
  if (LINE_START_TIMESTAMP.test(t)) score += 2;
  if (PAREN_TIMESTAMP.test(t)) score += 1;

  if (CONSECUTIVE_WORD_REPEAT.test(t)) score += 2;

  const fillers = t.match(ORAL_FILLERS);
  if (fillers && fillers.length >= 5) score += 2;
  else if (fillers && fillers.length >= 2) score += 1;

  const lines = t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let abruptLines = 0;
  for (const line of lines.slice(0, 80)) {
    if (
      line.length < 200 &&
      (/-\s*$/.test(line) || /…\s*$/.test(line) || /\.\.\.\s*$/.test(line))
    ) {
      abruptLines++;
    }
  }
  if (abruptLines >= 4) score += 1;

  return score >= 4;
}
