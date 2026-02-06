/**
 * Extrait les métadonnées (responsable, échéance) depuis une action ou décision
 */

/**
 * Extrait le responsable depuis un texte d'action
 */
export function extractResponsible(text: string): string {
  if (!text || typeof text !== "string") {
    return "non précisé";
  }

  const normalized = text.toLowerCase().trim();

  // Patterns pour détecter les responsables
  const patterns = [
    // "Jean va faire X" ou "Jean fera X"
    /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:va|vont|fera|feront|doit|doivent|est|sont)\s+/i,
    // "X par Jean" ou "X par l'équipe Y"
    /\bpar\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|\w+\s+équipe|\w+\s+team)/i,
    // "Responsable : Jean" ou "Assigné à : Jean"
    /(?:responsable|assigné|assignée|chargé|chargée|délégué|déléguée)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    // "Jean (responsable)" ou "Jean - responsable"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[\(-]\s*(?:responsable|assigné|chargé)/i,
    // "L'équipe X" ou "Le service Y"
    /(?:l'|le|la|les)\s+(équipe|service|département|groupe)\s+([A-Z][a-z]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const responsible = match[1] || match[2];
      if (responsible && responsible.length > 2) {
        // Capitaliser la première lettre
        return responsible
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      }
    }
  }

  return "non précisé";
}

/**
 * Extrait l'échéance depuis un texte d'action
 */
export function extractDueDate(text: string): string {
  if (!text || typeof text !== "string") {
    return "non précisé";
  }

  const normalized = text.toLowerCase().trim();

  // Patterns pour détecter les échéances
  const patterns = [
    // Dates explicites : "le 15 mars", "le 20/03", "le 20-03-2024"
    /\b(?:le|pour|avant|au|à)\s+(\d{1,2}[\/\-\.]\d{1,2}(?:\/\d{2,4})?)/i,
    // "vendredi prochain", "lundi", "mardi prochain"
    /\b(?:le|pour|avant|au|à)\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+prochain)?/i,
    // "cette semaine", "cette semaine", "la semaine prochaine"
    /\b(?:cette|la)\s+(semaine|semaine\s+prochaine)/i,
    // "dans X jours/semaines/mois"
    /\bdans\s+(\d+)\s+(jour|jours|semaine|semaines|mois)/i,
    // "avant la fin du mois", "avant fin mars"
    /\b(?:avant|pour)\s+(?:la\s+)?fin\s+(?:du\s+)?(mois|semaine|année|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
    // "avant le [événement]"
    /\b(?:avant|pour)\s+(?:le\s+)?(?:lancement|réunion|meeting|validation|approbation)/i,
    // "d'ici [date]"
    /\bd'ici\s+(\d{1,2}[\/\-\.]\d{1,2})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const dueDate = match[0] || match[1];
      if (dueDate && dueDate.length > 2) {
        // Capitaliser la première lettre
        return dueDate.charAt(0).toUpperCase() + dueDate.slice(1);
      }
    }
  }

  return "non précisé";
}

/**
 * Extrait le contexte depuis un texte de décision
 */
export function extractContext(text: string): string {
  if (!text || typeof text !== "string") {
    return "non précisé";
  }

  // Chercher des indicateurs de contexte
  const contextIndicators = [
    /(?:car|car|parce\s+que|car|puisque|étant\s+donné\s+que|du\s+fait\s+que)\s+(.+?)(?:\.|$)/i,
    /(?:pour|afin\s+de|dans\s+le\s+but\s+de)\s+(.+?)(?:\.|$)/i,
    /(?:contexte|situation|problème|besoin)\s*:?\s*(.+?)(?:\.|$)/i,
  ];

  for (const pattern of contextIndicators) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const context = match[1].trim();
      if (context.length > 10 && context.length < 200) {
        return context;
      }
    }
  }

  return "non précisé";
}

/**
 * Extrait l'impact potentiel depuis un texte de décision
 */
export function extractImpact(text: string): string {
  if (!text || typeof text !== "string") {
    return "non précisé";
  }

  // Chercher des indicateurs d'impact
  const impactIndicators = [
    /(?:impact|conséquence|effet|bénéfice|risque|avantage)\s*:?\s*(.+?)(?:\.|$)/i,
    /(?:permettra|permettra\s+de|va\s+permettre|va\s+permettre\s+de)\s+(.+?)(?:\.|$)/i,
    /(?:augmentation|réduction|amélioration|diminution)\s+(?:de|du|des)\s+(.+?)(?:\.|$)/i,
  ];

  for (const pattern of impactIndicators) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const impact = match[1].trim();
      if (impact.length > 5 && impact.length < 200) {
        return impact;
      }
    }
  }

  return "non précisé";
}

