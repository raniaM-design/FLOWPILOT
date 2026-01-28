/**
 * Convertit le HTML en texte brut propre
 * Enlève les balises HTML tout en préservant :
 * - Les sauts de ligne logiques (p, div, br deviennent \n)
 * - Les titres de sections (h1, h2, h3 deviennent des lignes avec \n avant/après)
 * - Les mots importants comme "Décisions", "Actions", "À venir"
 * 
 * @param html - Contenu HTML (TipTap ou autre)
 * @returns Texte brut avec sauts de ligne préservés
 */
export function convertHtmlToPlainText(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  let text = html;

  // 1) Convertir les balises de titre en lignes avec sauts de ligne
  // h1, h2, h3 deviennent des lignes avec \n avant et après
  text = text.replace(/<h[1-6][^>]*>/gi, "\n\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");

  // 2) Convertir les balises de bloc en sauts de ligne
  // p, div, li deviennent \n à la fin
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  
  // 3) Convertir les balises de début de bloc en \n (pour préserver la structure)
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<li[^>]*>/gi, "- "); // Préserver les puces de liste
  
  // 4) Convertir les balises de liste
  text = text.replace(/<\/ul>/gi, "\n");
  text = text.replace(/<\/ol>/gi, "\n");
  text = text.replace(/<ul[^>]*>/gi, "\n");
  text = text.replace(/<ol[^>]*>/gi, "\n");

  // 5) Convertir les br en sauts de ligne
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 6) Convertir les balises strong/em en texte simple (on garde juste le contenu)
  text = text.replace(/<strong[^>]*>/gi, "");
  text = text.replace(/<\/strong>/gi, "");
  text = text.replace(/<em[^>]*>/gi, "");
  text = text.replace(/<\/em>/gi, "");
  text = text.replace(/<b[^>]*>/gi, "");
  text = text.replace(/<\/b>/gi, "");
  text = text.replace(/<i[^>]*>/gi, "");
  text = text.replace(/<\/i>/gi, "");
  text = text.replace(/<u[^>]*>/gi, "");
  text = text.replace(/<\/u>/gi, "");

  // 7) Enlever les liens mais garder le texte
  text = text.replace(/<a[^>]*>/gi, "");
  text = text.replace(/<\/a>/gi, "");

  // 8) Enlever toutes les autres balises HTML restantes
  text = text.replace(/<[^>]+>/g, "");

  // 9) Décoder les entités HTML courantes
  text = text
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

  // 10) Décoder les entités numériques courantes
  text = text.replace(/&#(\d{2,3});/g, (match, code) => {
    const num = parseInt(code, 10);
    if (num === 160) return " "; // Espace insécable
    if (num >= 32 && num <= 126) return String.fromCharCode(num);
    if (num >= 160 && num <= 255) return String.fromCharCode(num);
    return match;
  });

  // 11) Normaliser les retours à la ligne
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 12) Normaliser les espaces insécables
  text = text.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");

  // 13) Remplacer les tabulations par des espaces
  text = text.replace(/\t/g, " ");

  // 14) Normaliser les espaces multiples (max 1 espace)
  text = text.replace(/[ \t]{2,}/g, " ");

  // 15) Normaliser les retours à la ligne multiples (max 2 consécutifs)
  text = text.replace(/\n{3,}/g, "\n\n");

  // 16) Supprimer les caractères de contrôle invisibles (sauf \n)
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // 17) Nettoyer les espaces en début/fin de ligne
  text = text.split("\n").map(line => line.trim()).join("\n");

  // 18) Supprimer les lignes vides en début/fin
  text = text.trim();

  return text;
}

/**
 * Alias pour compatibilité avec le code existant
 * @deprecated Utiliser convertHtmlToPlainText à la place
 */
export function convertEditorContentToPlainText(html: string): string {
  return convertHtmlToPlainText(html);
}

