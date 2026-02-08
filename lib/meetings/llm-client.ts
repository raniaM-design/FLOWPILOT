/**
 * Client LLM pour l'analyse de comptes rendus de réunion
 * Supporte OpenAI et Anthropic (Claude)
 */

type LLMProvider = "openai" | "anthropic" | "none";

type AnalysisResult = {
  decisions: Array<{
    decision: string;
    contexte: string;
    impact_potentiel: string;
  }>;
  actions: Array<{
    action: string;
    responsable: string;
    echeance: string;
  }>;
  points_a_clarifier: string[];
  points_a_venir?: string[]; // Optionnel pour compatibilité
};

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
 * Appelle OpenAI GPT pour l'analyse
 */
async function callOpenAI(prompt: string): Promise<AnalysisResult> {
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
        {
          role: "system",
          content: "Tu es un expert en extraction structurée de décisions et actions depuis des comptes rendus de réunion. Tu analyses méthodiquement le texte pour identifier toutes les décisions prises, actions à réaliser et points à clarifier. Tu extrais activement les responsables, échéances, contextes et impacts même s'ils sont implicites. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2, // Légèrement augmenté pour mieux comprendre le contexte implicite
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Réponse OpenAI vide");
  }

  try {
    return JSON.parse(content) as AnalysisResult;
  } catch (error) {
    throw new Error(`Erreur parsing JSON OpenAI: ${error}`);
  }
}

/**
 * Appelle Anthropic Claude pour l'analyse
 */
async function callAnthropic(prompt: string): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY non configurée");
  }

  // Séparer le prompt en system et user pour Claude (meilleure performance)
  // Le prompt complet est déjà bien structuré, on extrait juste les instructions principales
  const systemPrompt = `Tu es un expert en compréhension et analyse de comptes rendus de réunion. Tu analyses le texte comme un humain le ferait : en comprenant le contexte global, les implications, les relations entre les éléments, même si le texte est mal formaté, incomplet ou ambigu. 

Tu extrais méthodiquement et exhaustivement toutes les décisions prises, actions à réaliser, points à clarifier et points à venir, en comprenant le contexte et les implications. 

Tu détectes les informations implicites, les responsables et échéances même s'ils sont dans le contexte proche, et tu associes intelligemment les métadonnées aux bons éléments.

Tu réponds UNIQUEMENT en JSON valide, sans texte autour, en respectant exactement le format demandé.`;
  
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
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;

  if (!content) {
    throw new Error("Réponse Anthropic vide");
  }

  // Extraire le JSON de la réponse (Claude peut ajouter du texte autour)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Aucun JSON trouvé dans la réponse Anthropic");
  }

  try {
    return JSON.parse(jsonMatch[0]) as AnalysisResult;
  } catch (error) {
    throw new Error(`Erreur parsing JSON Anthropic: ${error}`);
  }
}

/**
 * Nettoie et déduplique les résultats d'extraction avec un LLM
 */
async function deduplicateWithLLM(
  extractedResult: AnalysisResult,
  provider: LLMProvider
): Promise<AnalysisResult> {
  const { buildDeduplicatePrompt } = await import("./deduplicate-prompt");
  const jsonString = JSON.stringify(extractedResult, null, 2);
  const prompt = buildDeduplicatePrompt(jsonString);

  try {
    if (provider === "openai") {
      // Utiliser OpenAI avec le format JSON strict
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
            {
              role: "system",
              content: "Tu es un expert en nettoyage et déduplication de données structurées. Tu identifies et fusionne les éléments dupliqués ou redondants, améliores la formulation pour plus de clarté, et conserves toutes les informations importantes. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${await response.text()}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Réponse OpenAI vide");
      }

      return JSON.parse(content) as AnalysisResult;
    } else if (provider === "anthropic") {
      return await callAnthropic(prompt);
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
export async function analyzeWithLLM(
  meetingText: string,
  fallbackAnalyzer: (text: string) => Promise<AnalysisResult>
): Promise<AnalysisResult> {
  const provider = detectLLMProvider();

  if (provider === "none") {
    // Fallback sur extraction basique
    return fallbackAnalyzer(meetingText);
  }

  const { buildAnalysisPrompt } = await import("./analyze-prompt");
  const prompt = buildAnalysisPrompt(meetingText);

  try {
    let result: AnalysisResult;
    
    if (provider === "openai") {
      result = await callOpenAI(prompt);
    } else if (provider === "anthropic") {
      result = await callAnthropic(prompt);
    } else {
      return fallbackAnalyzer(meetingText);
    }

    // Appliquer la déduplication avec le même LLM
    const cleanedResult = await deduplicateWithLLM(result, provider);
    return cleanedResult;
  } catch (error) {
    console.error(`Erreur LLM (${provider}):`, error);
    // Fallback sur extraction basique en cas d'erreur
    console.warn("Fallback sur extraction basique");
    return fallbackAnalyzer(meetingText);
  }
}

