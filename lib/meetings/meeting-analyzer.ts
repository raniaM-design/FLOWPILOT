import { z } from "zod";
import { MeetingExtractionSchema, type MeetingExtraction } from "./meeting-extraction-schema";

/**
 * Détecte le provider LLM disponible
 */
function detectLLMProvider(): "openai" | "anthropic" | "none" {
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  return "none";
}

/**
 * Appelle le LLM pour l'extraction structurée
 */
async function callLLMForExtraction(
  prompt: string,
  provider: "openai" | "anthropic"
): Promise<string> {
  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY non configurée");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en extraction structurée de comptes-rendus. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "{}";
  } else {
    // Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY non configurée");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : content;
  }
}

/**
 * Normalise le texte brut d'un compte-rendu
 */
function normalizeText(rawText: string): string {
  let normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Nettoyer les lignes
  normalized = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return normalized.trim();
}

/**
 * Génère un ID unique pour un item
 */
function generateItemId(prefix: string, index: number): string {
  return `${prefix}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Prompt pour l'extraction structurée
 */
const EXTRACTION_PROMPT = `Tu es un expert en extraction structurée de comptes-rendus de réunion.

RÈGLES STRICTES :
1. NE JAMAIS INVENTER : Si une info n'est pas dans le texte, utiliser null ou "non précisé"
2. Dates : Si floue ("semaine prochaine"), mettre dans due_date_raw et due_date = null
3. Responsables : Si non mentionné, owner = null
4. Evidence : Pour chaque item, extraire 1 phrase exacte du texte source
5. Confidence : "high" si explicite, "medium" si déduit, "low" si incertain
6. Limites : max 10 actions, 10 décisions, 6 risques, 8 questions, 8 next_steps

DÉFINITIONS :
- DÉCISION : Ce qui a été acté, validé, approuvé collectivement
- ACTION : Tâche concrète avec verbe d'action + objet, assignée ou à assigner
- RISQUE : Problème potentiel, blocage, danger identifié
- QUESTION : Point non tranché, information manquante, sujet à clarifier
- NEXT_STEP : Étape future, sujet reporté, action planifiée

Format JSON strict (pas de texte autour) :

{
  "meta": {
    "title": "string ou null",
    "date": "YYYY-MM-DD ou null",
    "duration_minutes": number ou null,
    "attendees": [{"name": "string", "email": "string ou null"}],
    "source_language": "fr" | "en" | "mixed"
  },
  "summary": {
    "short": "3-5 lignes max",
    "key_points": ["point 1", "point 2", ...]
  },
  "decisions": [{
    "id": "unique_id",
    "text": "texte décision",
    "owner": "nom ou null",
    "when": "YYYY-MM-DD ou null",
    "confidence": "high|medium|low",
    "evidence": "extrait exact du texte"
  }],
  "actions": [{
    "id": "unique_id",
    "task": "verbe + objet",
    "owner": "nom ou null",
    "due_date": "YYYY-MM-DD ou null",
    "due_date_raw": "texte flou ou null",
    "priority": "P0|P1|P2|P3 ou null",
    "status": "todo|in_progress|done ou null",
    "confidence": "high|medium|low",
    "evidence": "extrait exact"
  }],
  "risks": [{
    "id": "unique_id",
    "text": "description risque",
    "severity": "low|medium|high ou null",
    "mitigation": "texte ou null",
    "confidence": "high|medium|low",
    "evidence": "extrait exact"
  }],
  "open_questions": [{
    "id": "unique_id",
    "text": "question",
    "owner": "nom ou null",
    "confidence": "high|medium|low",
    "evidence": "extrait exact"
  }],
  "next_steps": [{
    "id": "unique_id",
    "text": "étape",
    "owner": "nom ou null",
    "when": "YYYY-MM-DD ou null",
    "confidence": "high|medium|low",
    "evidence": "extrait exact"
  }]
}

Texte à analyser :
"""{{MEETING_TEXT}}"""`;

/**
 * Analyse un compte-rendu avec IA (ou mock si pas de clé)
 */
export async function analyzeMeeting(rawText: string): Promise<{
  cleanedText: string;
  extracted: MeetingExtraction;
}> {
  const cleanedText = normalizeText(rawText);

  // Essayer d'utiliser le LLM si configuré
  try {
    const provider = detectLLMProvider();
    
    if (provider !== "none") {
      const prompt = EXTRACTION_PROMPT.replace("{{MEETING_TEXT}}", cleanedText);
      const llmResponse = await callLLMForExtraction(prompt, provider);

      // Parser et valider le JSON
      let parsed: unknown;
      if (typeof llmResponse === "string") {
        // Extraire le JSON du texte si nécessaire
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            // Si échec, essayer de parser tout le texte
            parsed = JSON.parse(llmResponse);
          }
        } else {
          parsed = JSON.parse(llmResponse);
        }
      } else {
        parsed = llmResponse;
      }

      // Valider avec Zod et corriger les IDs manquants
      const withIds = ensureIds(parsed);
      const validated = MeetingExtractionSchema.parse(withIds);
      return { cleanedText, extracted: validated };
    }
  } catch (error) {
    console.warn("Erreur analyse LLM, utilisation du mock:", error);
  }

  // Fallback sur mock
  return {
    cleanedText,
    extracted: generateMockExtraction(cleanedText),
  };
}

/**
 * Assure que tous les items ont des IDs uniques
 */
function ensureIds(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;

  const obj = data as Record<string, unknown>;
  const result = { ...obj };

  // Assurer les IDs pour chaque array
  ["decisions", "actions", "risks", "open_questions", "next_steps"].forEach((key) => {
    if (Array.isArray(obj[key])) {
      result[key] = (obj[key] as unknown[]).map((item, index) => {
        if (typeof item === "object" && item !== null) {
          const itemObj = item as Record<string, unknown>;
          if (!itemObj.id || typeof itemObj.id !== "string") {
            return { ...itemObj, id: generateItemId(key.slice(0, 3), index) };
          }
        }
        return item;
      });
    }
  });

  return result;
}

/**
 * Génère une extraction mock pour tests/développement
 */
function generateMockExtraction(text: string): MeetingExtraction {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const now = new Date().toISOString().split("T")[0];

  return {
    meta: {
      title: lines[0]?.substring(0, 50) || null,
      date: now,
      duration_minutes: null,
      attendees: [],
      source_language: "fr",
    },
    summary: {
      short: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      key_points: lines.slice(0, 5).map((l) => l.substring(0, 100)),
    },
    decisions: [],
    actions: [],
    risks: [],
    open_questions: [],
    next_steps: [],
  };
}

