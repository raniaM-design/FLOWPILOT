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

  // Patterns pour détecter les responsables (améliorés pour formats informels et contextuels)
  const patterns = [
    // "Jean va faire X" ou "Jean fera X" ou "Jean interviendra sur X" ou "Rania interviendra sur Y"
    /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:va|vont|fera|feront|doit|doivent|est|sont|interviendra|interviendront|s'occupe|s'occupent|interviendra)\s+/i,
    // "X par Jean" ou "X par l'équipe Y" ou "X par Sophie"
    /\bpar\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|\w+\s+équipe|\w+\s+team)/i,
    // "Responsable : Jean" ou "Assigné à : Jean" ou "Responsable: Rania"
    /(?:responsable|assigné|assignée|chargé|chargée|délégué|déléguée)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    // "(Jean, ...)" ou "(Rania, à partir de...)" ou "(Sophie)" - première partie des parenthèses
    /\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    // "Améliorer X (Rania)" ou "Action (Rania)" - nom seul dans parenthèses
    /\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\)/i,
    // "L'équipe X" ou "Le service Y" ou "équipe backend" ou "équipe backend"
    /(?:l'|le|la|les)?\s*(équipe|service|département|groupe)\s+([a-z]+|[A-Z][a-z]+)/i,
    // "X interviendra sur Y" = X est responsable
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+interviendra\s+sur/i,
    // "Sophie a proposé de..." = Sophie est responsable
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:a|ont)\s+(?:proposé|proposée|préparé|préparée|rédigé|rédigée)/i,
    // Format informel : "Rania mardi sur X" = Rania est responsable
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|\d+)/i,
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

  // Patterns pour détecter les échéances (améliorés pour formats informels et contextuels)
  const patterns = [
    // Dates explicites : "le 15 mars", "le 20/03", "le 20-03-2024", "le 20 février", "autour du 20 février"
    /\b(?:le|pour|avant|au|à|autour\s+du)\s+(\d{1,2}[\/\-\.]\d{1,2}(?:\/\d{2,4})?|\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i,
    // "vendredi prochain", "lundi", "mardi prochain", "mardi ou mercredi"
    /\b(?:le|pour|avant|au|à)\s+((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+prochain)?(?:\s+ou\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche))?)/i,
    // "cette semaine", "cette semaine", "la semaine prochaine", "semaine prochaine", "la semaine suivante"
    /\b(?:cette|la|la\s+)?(semaine\s+(?:prochaine|suivante)|semaine)/i,
    // "dans X jours/semaines/mois"
    /\bdans\s+(\d+)\s+(jour|jours|semaine|semaines|mois)/i,
    // "avant la fin du mois", "avant fin mars", "avant la démo", "avant la réunion", "avant la démonstration"
    /\b(?:avant|pour)\s+(?:la\s+)?(?:fin\s+(?:du\s+)?(?:mois|semaine|année|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)|démo|démonstration|réunion|meeting|validation|approbation|lancement|événement)/i,
    // "d'ici [date]"
    /\bd'ici\s+(\d{1,2}[\/\-\.]\d{1,2})/i,
    // "à partir de mardi prochain", "à partir de [date]", "à partir de mardi"
    /\b(?:à\s+partir\s+de|pour|avant)\s+((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+prochain)?|\d{1,2}[\/\-\.]\d{1,2})/i,
    // Dans les parenthèses : "(à partir de mardi prochain)" ou "(Rania, à partir de mardi)"
    /\([^)]*(?:à\s+partir\s+de|pour|avant)\s+((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+prochain)?|\d{1,2}[\/\-\.]\d{1,2})/i,
    // Format informel : "mardi prochain" ou "mardi" seul dans le texte
    /\b((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+prochain)?)\b/i,
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

