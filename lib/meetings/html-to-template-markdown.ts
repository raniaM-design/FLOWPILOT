import { convertHtmlToPlainText } from "@/lib/meetings/convert-editor-content";

/**
 * Extrait une structure type modèle depuis le HTML TipTap (h2 → ##).
 */
export function editorHtmlToTemplateMarkdown(html: string): string {
  if (!html || typeof html !== "string") return "";
  let s = html;
  const parts: string[] = [];
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = h2Regex.exec(s)) !== null) {
    const before = s.slice(lastIndex, m.index);
    if (before.trim()) {
      const plain = stripHtmlToSingleLine(before);
      if (plain) parts.push(plain);
    }
    const title = stripHtmlToSingleLine(m[1] ?? "").trim();
    if (title) parts.push(`## ${title}`, "");
    lastIndex = m.index + m[0].length;
  }
  const tail = s.slice(lastIndex);
  if (stripHtmlToSingleLine(tail).trim()) {
    parts.push(convertHtmlToPlainText(tail).trim());
  }
  if (parts.some((p) => p.startsWith("## "))) {
    return parts.join("\n\n").trim() + "\n";
  }
  return convertHtmlToPlainText(html).trim();
}

function stripHtmlToSingleLine(fragment: string): string {
  return convertHtmlToPlainText(fragment)
    .split(/\s+/)
    .join(" ")
    .trim();
}
