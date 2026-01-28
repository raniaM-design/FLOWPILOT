/**
 * Découpe les phrases longues en items courts et actionnables
 * Découpe sur des connecteurs fréquents et ponctuation forte
 * 
 * @param items - Liste d'items (peut contenir des phrases longues)
 * @returns Liste d'items courts, propres, sans doublons ni items vides
 */
export function splitLongSentences(items: string[]): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  // Connecteurs fréquents pour découper (avec accents et variantes)
  // Note: On utilise des patterns pour gérer les variantes avec/sans accents
  const connectors = [
    /\s+afin\s+de\s+/gi,
    /\s+pour\s+/gi,
    /\s+puis\s+/gi,
    /\s+et\s+/gi,
    /\s+après\s+/gi,
    /\s+avant\s+de\s+/gi,
    /\s+pendant\s+que\s+/gi,
    /\s+alors\s+que\s+/gi,
    /\s+mais\s+/gi,
    /\s+ou\s+/gi,
    /\s+donc\s+/gi,
    /\s+car\s+/gi,
    /\s+ainsi\s+que\s+/gi,
    /\s+ainsi\s+/gi,
    /\s+ensuite\s+/gi,
    /\s+également\s+/gi,
    /\s+aussi\s+/gi,
  ];

  // Ponctuation forte pour découper
  const strongPunctuation = /[.;:!?]\s+/g;

  // Fonction pour nettoyer un item
  const cleanItem = (item: string): string => {
    if (!item) return "";
    // Nettoyer les espaces multiples
    let cleaned = item.replace(/\s+/g, " ").trim();
    // Supprimer les espaces en début/fin
    cleaned = cleaned.trim();
    // Supprimer la ponctuation finale si elle est seule
    cleaned = cleaned.replace(/^[.;:!?]+$/, "");
    return cleaned;
  };

  // Fonction pour découper un item sur les connecteurs et ponctuation
  const splitItem = (item: string): string[] => {
    if (!item || item.length < 10) {
      // Items courts : pas besoin de découper
      return [item];
    }

    // D'abord découper sur ponctuation forte
    const punctuationSplit = item.split(strongPunctuation);
    let allParts: string[] = [];
    
    // Pour chaque partie séparée par ponctuation, découper récursivement sur tous les connecteurs
    for (const part of punctuationSplit) {
      if (!part || part.trim().length === 0) continue;
      
      // Découper récursivement sur tous les connecteurs
      const parts = splitOnConnectors(part.trim());
      allParts.push(...parts);
    }

    // Si on n'a rien découpé, retourner l'item original
    if (allParts.length === 0) {
      return [item];
    }

    return allParts;
  };

  // Fonction récursive pour découper sur tous les connecteurs
  const splitOnConnectors = (text: string, depth: number = 0): string[] => {
    // Limiter la profondeur pour éviter les boucles infinies
    if (depth > 5 || !text || text.length < 10) {
      return text ? [text] : [];
    }

    // Trouver le premier connecteur qui match
    for (const connector of connectors) {
      if (connector.test(text)) {
        // Découper sur ce connecteur
        const parts = text.split(connector);
        const result: string[] = [];
        
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.length > 0) {
            // Si la partie est encore longue, réappliquer le découpage
            if (trimmed.length >= 10) {
              const subParts = splitOnConnectors(trimmed, depth + 1);
              result.push(...subParts);
            } else {
              result.push(trimmed);
            }
          }
        }
        
        return result.length > 0 ? result : [text];
      }
    }

    // Aucun connecteur trouvé, retourner le texte tel quel
    return [text];
  };

  // Traiter chaque item
  for (const item of items) {
    if (!item || typeof item !== "string") {
      continue;
    }

    const cleaned = cleanItem(item);
    if (!cleaned || cleaned.length < 3) {
      continue;
    }

    // Découper l'item si nécessaire
    const splitParts = splitItem(cleaned);

    // Ajouter chaque partie (sans doublons)
    for (const part of splitParts) {
      const partCleaned = cleanItem(part);
      if (!partCleaned || partCleaned.length < 3) {
        continue;
      }

      // Normaliser pour la détection de doublons (case-insensitive, sans accents multiples)
      const normalized = partCleaned.toLowerCase().trim();
      
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(partCleaned);
      }
    }
  }

  return result;
}

