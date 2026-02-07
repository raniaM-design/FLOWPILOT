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
              "Tu es un expert en compréhension et analyse de comptes-rendus de réunion. Tu dois comprendre le texte comme un humain le ferait : saisir le contexte global, les implications, les relations entre les éléments, même si le texte est mal formaté, incomplet ou ambigu. Tu analyses méthodiquement en préservant le sens profond, pas juste les mots. Tu déduis intelligemment du contexte quand c'est évident, mais tu ne devines jamais. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.",
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
 * Normalise le texte brut d'un compte-rendu de manière robuste
 * Gère les caractères spéciaux, lignes mal formatées, phrases collées, etc.
 */
function normalizeText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  let normalized = rawText;

  // 1. Normaliser les retours à la ligne (tous types)
  normalized = normalized
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n") // Line Separator
    .replace(/\u2029/g, "\n"); // Paragraph Separator

  // 2. Remplacer les espaces insécables et caractères d'espace Unicode par des espaces normaux
  normalized = normalized.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");

  // 3. Remplacer les tabulations par des espaces
  normalized = normalized.replace(/\t/g, " ");

  // 4. Supprimer les caractères de contrôle (sauf \n)
  normalized = normalized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // 5. Détecter et séparer les phrases collées intelligemment
  // Exemple: "Jean va préparer le documentMarie doit envoyer le rapport"
  // Mais attention : ne pas séparer les noms propres composés ("JeanMarie" reste ensemble si c'est un nom)
  normalized = normalized.replace(/([a-zàâäéèêëïîôöùûüÿç])([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüÿç])/g, "$1. $2");

  // 6. Séparer les phrases collées avec des nombres
  // Exemple: "Action 1Envoyer le rapport" -> "Action 1. Envoyer le rapport"
  normalized = normalized.replace(/(\d+)([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ])/g, "$1. $2");

  // 7. Détecter les phrases sans ponctuation mais avec contexte (mots-clés de fin de phrase)
  // Exemple: "Jean va préparer le documentMarie doit envoyer" -> séparer avant "Marie"
  const sentenceEnders = ["document", "rapport", "budget", "projet", "réunion", "décision", "action"];
  sentenceEnders.forEach((word) => {
    const regex = new RegExp(`(${word})([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüÿç])`, "gi");
    normalized = normalized.replace(regex, "$1. $2");
  });

  // 8. Normaliser les espaces multiples (mais garder les retours à la ligne)
  normalized = normalized.replace(/[ \t]+/g, " ");

  // 9. Nettoyer les lignes une par une
  const lines = normalized.split("\n");
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Ignorer les lignes vides
    if (!line || line.length === 0) {
      // Garder une ligne vide max entre deux blocs de texte
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== "") {
        cleanedLines.push("");
      }
      continue;
    }

    // Supprimer les puces/numérotation en début de ligne si mal formatées
    line = line.replace(/^[\s\u00A0]*[-•*◦▪▫→➜➤✓☐☑✓▸▹▻►▶▪▫\u2022\u2023\u2043\u204C\u204D\u2219\u25E6\u25AA\u25AB\u25CF\u25CB\u25A1\u25A0]+[\s\u00A0]*/u, "");
    line = line.replace(/^[\s\u00A0]*\d+[\.\)]\s*/u, "");
    line = line.replace(/^[\s\u00A0]*[a-z]\)\s*/iu, "");

    // Corriger les espaces avant ponctuation
    line = line.replace(/\s+([.,;:!?])/g, "$1");

    // Corriger les espaces après ponctuation (sauf si suivi d'un nombre)
    line = line.replace(/([.,;:!?])([^\s\d])/g, "$1 $2");

    // Normaliser les guillemets et apostrophes
    line = line
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/…/g, "...");

    // Supprimer les caractères spéciaux problématiques mais garder les accents et symboles utiles
    // Garder : lettres, chiffres, accents, ponctuation, symboles courants (€, $, %, etc.)
    line = line.replace(/[^\w\s\u00C0-\u017F.,;:!?'"()\[\]{}\-–—/\\@#$%&*+=<>|~`€£¥]/g, "");

    // Nettoyer les espaces en fin de ligne
    line = line.trim();

    // Ajouter la ligne si elle n'est pas vide après nettoyage
    if (line.length > 0) {
      cleanedLines.push(line);
    }
  }

  // 10. Rejoindre les lignes et normaliser les retours à la ligne multiples
  normalized = cleanedLines.join("\n");
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  // 11. Dernière passe : détecter et corriger les phrases sans espace après point
  normalized = normalized.replace(/\.([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ])/g, ". $1");

  // 12. Préserver les abréviations courantes (ne pas les séparer)
  const abbreviations = ["CR", "RDV", "R&D", "Q1", "Q2", "Q3", "Q4", "M.", "Mme", "Mlle", "etc", "cf", "ex", "p.ex", "vs", "max", "min"];
  abbreviations.forEach((abbr) => {
    const regex = new RegExp(`\\b${abbr.replace(/\./g, "\\.")}\\.?`, "gi");
    normalized = normalized.replace(regex, abbr);
  });

  // 13. Préserver les expressions courantes qui peuvent être collées
  const expressions = [
    { pattern: /(?:^|\s)(à|a)venir/gi, replacement: " à venir" },
    { pattern: /(?:^|\s)(à|a)faire/gi, replacement: " à faire" },
    { pattern: /(?:^|\s)(à|a)clarifier/gi, replacement: " à clarifier" },
    { pattern: /(?:^|\s)(à|a)définir/gi, replacement: " à définir" },
  ];
  expressions.forEach(({ pattern, replacement }) => {
    normalized = normalized.replace(pattern, replacement);
  });

  // 11. Nettoyer les espaces en début/fin
  return normalized.trim();
}

/**
 * Génère un ID unique pour un item
 */
function generateItemId(prefix: string, index: number): string {
  return `${prefix}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Prompt pour l'extraction structurée (version intelligente et contextuelle)
 */
const EXTRACTION_PROMPT = `Tu es un expert en compréhension et analyse de comptes-rendus de réunion. Tu dois comprendre le texte comme un humain le ferait : saisir le contexte, les implications, les relations entre les éléments, même si le texte est mal formaté, incomplet ou ambigu.

APPROCHE INTELLIGENTE :
- Comprends le CONTEXTE global de la réunion avant d'extraire les détails
- Identifie les RELATIONS entre les éléments (cette action découle de cette décision, ce risque concerne cette action, etc.)
- Détecte les IMPLICATIONS même si elles ne sont pas explicitement écrites
- Reconnais les PATTERNS de langage (même si mal écrits : "on va faire X" = action, "on a décidé Y" = décision)
- Comprends les RÉFÉRENCES implicites ("le document" = quel document ? Cherche dans le contexte)
- Identifie les RESPONSABLES même s'ils sont mentionnés différemment ("Jean", "M. Dupont", "l'équipe de Jean")

RÈGLES STRICTES MAIS INTELLIGENTES :
1. NE JAMAIS INVENTER : Si une info n'est vraiment pas dans le texte, utiliser null. MAIS tu peux DÉDUIRE du contexte si c'est évident.
2. Dates : 
   - Si explicite ("15 mars 2024", "le 20/03/24"), parser en ISO YYYY-MM-DD
   - Si relative ("semaine prochaine", "dans 3 jours", "lundi prochain"), calculer la date si possible, sinon mettre dans due_date_raw
   - Si événement ("avant la réunion", "après validation"), mettre dans due_date_raw
3. Responsables :
   - Cherche activement : noms propres, fonctions ("le directeur", "l'équipe marketing"), pronoms avec contexte ("il" = qui ?)
   - Si vraiment absent mais déductible du contexte, utilise-le avec confidence="medium"
   - Si vraiment absent, owner = null
4. Evidence : Pour chaque item, extraire la phrase la plus pertinente du texte source qui justifie l'extraction (même si mal formatée)
5. Confidence : 
   - "high" : explicite et clair dans le texte
   - "medium" : déduit du contexte mais logique et probable
   - "low" : ambigu ou très incertain
6. Limites : max 10 actions, 10 décisions, 6 risques, 8 questions, 8 next_steps
7. PRIORISATION : Extrais d'abord les éléments les plus importants et actionnables

DÉFINITIONS CONTEXTUELLES :
- DÉCISION : 
  * Ce qui a été acté, validé, approuvé collectivement
  * Formulations : "Nous avons décidé", "Il a été convenu", "Validation de", "Approbation de", "On va faire X" (si c'est une décision stratégique)
  * Peut être implicite : si on parle d'un choix fait, même sans le mot "décision"
  
- ACTION : 
  * Tâche concrète, exécutable, avec verbe d'action + objet
  * Formulations : "Envoyer", "Préparer", "Jean va faire", "Il faut", "À faire", "Action :"
  * Peut être dans une liste, dans une phrase, ou implicite ("Le rapport sera envoyé" = action)
  * Priorité : détecte P0 (urgent/bloquant), P1 (important), P2 (normal), P3 (faible)
  * Statut : détecte si "fait", "en cours", "terminé" = done/in_progress, sinon todo
  
- RISQUE : 
  * Problème potentiel, blocage, danger, alerte
  * Formulations : "Risque de", "Attention à", "Blocage sur", "Problème avec", "Danger de"
  * Sévérité : détecte high (critique), medium (important), low (mineur)
  * Mitigation : cherche les solutions proposées ("mais on va faire X pour éviter")
  
- QUESTION : 
  * Point non tranché, information manquante, sujet à clarifier, doute
  * Formulations : "À définir", "Question", "À revoir", "À clarifier", "?", "Qui/Quoi/Quand/Comment"
  * Peut être implicite : si on mentionne un sujet "à discuter"
  
- NEXT_STEP : 
  * Étape future, sujet reporté, action planifiée pour plus tard
  * Formulations : "Prochaine étape", "À venir", "Sujet reporté", "Pour la suite", "Ensuite"

COMPRÉHENSION CONTEXTUELLE :
- Si le texte parle d'une réunion passée, adapte les dates en conséquence
- Si plusieurs personnes sont mentionnées, associe les actions aux bonnes personnes
- Si un sujet revient plusieurs fois, c'est probablement important
- Si une action est liée à une décision (même section ou proximité), note la relation
- Comprends les abréviations courantes ("CR" = compte-rendu, "RDV" = rendez-vous, etc.)

TRAITEMENT DU TEXTE MAL FORMATÉ :
- Phrases collées : sépare intelligemment en préservant le sens
- Pas de ponctuation : détecte quand même les phrases par les majuscules et le contexte
- Caractères spéciaux : ignore-les mais garde le sens
- Lignes mélangées : identifie les sections même si mal structurées
- Format libre : comprend même les notes prises à la volée, les listes à puces informelles

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
 * Répare les JSON malformés courants
 */
function repairJson(jsonText: string): string {
  // Remplacer les guillemets typographiques par des guillemets standards
  jsonText = jsonText.replace(/[""]/g, '"').replace(/['']/g, "'");
  
  // Corriger les virgules manquantes avant les accolades fermantes
  jsonText = jsonText.replace(/([^,}])\s*}/g, "$1}");
  
  // Corriger les virgules manquantes avant les crochets fermants
  jsonText = jsonText.replace(/([^,\]])\s*]/g, "$1]");
  
  // Supprimer les virgules en fin de tableau/objet
  jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1");
  
  return jsonText;
}

/**
 * Réparation agressive du JSON (dernier recours)
 */
function repairJsonAggressively(jsonText: string): string {
  // Supprimer tout ce qui est avant le premier {
  const firstBrace = jsonText.indexOf("{");
  if (firstBrace > 0) {
    jsonText = jsonText.substring(firstBrace);
  }
  
  // Supprimer tout ce qui est après le dernier }
  const lastBrace = jsonText.lastIndexOf("}");
  if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
    jsonText = jsonText.substring(0, lastBrace + 1);
  }
  
  // Appliquer les réparations de base
  return repairJson(jsonText);
}

/**
 * Post-traite le texte nettoyé pour améliorer la détection de sections
 * Détecte les sections même si très mal formatées
 */
function enhanceTextForAnalysis(text: string): string {
  // Détecter et normaliser les titres de sections même mal formatés (avec ou sans ponctuation)
  const sectionPatterns = [
    // Décisions - très permissif
    { 
      pattern: /(?:^|\n)\s*(?:decisions?|décisions?|decision|décision)(?:\s+prises?)?\s*[:•\-\.]?\s*/gim, 
      replacement: "\n\n## DÉCISIONS\n" 
    },
    // Actions - très permissif
    { 
      pattern: /(?:^|\n)\s*(?:actions?|action|à\s+faire|à\s+réaliser|tâches?|taches?)\s*[:•\-\.]?\s*/gim, 
      replacement: "\n\n## ACTIONS\n" 
    },
    // Risques - très permissif
    { 
      pattern: /(?:^|\n)\s*(?:risques?|risque|problèmes?|problème|blocages?|blocage|alertes?|alerte)\s*[:•\-\.]?\s*/gim, 
      replacement: "\n\n## RISQUES\n" 
    },
    // Questions - très permissif
    { 
      pattern: /(?:^|\n)\s*(?:questions?|question|à\s+clarifier|à\s+définir|points?\s+(?:à|a)\s+clarifier|points?\s+(?:à|a)\s+définir)\s*[:•\-\.]?\s*/gim, 
      replacement: "\n\n## QUESTIONS\n" 
    },
    // Next steps - très permissif
    { 
      pattern: /(?:^|\n)\s*(?:prochaines?\s+étapes?|prochaine\s+étape|à\s+venir|next\s+steps?|next\s+step|suite|pour\s+la\s+suite)\s*[:•\-\.]?\s*/gim, 
      replacement: "\n\n## PROCHAINES ÉTAPES\n" 
    },
  ];

  let enhanced = text;
  for (const { pattern, replacement } of sectionPatterns) {
    enhanced = enhanced.replace(pattern, replacement);
  }

  // Normaliser les séparateurs de liste (même mal formatés)
  enhanced = enhanced.replace(/(?:^|\n)\s*[-•*◦▪▫→➜➤✓☐☑▸▹▻►▶\u2022\u2023\u2043\u204C\u204D\u2219\u25E6]+[\s\u00A0]*/gm, "\n- ");
  enhanced = enhanced.replace(/(?:^|\n)\s*\d+[\.\)]\s*/gm, "\n1. ");

  // Détecter les listes implicites (lignes qui commencent par un verbe d'action)
  // Exemple: "Envoyer le rapport\nPréparer la présentation" -> liste d'actions
  const actionVerbs = ["envoyer", "préparer", "faire", "créer", "mettre", "organiser", "planifier", "développer", "finaliser", "valider", "vérifier"];
  actionVerbs.forEach((verb) => {
    const regex = new RegExp(`(?:^|\n)(${verb}[^\\n]*)`, "gim");
    enhanced = enhanced.replace(regex, (match) => {
      // Si la ligne précédente n'est pas déjà une liste, ajouter une puce
      const beforeMatch = enhanced.substring(0, enhanced.indexOf(match));
      if (!beforeMatch.match(/\n[-•*]\s/)) {
        return `\n- ${match.trim()}`;
      }
      return match;
    });
  });

  return enhanced;
}

/**
 * Analyse un compte-rendu avec IA (ou mock si pas de clé)
 */
export async function analyzeMeeting(rawText: string): Promise<{
  cleanedText: string;
  extracted: MeetingExtraction;
}> {
  const cleanedText = normalizeText(rawText);
  const enhancedText = enhanceTextForAnalysis(cleanedText);

  // Essayer d'utiliser le LLM si configuré
  try {
    const provider = detectLLMProvider();
    
    if (provider !== "none") {
      // Utiliser le texte amélioré pour l'analyse
      const prompt = EXTRACTION_PROMPT.replace("{{MEETING_TEXT}}", enhancedText);
      const llmResponse = await callLLMForExtraction(prompt, provider);

      // Parser et valider le JSON avec gestion d'erreurs robuste
      let parsed: unknown;
      if (typeof llmResponse === "string") {
        // Nettoyer le texte avant parsing
        let jsonText = llmResponse.trim();
        
        // Extraire le JSON du texte si nécessaire (peut avoir du texte autour)
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        // Essayer de réparer les JSON malformés courants
        jsonText = repairJson(jsonText);
        
        try {
          parsed = JSON.parse(jsonText);
        } catch (parseError) {
          console.warn("Erreur parsing JSON, tentative de réparation:", parseError);
          // Dernière tentative : essayer de réparer plus agressivement
          jsonText = repairJsonAggressively(jsonText);
          try {
            parsed = JSON.parse(jsonText);
          } catch {
            throw new Error("Impossible de parser le JSON même après réparation");
          }
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
    cleanedText, // Retourner le texte nettoyé (pas l'enhanced pour l'affichage)
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

