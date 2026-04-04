import { prisma } from "@/lib/db";
import { getBuiltinTemplateById } from "@/lib/meetings/notes-templates";

export type ResolvedMeetingTemplateHints = {
  presetKey: string | null;
  customTemplateId: string | null;
  /** Bloc à injecter dans le prompt système (vide si aucun modèle) */
  systemAddendum: string;
};

function sectionTitlesFromMarkdown(md: string): string[] {
  return md
    .split(/\r?\n/)
    .map((l) => l.match(/^##\s+(.+)/)?.[1]?.trim())
    .filter((x): x is string => !!x);
}

/**
 * Résout le texte d’aide LLM à partir du preset et/ou du modèle perso (vérifie la propriété).
 */
export async function resolveMeetingTemplateHints(
  ownerId: string,
  notesTemplatePreset: string | null | undefined,
  notesCustomTemplateId: string | null | undefined,
): Promise<ResolvedMeetingTemplateHints> {
  const preset = notesTemplatePreset?.trim() || null;
  const customId = notesCustomTemplateId?.trim() || null;

  const chunks: string[] = [];

  const builtin = preset ? getBuiltinTemplateById(preset) : null;
  if (builtin) {
    chunks.push(builtin.analysisGuidance);
  }

  if (customId) {
    const tpl = await prisma.meetingNotesTemplate.findFirst({
      where: { id: customId, userId: ownerId },
      select: { name: true, bodyMarkdown: true },
    });
    if (tpl) {
      const titles = sectionTitlesFromMarkdown(tpl.bodyMarkdown);
      const list = titles.length ? titles.join(", ") : "(structure libre)";
      chunks.push(
        `Modèle personnalisé « ${tpl.name} ». Sections prévues (titres ##) : ${list}. ` +
          `Interprète le contenu sous chaque section pour distinguer décisions actées, actions à réaliser, risques et sujets ouverts.`,
      );
    }
  }

  if (chunks.length === 0) {
    return {
      presetKey: preset,
      customTemplateId: customId,
      systemAddendum: "",
    };
  }

  return {
    presetKey: preset,
    customTemplateId: customId,
    systemAddendum:
      "\n\nCONTEXTE MODÈLE DE COMPTE RENDU (respecte cette structure pour l’interprétation) :\n" +
      chunks.join("\n\n"),
  };
}
