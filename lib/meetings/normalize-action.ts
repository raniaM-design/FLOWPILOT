/**
 * Normalise le texte d'une action en format opérationnel (verbe à l'infinitif)
 * Transforme des formulations passives ou indirectes en format actionnable
 * 
 * Exemples :
 * - "Les bugs critiques doivent être corrigés" → "Corriger les bugs critiques"
 * - "Il faut créer un module" → "Créer un module"
 * - "Nous devons tester" → "Tester"
 * 
 * @param text - Texte de l'action à normaliser
 * @returns Texte normalisé en format opérationnel, ou texte original nettoyé si transformation incertaine
 */
export function normalizeActionText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Nettoyer le texte de base
  let cleaned = text.trim();
  if (cleaned.length < 3) {
    return cleaned;
  }

  // Supprimer les espaces multiples
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Patterns pour détecter et transformer les formulations courantes

  // Pattern 1: "[sujet] doit être [verbe au participe passé]" → "[verbe à l'infinitif] [sujet]"
  // Ex: "Les bugs critiques doivent être corrigés" → "Corriger les bugs critiques"
  // Ex: "Le code doit être révisé" → "Réviser le code"
  // Approche: chercher "doit être [participe passé]" puis extraire le sujet avant
  const passivePattern1 = /doivent?\s+être\s+([a-zéèêàâôùûîç]+(?:é|ée|és|ées|i|ie|is|ies|u|ue|us|ues))(?:\s|\.|$|,)/i;
  const match1 = cleaned.match(passivePattern1);
  if (match1 && match1.index !== undefined && match1.index > 0) {
    const pastParticiple = match1[1].trim();
    const infinitive = convertPastParticipleToInfinitive(pastParticiple);
    if (infinitive) {
      // Extraire le sujet avant "doit être" et le mettre en minuscule
      const subjectPart = cleaned.substring(0, match1.index).trim().toLowerCase();
      if (subjectPart.length > 0) {
        return `${capitalizeFirst(infinitive)} ${subjectPart}`;
      }
    }
  }

  // Pattern 2: "doit [verbe à l'infinitif]" → "[verbe à l'infinitif]"
  // Ex: "doit créer" → "créer"
  const pattern2 = /^(?:les?|la|le|des?|un|une|nous|on|il|elle|ils|elles)\s+(.+?)\s+doivent?\s+([a-zéèêàâôùûîç]+(?:er|ir|re|oir))(?:\s|$)/i;
  const match2 = cleaned.match(pattern2);
  if (match2) {
    const subject = match2[1].trim();
    const verb = match2[2].trim();
    return `${capitalizeFirst(verb)} ${subject}`;
  }

  // Pattern 3: "Il faut [verbe à l'infinitif]" → "[verbe à l'infinitif]"
  // Ex: "Il faut créer un module" → "Créer un module"
  const pattern3 = /^il\s+faut\s+(.+)$/i;
  const match3 = cleaned.match(pattern3);
  if (match3) {
    const rest = match3[1].trim();
    return capitalizeFirst(rest);
  }

  // Pattern 4: "Nous devons [verbe à l'infinitif] [reste]" → "[verbe à l'infinitif] [reste]"
  // Ex: "Nous devons tester les résultats" → "Tester les résultats"
  const pattern4 = /^(?:nous|on)\s+devons?\s+(.+)$/i;
  const match4 = cleaned.match(pattern4);
  if (match4) {
    const rest = match4[1].trim();
    return capitalizeFirst(rest);
  }

  // Pattern 5: "Il est nécessaire de [verbe à l'infinitif]" → "[verbe à l'infinitif]"
  const pattern5 = /^il\s+est\s+nécessaire\s+de\s+(.+)$/i;
  const match5 = cleaned.match(pattern5);
  if (match5) {
    const rest = match5[1].trim();
    return capitalizeFirst(rest);
  }

  // Pattern 6: "Il convient de [verbe à l'infinitif]" → "[verbe à l'infinitif]"
  const pattern6 = /^il\s+convient\s+de\s+(.+)$/i;
  const match6 = cleaned.match(pattern6);
  if (match6) {
    const rest = match6[1].trim();
    return capitalizeFirst(rest);
  }

  // Pattern 7: Déjà au format infinitif mais avec majuscule incorrecte
  // Ex: "créer un module" → "Créer un module"
  if (/^[a-zéèêàâôùûîç]+(?:er|ir|re|oir)\s/i.test(cleaned)) {
    return capitalizeFirst(cleaned);
  }

  // Si aucune transformation n'est trouvée, retourner le texte nettoyé tel quel
  // (principe: ne pas inventer si on n'est pas sûr)
  return capitalizeFirst(cleaned);
}

/**
 * Convertit un participe passé en infinitif
 * Note: Conversion basique pour les cas courants, retourne null si incertain
 */
function convertPastParticipleToInfinitive(pastParticiple: string): string | null {
  const lower = pastParticiple.toLowerCase();

  // Règles de base pour les terminaisons courantes
  // -é → -er
  if (lower.endsWith("é")) {
    return lower.slice(0, -1) + "er";
  }
  if (lower.endsWith("ée")) {
    return lower.slice(0, -2) + "er";
  }
  if (lower.endsWith("és")) {
    return lower.slice(0, -2) + "er";
  }
  if (lower.endsWith("ées")) {
    return lower.slice(0, -3) + "er";
  }

  // -i → -ir
  if (lower.endsWith("i")) {
    return lower.slice(0, -1) + "ir";
  }
  if (lower.endsWith("ie")) {
    return lower.slice(0, -2) + "ir";
  }
  if (lower.endsWith("is")) {
    return lower.slice(0, -2) + "ir";
  }
  if (lower.endsWith("ies")) {
    return lower.slice(0, -3) + "ir";
  }

  // -u → -re (pour certains verbes)
  if (lower.endsWith("u")) {
    // Vérifier quelques cas courants
    const commonVerbs: Record<string, string> = {
      "corrigé": "corriger",
      "créé": "créer",
      "testé": "tester",
      "développé": "développer",
      "implémenté": "implémenter",
      "déployé": "déployer",
      "validé": "valider",
      "révisé": "réviser",
      "nettoyé": "nettoyer",
      "amélioré": "améliorer",
      "optimisé": "optimiser",
      "finalisé": "finaliser",
      "complété": "compléter",
      "terminé": "terminer",
      "livré": "livrer",
      "ajouté": "ajouter",
      "supprimé": "supprimer",
      "modifié": "modifier",
      "changé": "changer",
      "adapté": "adapter",
      "ajusté": "ajuster",
      "démarré": "démarrer",
      "arrêté": "arrêter",
      "activé": "activer",
      "désactivé": "désactiver",
    };

    if (commonVerbs[lower]) {
      return commonVerbs[lower];
    }

    // Tentative générique pour -é
    return lower.slice(0, -1) + "er";
  }

  // Si on ne peut pas convertir de manière fiable, retourner null
  return null;
}

/**
 * Met en majuscule la première lettre d'une chaîne
 */
function capitalizeFirst(text: string): string {
  if (!text || text.length === 0) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}
