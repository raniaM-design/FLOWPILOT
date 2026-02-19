/**
 * Utilitaires pour extraire le texte brut depuis TLRichText (tldraw)
 */

/**
 * Extrait le texte brut d'un TLRichText (structure doc/paragraph/text).
 */
export function getPlainTextFromRichText(
  richText: { content?: Array<{ content?: Array<{ text?: string }> }> } | null | undefined
): string {
  if (!richText?.content) return "";
  return richText.content
    .map((block) => {
      if (block.content) {
        return (block.content as Array<{ text?: string }>)
          .map((n) => n.text ?? "")
          .join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}
