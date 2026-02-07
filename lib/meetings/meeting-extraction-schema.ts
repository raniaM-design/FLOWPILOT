import { z } from "zod";

// Schéma Zod strict pour MeetingExtraction
export const MeetingExtractionSchema = z.object({
  meta: z.object({
    title: z.string().nullable(),
    date: z.string().nullable(), // ISO YYYY-MM-DD ou null
    duration_minutes: z.number().nullable(),
    attendees: z.array(
      z.object({
        name: z.string(),
        email: z.string().nullable().optional(),
      })
    ),
    source_language: z.enum(["fr", "en", "mixed"]),
  }),
  summary: z.object({
    short: z.string(), // 3-5 lignes max
    key_points: z.array(z.string()), // 4-8 points max
  }),
  decisions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      owner: z.string().nullable(),
      when: z.string().nullable(), // ISO ou null
      confidence: z.enum(["high", "medium", "low"]),
      evidence: z.string(), // extrait exact du texte source
    })
  ).max(10),
  actions: z.array(
    z.object({
      id: z.string(),
      task: z.string(), // verbe d'action + objet
      owner: z.string().nullable(),
      due_date: z.string().nullable(), // ISO si explicite
      due_date_raw: z.string().nullable(), // ex: "semaine prochaine"
      priority: z.enum(["P0", "P1", "P2", "P3"]).nullable(),
      status: z.enum(["todo", "in_progress", "done"]).nullable(),
      confidence: z.enum(["high", "medium", "low"]),
      evidence: z.string(),
    })
  ).max(10),
  risks: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      severity: z.enum(["low", "medium", "high"]).nullable(),
      mitigation: z.string().nullable(),
      confidence: z.enum(["high", "medium", "low"]),
      evidence: z.string(),
    })
  ).max(6),
  open_questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      owner: z.string().nullable(),
      confidence: z.enum(["high", "medium", "low"]),
      evidence: z.string(),
    })
  ).max(8),
  next_steps: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      owner: z.string().nullable(),
      when: z.string().nullable(),
      confidence: z.enum(["high", "medium", "low"]),
      evidence: z.string(),
    })
  ).max(8),
});

export type MeetingExtraction = z.infer<typeof MeetingExtractionSchema>;

