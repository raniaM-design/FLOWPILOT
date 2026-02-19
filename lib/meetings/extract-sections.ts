/**
 * Extrait les sections d'un compte rendu de réunion
 * Détecte les sections : Points, Décisions, Actions, À venir
 * 
 * @param text - Texte nettoyé du compte rendu (après sanitizeMeetingText)
 * @returns Objet avec les sections extraites
 */
import { splitLongSentences } from "./split-sentences";
import { normalizeActionText } from "./normalize-action";
import { filterValidItems } from "./filter-items";

export function extractSections(text: string): {
  points: string[];
  decisions: string[];
  actions: string[];
  next: string[];
} {
  if (!text || typeof text !== "string") {
    return { points: [], decisions: [], actions: [], next: [] };
  }

  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);

  // Patterns de détection des sections (case-insensitive, avec ou sans accents)
  // Points : "Points abordés", "Points", "Points discutés", etc.
  // Accepte aussi les numéros devant : "2. Points abordés"
  const pointsHeaderRegex = /^(?:\d+[\.\)]\s*)?(?:points?)(?:\s+(?:abordés?|discutés?|traités?|évoqués?))?\s*:?\s*$/im;
  
  // Décisions : "Décisions", "Décision", "Décisions prises", "Conclusions", "Décisions du jour", etc.
  const decisionsHeaderRegex = /^(?:\d+[\.\)]\s*)?(?:decisions?|décisions?|conclusions?)(?:\s+(?:prises?|du\s+jour))?\s*:?\s*$/im;

  // Actions : "Actions", "Action items", "Tâches", "Todo", "À faire", "Actions à mener", etc.
  const actionsHeaderRegex = /^(?:\d+[\.\)]\s*)?(?:actions?|action\s+items?|tâches?|taches?|todo|à\s+faire|à\s+réaliser|(?:actions?|tâches?)\s+(?:à|a)\s*(?:réaliser|faire|suivre|effectuer|traiter|engager|mener))?\s*:?\s*$/im;

  // À venir : "À venir", "Sujets à venir", "Prochaines étapes", "Suite", "Next steps", etc.
  const nextHeaderRegex = /^(?:\d+[\.\)]\s*)?(?:(?:à|a)\s+venir|sujets?\s+(?:à|a)\s+venir|points?\s+(?:à|a)\s+venir|sujets?\s+(?:à|a)\s+traiter|points?\s+(?:à|a)\s+discuter|prochaines?\s+étapes?|prochaine\s+réunion|suite|pour\s+la\s+suite|next\s+steps?)\s*:?\s*$/im;

  // Fonction pour nettoyer une ligne avant de tester les regex
  const cleanLineForDetection = (line: string): string => {
    let cleaned = line.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
    cleaned = cleaned.replace(/[ \t]+/g, " ");
    // Retirer les symboles/puces en début de ligne pour la détection
    cleaned = cleaned.replace(/^[\s\u00A0]*[-•*◦▪▫→➜➤✓☐☑✓▸▹▻►▶▪▫\u2022\u2023\u2043\u204C\u204D\u2219\u25E6\u25AA\u25AB\u25CF\u25CB\u25A1\u25A0]+[\s\u00A0]*/u, "");
    return cleaned.trim();
  };

  // Trouver les positions des sections
  let pointsStart = -1;
  let decisionsStart = -1;
  let actionsStart = -1;
  let nextStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const cleanedLine = cleanLineForDetection(lines[i]);
    
    if (pointsStart === -1 && pointsHeaderRegex.test(cleanedLine)) {
      pointsStart = i + 1;
    }
    if (decisionsStart === -1 && decisionsHeaderRegex.test(cleanedLine)) {
      decisionsStart = i + 1;
    }
    if (actionsStart === -1 && actionsHeaderRegex.test(cleanedLine)) {
      actionsStart = i + 1;
    }
    if (nextStart === -1 && nextHeaderRegex.test(cleanedLine)) {
      nextStart = i + 1;
    }
  }

  // Extraire les blocs de texte entre sections
  const extractBlock = (start: number, end: number): string[] => {
    if (start === -1) return [];
    const endLine = end === -1 ? lines.length : end;
    return lines.slice(start, endLine);
  };

  // Trier toutes les sections par position pour déterminer les fins
  const allStarts = [
    { type: 'points', pos: pointsStart },
    { type: 'decisions', pos: decisionsStart },
    { type: 'actions', pos: actionsStart },
    { type: 'next', pos: nextStart },
  ].filter(s => s.pos !== -1).sort((a, b) => a.pos - b.pos);

  // Trouver la position de fin pour chaque section
  const getEndPos = (startPos: number): number => {
    const nextStart = allStarts.find(s => s.pos > startPos);
    return nextStart ? nextStart.pos - 1 : -1;
  };

  const pointsBlock = extractBlock(pointsStart, getEndPos(pointsStart));
  const decisionsBlock = extractBlock(decisionsStart, getEndPos(decisionsStart));
  const actionsBlock = extractBlock(actionsStart, getEndPos(actionsStart));
  const nextBlock = extractBlock(nextStart, getEndPos(nextStart));

  // Fonction pour extraire les items d'un bloc (nettoyer les puces, numérotation, etc.)
  const extractItems = (block: string[]): string[] => {
    const items: string[] = [];
    
    // Patterns pour détecter les titres de sections (à ignorer dans les items)
    // Accepte aussi les numéros devant les titres
    const sectionTitlePatterns = [
      /^(?:\d+[\.\)]\s*)?points?(?:\s+(?:abordés?|discutés?|traités?|évoqués?))?\s*:?\s*$/i,
      /^(?:\d+[\.\)]\s*)?(?:decisions?|décisions?|conclusions?)(?:\s+(?:prises?|du\s+jour))?\s*:?\s*$/i,
      /^(?:\d+[\.\)]\s*)?(?:actions?|action\s+items?|tâches?|taches?|todo|à\s+faire)\s*:?\s*$/i,
      /^(?:\d+[\.\)]\s*)?(?:actions?|tâches?)(?:\s+(?:à|a)\s*(?:réaliser|faire|suivre|effectuer|traiter|engager|mener))?\s*:?\s*$/i,
      /^(?:\d+[\.\)]\s*)?(?:à|a)\s+venir\s*:?\s*$/i,
      /^(?:\d+[\.\)]\s*)?sujets?\s+(?:à|a)\s+venir\s*:?\s*$/i,
      /^(?:\d+[\.\)]\s*)?points?\s+(?:à|a)\s+venir\s*:?\s*$/i,
      /^(?:\d+[\.\)]\s*)?(?:prochaines?\s+étapes?|prochaine\s+réunion|suite|pour\s+la\s+suite|next\s+steps?)\s*:?\s*$/i,
    ];
    
    const isSectionTitle = (line: string): boolean => {
      const trimmed = line.trim();
      if (trimmed.endsWith(":")) {
        return true;
      }
      return sectionTitlePatterns.some(pattern => pattern.test(trimmed));
    };
    
    // Fonction pour nettoyer une ligne de texte
    const cleanLine = (line: string): string => {
      let cleaned = line.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");
      cleaned = cleaned.replace(/\t/g, " ");
      cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
      cleaned = cleaned.replace(/[ \t]+/g, " ");
      // Retirer les préfixes de liste variés (puces Unicode incluses)
      cleaned = cleaned.replace(/^[\s\u00A0]*[-•*◦▪▫→➜➤✓☐☑✓▸▹▻►▶▪▫\u2022\u2023\u2043\u204C\u204D\u2219\u25E6\u25AA\u25AB\u25CF\u25CB\u25A1\u25A0\u25B6\u25C0\u25B8\u25C2\u25BA\u25BC\u25C4\u2192\u219D\u21A3\u21AA\u27A4\u27A5\u279C\u279D\u279E\u279F\u27B0\u27B1\u27B2\u27B3]+[\s\u00A0]*/u, "");
      // Retirer la numérotation
      cleaned = cleaned.replace(/^[\s\u00A0]*\d+[\.\)]\s*/u, "");
      cleaned = cleaned.replace(/^[\s\u00A0]*[a-z]\)\s*/iu, "");
      cleaned = cleaned.replace(/^[\s\u00A0]*[ivxlcdm]+\)\s*/iu, "");
      cleaned = cleaned.trim();
      return cleaned;
    };
    
    for (const line of block) {
      const cleaned = cleanLine(line);
      
      if (!cleaned || cleaned.length < 3) continue;
      
      // Ignorer les titres de sections
      if (isSectionTitle(cleaned)) {
        continue;
      }
      
      // Ignorer les lignes qui ne contiennent que des symboles/punctuation
      if (/^[\s\p{P}\p{S}]*$/u.test(cleaned)) {
        continue;
      }
      
      // Filtrer les labels et métadonnées non pertinents
      if (cleaned.length >= 3) {
        items.push(cleaned);
      }
    }
    return items;
  };

  let points = extractItems(pointsBlock);
  let decisions = extractItems(decisionsBlock);
  let actions = extractItems(actionsBlock);
  let next = extractItems(nextBlock);

  // Si aucune section n'est trouvée, mettre tout dans "points" par défaut
  const hasAnySection = pointsStart !== -1 || decisionsStart !== -1 || actionsStart !== -1 || nextStart !== -1;
  
  if (!hasAnySection && lines.length > 0) {
    // Logger un warning (utiliser console.warn pour éviter de casser le code existant)
    console.warn("[extractSections] Aucune section détectée, tout le contenu est placé dans 'points' par défaut");
    // Extraire tous les items du texte complet
    const allItems = extractItems(lines);
    // Appliquer splitLongSentences pour découper les phrases longues
    points = splitLongSentences(allItems);
    return {
      points,
      decisions: [],
      actions: [],
      next: [],
    };
  }

  // Appliquer splitLongSentences à chaque section pour découper les phrases longues
  points = splitLongSentences(points);
  decisions = splitLongSentences(decisions);
  actions = splitLongSentences(actions);
  next = splitLongSentences(next);

  // Filtrer les items valides (exclure labels et métadonnées)
  points = filterValidItems(points);
  decisions = filterValidItems(decisions);
  actions = filterValidItems(actions);
  next = filterValidItems(next);

  // Normaliser les actions en format opérationnel (verbe à l'infinitif)
  actions = actions.map(action => normalizeActionText(action)).filter(action => action.length > 0);

  return {
    points,
    decisions,
    actions,
    next,
  };
}

