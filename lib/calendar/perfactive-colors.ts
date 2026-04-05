/**
 * Palette pastels « Perfactive » par projet (mapping explicite + cycle pour les autres).
 */

export type PerfactiveColors = { bg: string; text: string };

const URGENT: PerfactiveColors = { bg: "#FFB8C8", text: "#9F1239" };

/** Clés normalisées (trim + lower) */
const NAMED: Record<string, PerfactiveColors> = {
  "test app mobile": { bg: "#BFD7FF", text: "#1A3DA8" },
  "projet 3": { bg: "#C8F0DE", text: "#14532D" },
  "projet 2": { bg: "#F0C8F5", text: "#6B21A8" },
  pilotys: { bg: "#FFD6B0", text: "#7C3400" },
};

/** Pastels pour projets non listés (rotation stable par hash du nom) */
const CYCLE: PerfactiveColors[] = [
  { bg: "#BFD7FF", text: "#1A3DA8" },
  { bg: "#C8F0DE", text: "#14532D" },
  { bg: "#F0C8F5", text: "#6B21A8" },
  { bg: "#FFD6B0", text: "#7C3400" },
  { bg: "#D4E4FF", text: "#1E40AF" },
  { bg: "#DCFCE7", text: "#166534" },
  { bg: "#FCE7F3", text: "#9D174D" },
];

function normalizeProjectKey(name: string): string {
  return name.trim().toLowerCase();
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getPerfactiveProjectColors(
  projectName: string,
  options?: { urgent?: boolean }
): PerfactiveColors {
  if (options?.urgent) return URGENT;
  const key = normalizeProjectKey(projectName);
  const named = NAMED[key];
  if (named) return named;
  const idx = hashString(key) % CYCLE.length;
  return CYCLE[idx]!;
}

export function isUrgentAction(overdueOnToday: boolean, status: string): boolean {
  return overdueOnToday || status === "BLOCKED" || status === "CRITICAL";
}
