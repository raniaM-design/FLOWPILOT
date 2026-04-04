/**
 * Client LLM pour l'analyse de comptes rendus de réunion
 * Supporte OpenAI et Anthropic (Claude)
 */

import { preprocessPlainTextForLLM } from "./sanitize-text";
import { meetingNormalizeSystemPrompt } from "./normalize-prompt";
import type { MeetingAnalysisAppResult } from "./meeting-analysis-llm";
import { parseMeetingAnalysisResponse } from "./meeting-analysis-llm";
import {
  buildMeetingAnalysisSystemPrompt,
  buildMeetingRecoverySystemPrompt,
  buildAnalysisPrompt,
  buildAnalysisPromptStrictRetry,
} from "./analyze-prompt";
import { isLikelyAutomaticTranscription } from "./transcription-source-detect";

type LLMProvider = "openai" | "anthropic" | "none";

type AnalysisResult = MeetingAnalysisAppResult;

/** Résultat d'analyse renvoyé à l'API / UI (métadonnées optionnelles). */
export type MeetingAnalysisApiResult = MeetingAnalysisAppResult & {
  _meta?: { isTranscription?: boolean; reinforcedAnalysis?: boolean };
};

export type AnalyzeWithLLMOptions = {
  /** Bloc injecté dans le prompt système (modèle de compte rendu). */
  templateSystemAddendum?: string;
};

const MIN_CHARS_FOR_RECOVERY_PASS = 30;

function mergeRecoveryIntoPrimary(
  primary: AnalysisResult,
  recovered: AnalysisResult
): AnalysisResult {
  const decisions =
    recovered.decisions.length > 0 ? recovered.decisions : primary.decisions;
  const actions =
    recovered.actions.length > 0 ? recovered.actions : primary.actions;
  const clarSet = new Set([
    ...primary.points_a_clarifier,
    ...recovered.points_a_clarifier,
  ]);
  const venir = [
    ...(primary.points_a_venir ?? []),
    ...(recovered.points_a_venir ?? []),
  ];
  const uniqueV: string[] = [];
  const seen = new Set<string>();
  for (const v of venir) {
    const k = v.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    uniqueV.push(v);
  }
  return {
    decisions,
    actions,
    points_a_clarifier: [...clarSet],
    points_a_venir: uniqueV.length ? uniqueV : undefined,
  };
}

/**
 * Détecte le provider LLM disponible depuis les variables d'environnement
 */
function detectLLMProvider(): LLMProvider {
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  return "none";
}

/**
 * Passe 1 : normalisation du texte (plain text structuré, sans JSON).
 */
async function callOpenAINormalize(
  preprocessedText: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Texte brut à reformater :\n\n${preprocessedText}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (normalisation): ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Réponse OpenAI vide (normalisation)");
  }
  return content.trim();
}

/**
 * Passe 1 : normalisation du texte (Anthropic).
 */
async function callAnthropicNormalize(
  preprocessedText: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY non configurée");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Texte brut à reformater :\n\n${preprocessedText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (normalisation): ${error}`);
  }

  const data = await response.json();
  const blocks = data.content;
  if (!Array.isArray(blocks)) {
    throw new Error("Réponse Anthropic invalide (normalisation)");
  }
  const text = blocks
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Réponse Anthropic vide (normalisation)");
  }
  return text;
}

async function normalizeMeetingTextWithLLM(
  preprocessedText: string,
  provider: LLMProvider,
  isTranscription: boolean
): Promise<string> {
  const systemPrompt = meetingNormalizeSystemPrompt(isTranscription);
  if (provider === "openai") {
    return callOpenAINormalize(preprocessedText, systemPrompt);
  }
  if (provider === "anthropic") {
    return callAnthropicNormalize(preprocessedText, systemPrompt);
  }
  throw new Error("Aucun provider pour la normalisation");
}

const DEDUP_SYSTEM_ANTHROPIC = `Tu es un expert en nettoyage et déduplication de données structurées. Tu identifies et fusionne les éléments dupliqués ou redondants, améliores la formulation pour plus de clarté, et conserves toutes les informations importantes. Tu réponds UNIQUEMENT en JSON valide, sans texte autour, en respectant exactement le format JSON fourni dans le message utilisateur.`;

async function openAIChatCompletion(
  system: string,
  user: string,
  useJsonObject: boolean
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  const body: Record<string, unknown> = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
    max_tokens: 4096,
  };
  if (useJsonObject) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Réponse OpenAI vide");
  }
  return content;
}

async function anthropicCompletion(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY non configurée");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const blocks = data.content;
  if (!Array.isArray(blocks)) {
    throw new Error("Réponse Anthropic invalide");
  }
  const text = blocks
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("");
  if (!text) {
    throw new Error("Réponse Anthropic vide");
  }
  return text;
}

/**
 * Extraction JSON (prompt système fourni), avec retry si parsing échoue.
 */
async function extractWithOpenAI(
  analysisSystem: string,
  textForExtraction: string
): Promise<AnalysisResult> {
  let user = buildAnalysisPrompt(textForExtraction);
  let content = await openAIChatCompletion(analysisSystem, user, true);
  let parsed = parseMeetingAnalysisResponse(content);

  if (!parsed) {
    console.warn("[llm-client] Parsing OpenAI échoué, nouvelle tentative avec rappel JSON strict");
    user = buildAnalysisPromptStrictRetry(textForExtraction);
    content = await openAIChatCompletion(analysisSystem, user, true);
    parsed = parseMeetingAnalysisResponse(content);
  }

  if (!parsed) {
    throw new Error("Erreur parsing JSON OpenAI après nouvelle tentative");
  }
  return parsed;
}

async function extractWithAnthropic(
  analysisSystem: string,
  textForExtraction: string
): Promise<AnalysisResult> {
  let user = buildAnalysisPrompt(textForExtraction);
  let content = await anthropicCompletion(analysisSystem, user);
  let parsed = parseMeetingAnalysisResponse(content);

  if (!parsed) {
    console.warn(
      "[llm-client] Parsing Anthropic échoué, nouvelle tentative avec rappel JSON strict"
    );
    user = buildAnalysisPromptStrictRetry(textForExtraction);
    content = await anthropicCompletion(analysisSystem, user);
    parsed = parseMeetingAnalysisResponse(content);
  }

  if (!parsed) {
    throw new Error("Erreur parsing JSON Anthropic après nouvelle tentative");
  }
  return parsed;
}

async function callOpenAI(
  textForExtraction: string,
  isTranscription: boolean,
  templateSystemAddendum?: string,
): Promise<AnalysisResult> {
  return extractWithOpenAI(
    buildMeetingAnalysisSystemPrompt(isTranscription, templateSystemAddendum),
    textForExtraction,
  );
}

async function callAnthropic(
  textForExtraction: string,
  isTranscription: boolean,
  templateSystemAddendum?: string,
): Promise<AnalysisResult> {
  return extractWithAnthropic(
    buildMeetingAnalysisSystemPrompt(isTranscription, templateSystemAddendum),
    textForExtraction,
  );
}

/** Déduplication : attend déjà le format applicatif (analyze-prompt / deduplicate-prompt). */
async function callAnthropicDeduplicate(userPrompt: string): Promise<AnalysisResult> {
  const content = await anthropicCompletion(DEDUP_SYSTEM_ANTHROPIC, userPrompt);
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Aucun JSON trouvé dans la réponse Anthropic (dédup)");
  }
  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}

/** Nombre total d'éléments extraits - si peu, on skip la déduplication (gain de temps) */
function getTotalItemCount(result: AnalysisResult): number {
  return (
    (result.decisions?.length || 0) +
    (result.actions?.length || 0) +
    (result.points_a_clarifier?.length || 0) +
    (result.points_a_venir?.length || 0)
  );
}

/**
 * Nettoie et déduplique les résultats d'extraction avec un LLM
 * Skip si peu d'éléments (≤8) pour éviter un 2e appel API inutile
 */
async function deduplicateWithLLM(
  extractedResult: AnalysisResult,
  provider: LLMProvider
): Promise<AnalysisResult> {
  const totalItems = getTotalItemCount(extractedResult);
  if (totalItems <= 8) {
    return extractedResult;
  }

  const { buildDeduplicatePrompt } = await import("./deduplicate-prompt");
  const jsonString = JSON.stringify(extractedResult, null, 2);
  const prompt = buildDeduplicatePrompt(jsonString);

  try {
    if (provider === "openai") {
      const content = await openAIChatCompletion(
        "Tu es un expert en nettoyage et déduplication de données structurées. Tu identifies et fusionne les éléments dupliqués ou redondants, améliores la formulation pour plus de clarté, et conserves toutes les informations importantes. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.",
        prompt,
        true
      );
      return JSON.parse(content) as AnalysisResult;
    } else if (provider === "anthropic") {
      return await callAnthropicDeduplicate(prompt);
    }
  } catch (error) {
    console.error(`Erreur déduplication LLM (${provider}):`, error);
    // En cas d'erreur, retourner le résultat original
    return extractedResult;
  }

  return extractedResult;
}

/**
 * Analyse un texte de compte rendu avec un LLM
 * Fallback sur extraction basique si aucun LLM n'est configuré
 * Applique une étape de déduplication si LLM disponible
 */
function withAnalysisMeta(
  result: AnalysisResult,
  options: { isTranscription: boolean; reinforcedAnalysis?: boolean }
): MeetingAnalysisApiResult {
  if (!options.isTranscription && !options.reinforcedAnalysis) return result;
  return {
    ...result,
    _meta: {
      ...(options.isTranscription ? { isTranscription: true as const } : {}),
      ...(options.reinforcedAnalysis ? { reinforcedAnalysis: true as const } : {}),
    },
  };
}

export async function analyzeWithLLM(
  meetingText: string,
  fallbackAnalyzer: (text: string) => Promise<AnalysisResult>,
  options?: AnalyzeWithLLMOptions,
): Promise<MeetingAnalysisApiResult> {
  const provider = detectLLMProvider();
  const isTranscription = isLikelyAutomaticTranscription(meetingText);
  const templateAddendum = options?.templateSystemAddendum?.trim();

  if (provider === "none") {
    const preprocessed = preprocessPlainTextForLLM(meetingText);
    const forFallback = templateAddendum
      ? `${templateAddendum}\n\n---\n\n${preprocessed}`
      : preprocessed;
    const base = await fallbackAnalyzer(forFallback);
    return withAnalysisMeta(base, { isTranscription });
  }

  const preprocessed = preprocessPlainTextForLLM(meetingText);

  let textForExtraction = preprocessed;
  try {
    textForExtraction = await normalizeMeetingTextWithLLM(
      preprocessed,
      provider,
      isTranscription
    );
  } catch (normError) {
    console.warn(
      "[llm-client] Normalisation LLM ignorée, utilisation du texte pré-traité:",
      normError
    );
    textForExtraction = preprocessed;
  }

  try {
    let result: AnalysisResult;

    if (provider === "openai") {
      result = await callOpenAI(textForExtraction, isTranscription, templateAddendum);
    } else if (provider === "anthropic") {
      result = await callAnthropic(textForExtraction, isTranscription, templateAddendum);
    } else {
      const forFallback = templateAddendum
        ? `${templateAddendum}\n\n---\n\n${preprocessed}`
        : preprocessed;
      const base = await fallbackAnalyzer(forFallback);
      return withAnalysisMeta(base, { isTranscription });
    }

    let cleanedResult = await deduplicateWithLLM(result, provider);
    let reinforcedAnalysis = false;

    const noDecisionsNoActions =
      cleanedResult.decisions.length === 0 && cleanedResult.actions.length === 0;
    if (
      noDecisionsNoActions &&
      textForExtraction.trim().length >= MIN_CHARS_FOR_RECOVERY_PASS
    ) {
      const recoverySystem = buildMeetingRecoverySystemPrompt(
        isTranscription,
        templateAddendum,
      );
      try {
        const recovered =
          provider === "openai"
            ? await extractWithOpenAI(recoverySystem, textForExtraction)
            : await extractWithAnthropic(recoverySystem, textForExtraction);
        const recoveredCleaned = await deduplicateWithLLM(recovered, provider);
        cleanedResult = mergeRecoveryIntoPrimary(cleanedResult, recoveredCleaned);
        reinforcedAnalysis = true;
        console.log("[llm-client] Passe de récupération appliquée (0 décision / 0 action après 1ʳᵉ analyse)");
      } catch (recoveryErr) {
        console.warn("[llm-client] Passe de récupération échouée:", recoveryErr);
      }
    }

    return withAnalysisMeta(cleanedResult, {
      isTranscription,
      reinforcedAnalysis,
    });
  } catch (error) {
    console.error(`Erreur LLM (${provider}):`, error);
    console.warn("Fallback sur extraction basique");
    const forFallback = templateAddendum
      ? `${templateAddendum}\n\n---\n\n${textForExtraction}`
      : textForExtraction;
    const base = await fallbackAnalyzer(forFallback);
    return withAnalysisMeta(base, { isTranscription });
  }
}

