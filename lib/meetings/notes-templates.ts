/**
 * Modèles par défaut pour la structure des comptes rendus (markdown ##).
 */

export type BuiltinNotesTemplate = {
  id: string;
  label: string;
  markdown: string;
  /** Indications pour l’IA : sémantique des sections */
  analysisGuidance: string;
};

export const BUILTIN_MEETING_NOTES_TEMPLATE_IDS = [
  "weekly_team",
  "board",
  "retro",
  "one_on_one",
] as const;

export type BuiltinMeetingNotesTemplateId = (typeof BUILTIN_MEETING_NOTES_TEMPLATE_IDS)[number];

export const BUILTIN_MEETING_NOTES_TEMPLATES: BuiltinNotesTemplate[] = [
  {
    id: "weekly_team",
    label: "Réunion hebdo équipe",
    markdown: `## Présents



## Points en cours



## Décisions



## Actions de la semaine



## Prochaine réunion


`,
    analysisGuidance: `Modèle « Réunion hebdo équipe ».
- La section « Présents » liste les participants (pas des actions).
- « Points en cours » : sujets en discussion, blocages éventuels (peuvent alimenter points à clarifier ou risques).
- « Décisions » : choix actés, validations d’équipe.
- « Actions de la semaine » : tâches concrètes, verbes d’action, responsables et échéances si mentionnés.
- « Prochaine réunion » : date, ordre du jour ou sujets à reporter → souvent des points_a_venir ou questions ouvertes.`,
  },
  {
    id: "board",
    label: "Comité de direction",
    markdown: `## Participants



## Ordre du jour



## Points traités



## Décisions stratégiques



## Actions prioritaires



## Date prochain comité


`,
    analysisGuidance: `Modèle « Comité de direction ».
- « Participants » : noms / fonctions.
- « Ordre du jour » et « Points traités » : contexte ; les conclusions actées vont en décisions.
- « Décisions stratégiques » : décisions de gouvernance, orientations, arbitrages.
- « Actions prioritaires » : engagements exécutifs, deadlines serrées.
- « Date prochain comité » : information de planification → peut apparaître en point à venir si pas d’action explicite.`,
  },
  {
    id: "retro",
    label: "Rétrospective",
    markdown: `## Ce qui a bien marché



## Ce qui peut s'améliorer



## Actions d'amélioration



## Décisions d'équipe


`,
    analysisGuidance: `Modèle « Rétrospective ».
- « Ce qui a bien marché » : constats positifs (rarement des décisions formelles).
- « Ce qui peut s'améliorer » : problèmes, risques, questions ouvertes.
- « Actions d'amélioration » : tâches correctives, expérimentations, owners.
- « Décisions d'équipe » : accords sur le processus, règles d’équipe, engagements collectifs.`,
  },
  {
    id: "one_on_one",
    label: "1-to-1",
    markdown: `## Sujets abordés



## Feedback donné



## Actions convenues



## Points de suivi


`,
    analysisGuidance: `Modèle « 1-to-1 ».
- « Sujets abordés » : contexte de discussion.
- « Feedback donné » : retours, attentes (peut générer des points à clarifier si objectifs flous).
- « Actions convenues » : ce que le manager ou le collaborateur s’engage à faire → actions avec responsable.
- « Points de suivi » : sujets à revoir, prochains check-ins → points_a_venir ou questions.`,
  },
];

export function getBuiltinTemplateById(
  id: string | null | undefined,
): BuiltinNotesTemplate | null {
  if (!id) return null;
  return BUILTIN_MEETING_NOTES_TEMPLATES.find((t) => t.id === id) ?? null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convertit un squelette markdown (titres ##) en HTML pour TipTap. */
export function meetingTemplateMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      blocks.push(`<h2>${escapeHtml(h2[1].trim())}</h2>`);
      i++;
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      const h = lines[i].match(/^##\s+/);
      if (h) break;
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      blocks.push(`<p>${escapeHtml(paraLines.join(" "))}</p>`);
    }
  }
  return blocks.join("");
}
