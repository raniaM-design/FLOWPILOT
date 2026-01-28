/**
 * Sanitise le texte d'un compte rendu de réunion
 * Enlève les balises HTML, normalise les espaces et supprime les caractères parasites
 * Préserve les mots importants comme "Décisions", "Actions", "À venir"
 * 
 * @param input - Texte brut du compte rendu (peut contenir du HTML)
 * @returns Texte propre, prêt pour l'analyse
 */
export function sanitizeMeetingText(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let cleaned = input;

  // 1) Convertir d'abord les balises de bloc HTML en retours à la ligne
  // (AVANT de supprimer les balises, pour préserver la structure)
  // Convertir <br>, <br/>, <br /> en \n
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");
  // Convertir les balises de fin de bloc en \n
  cleaned = cleaned.replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, "\n");
  // Convertir les balises de début de bloc en \n (pour préserver la structure)
  cleaned = cleaned.replace(/<(p|div|li|ul|ol|h[1-6])(\s[^>]*)?>/gi, "\n");

  // 2) Décoder les entités HTML courantes (avant de supprimer les balises)
  // Note: On utilise une approche simple pour éviter les dépendances
  // Si besoin de plus de décodage, utiliser une lib comme he ou html-entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&acirc;/g, "â")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ccedil;/g, "ç")
    .replace(/&uuml;/g, "ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&auml;/g, "ä")
    .replace(/&iuml;/g, "ï")
    .replace(/&ucirc;/g, "û");

  // 3) Décoder les entités HTML numériques courantes (&#160; = espace insécable, etc.)
  // Décoder &#160; à &#255; (caractères latins courants)
  cleaned = cleaned.replace(/&#(\d{2,3});/g, (match, code) => {
    const num = parseInt(code, 10);
    // Espace insécable et autres caractères courants
    if (num === 160) return " ";
    if (num >= 32 && num <= 126) return String.fromCharCode(num);
    if (num >= 160 && num <= 255) return String.fromCharCode(num);
    return match; // Garder si non reconnu
  });

  // 4) Enlever toutes les balises HTML restantes (y compris auto-fermantes et span, etc.)
  // Pattern: <...> où ... peut contenir des attributs, espaces, etc.
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // 5) Normaliser les types de retours à la ligne
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 6) Normaliser les espaces insécables et autres caractères d'espace Unicode
  cleaned = cleaned.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");

  // 7) Remplacer les tabulations par des espaces
  cleaned = cleaned.replace(/\t/g, " ");

  // 8) Normaliser les espaces multiples (max 1 espace)
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

  // 9) Normaliser les retours à la ligne multiples (max 2 consécutifs)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // 10) Supprimer les caractères de contrôle invisibles (sauf \n et \t déjà géré)
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // 11) Nettoyer les espaces en début/fin de ligne
  cleaned = cleaned.split("\n").map(line => line.trim()).join("\n");

  // 12) Supprimer les lignes vides en début/fin
  cleaned = cleaned.trim();

  // Note: Les mots importants comme "Décisions", "Actions", "À venir" sont préservés
  // car ils ne sont pas dans les patterns de suppression (seules les balises HTML et
  // les caractères parasites sont supprimés)

  return cleaned;
}

