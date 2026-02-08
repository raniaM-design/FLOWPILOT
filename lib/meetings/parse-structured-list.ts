/**
 * Parse les listes structurées avec métadonnées (action + responsable + échéance sur plusieurs lignes)
 * Détecte et associe les métadonnées aux actions/décisions
 */

export interface ParsedItem {
  text: string;
  responsible?: string;
  dueDate?: string;
  context?: string;
  impact?: string;
}

/**
 * Parse une liste structurée où les métadonnées peuvent être sur des lignes séparées
 * Exemple:
 * - "Créer la roadmap"
 * - "Responsable: Rania"
 * - "Échéance: Dans 3 jours"
 */
export function parseStructuredList(lines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  let currentItem: ParsedItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 2) {
      continue;
    }

    // Détecter les labels de métadonnées (avec ou sans flèche)
    const responsibleMatch = line.match(/^(?:→|->|-)?\s*(?:responsable|assigné|chargé|délégué)\s*:?\s*(.+)$/i);
    const dueDateMatch = line.match(/^(?:→|->|-)?\s*(?:échéance|deadline|date)\s*:?\s*(.+)$/i);
    const contextMatch = line.match(/^(?:→|->|-)?\s*(?:contexte|situation|problème)\s*:?\s*(.+)$/i);
    const impactMatch = line.match(/^(?:→|->|-)?\s*(?:impact|conséquence|effet|bénéfice|risque|avantage)\s*:?\s*(.+)$/i);
    
    // Détecter les métadonnées dans les parenthèses : "(Rania, à partir de mardi prochain)"
    const parensMatch = line.match(/\(([^)]+)\)/);
    if (parensMatch && currentItem) {
      const parensContent = parensMatch[1];
      // Chercher un nom propre (responsable)
      const nameMatch = parensContent.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (nameMatch && !currentItem.responsible) {
        currentItem.responsible = nameMatch[1].trim();
      }
      // Chercher une date/échéance
      const dateMatch = parensContent.match(/(?:à\s+partir\s+de|pour|avant|le)\s+((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+prochain)?|\d{1,2}[\/\-\.]\d{1,2}|semaine\s+prochaine)/i);
      if (dateMatch && !currentItem.dueDate) {
        currentItem.dueDate = dateMatch[1].trim();
      }
    }

    if (responsibleMatch) {
      if (currentItem) {
        currentItem.responsible = responsibleMatch[1].trim();
      }
      continue;
    }

    if (dueDateMatch) {
      if (currentItem) {
        currentItem.dueDate = dueDateMatch[1].trim();
      }
      continue;
    }

    if (contextMatch) {
      if (currentItem) {
        currentItem.context = contextMatch[1].trim();
      }
      continue;
    }

    if (impactMatch) {
      if (currentItem) {
        currentItem.impact = impactMatch[1].trim();
      }
      continue;
    }

    // Si c'est une nouvelle action/décision (commence par un verbe ou une majuscule)
    // Sauvegarder l'item précédent et créer un nouveau
    if (currentItem && currentItem.text) {
      items.push(currentItem);
    }

    // Créer un nouvel item
    currentItem = {
      text: line,
    };
  }

  // Ajouter le dernier item
  if (currentItem && currentItem.text) {
    items.push(currentItem);
  }

  return items;
}

/**
 * Extrait les métadonnées depuis le texte d'un item et les lignes suivantes
 */
export function extractMetadataFromContext(
  itemText: string,
  followingLines: string[]
): { responsible?: string; dueDate?: string; context?: string; impact?: string } {
  const metadata: { responsible?: string; dueDate?: string; context?: string; impact?: string } = {};

  // Chercher dans le texte de l'item
  const responsibleInText = itemText.match(/(?:responsable|assigné|chargé|délégué)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const dueDateInText = itemText.match(/(?:échéance|deadline|date)\s*:?\s*(.+?)(?:\.|$)/i);
  const contextInText = itemText.match(/(?:contexte|situation|problème)\s*:?\s*(.+?)(?:\.|$)/i);
  const impactInText = itemText.match(/(?:impact|conséquence|effet|bénéfice|risque|avantage)\s*:?\s*(.+?)(?:\.|$)/i);

  if (responsibleInText) {
    metadata.responsible = responsibleInText[1].trim();
  }
  if (dueDateInText) {
    metadata.dueDate = dueDateInText[1].trim();
  }
  if (contextInText) {
    metadata.context = contextInText[1].trim();
  }
  if (impactInText) {
    metadata.impact = impactInText[1].trim();
  }

  // Chercher dans les lignes suivantes (max 3 lignes)
  for (let i = 0; i < Math.min(3, followingLines.length); i++) {
    const line = followingLines[i].trim();
    
    const responsibleMatch = line.match(/^(?:responsable|assigné|chargé|délégué)\s*:?\s*(.+)$/i);
    const dueDateMatch = line.match(/^(?:échéance|deadline|date)\s*:?\s*(.+)$/i);
    const contextMatch = line.match(/^(?:contexte|situation|problème)\s*:?\s*(.+)$/i);
    const impactMatch = line.match(/^(?:impact|conséquence|effet|bénéfice|risque|avantage)\s*:?\s*(.+)$/i);

    if (responsibleMatch && !metadata.responsible) {
      metadata.responsible = responsibleMatch[1].trim();
    }
    if (dueDateMatch && !metadata.dueDate) {
      metadata.dueDate = dueDateMatch[1].trim();
    }
    if (contextMatch && !metadata.context) {
      metadata.context = contextMatch[1].trim();
    }
    if (impactMatch && !metadata.impact) {
      metadata.impact = impactMatch[1].trim();
    }
  }

  return metadata;
}

