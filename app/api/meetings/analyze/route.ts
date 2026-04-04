import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { sanitizeMeetingText } from "@/lib/meetings/sanitize-text";
import { convertEditorContentToPlainText } from "@/lib/meetings/convert-editor-content";
import { extractSections } from "@/lib/meetings/extract-sections";
import { extractFromUnstructuredText } from "@/lib/meetings/extract-from-unstructured";
import { extractResponsible, extractDueDate, extractContext, extractImpact } from "@/lib/meetings/extract-metadata";
import { parseStructuredList, extractMetadataFromContext, ParsedItem } from "@/lib/meetings/parse-structured-list";
import { filterValidItems, isMetadataLabel, isMetadataValue } from "@/lib/meetings/filter-items";
import { getBuiltinTemplateById } from "@/lib/meetings/notes-templates";
import { resolveMeetingTemplateHints } from "@/lib/meetings/resolve-template-hints";

function normalizePresetInput(input: unknown): string | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input !== "string") return null;
  return getBuiltinTemplateById(input) ? input : null;
}

/**
 * API Route pour analyser un compte rendu de réunion
 * POST /api/meetings/analyze
 * Body: { meetingId, text?, htmlContent?, notesTemplatePreset?, notesCustomTemplateId? }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const body = await request.json();
    const {
      meetingId,
      text,
      htmlContent,
      notesTemplatePreset,
      notesCustomTemplateId,
    } = body as {
      meetingId?: string;
      text?: string;
      htmlContent?: string;
      notesTemplatePreset?: string | null;
      notesCustomTemplateId?: string | null;
    };

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId est requis" }, { status: 400 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ownerId: userId,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Réunion non trouvée ou accès non autorisé" },
        { status: 404 }
      );
    }

    const rawNotesHtml =
      typeof htmlContent === "string" ? htmlContent : meeting.raw_notes ?? "";

    const prevPreset = meeting.notesTemplatePreset ?? null;
    const prevCustom = meeting.notesCustomTemplateId ?? null;

    let nextPreset = prevPreset;
    let nextCustom = prevCustom;

    if (notesTemplatePreset !== undefined) {
      nextPreset = normalizePresetInput(notesTemplatePreset);
    }
    if (notesCustomTemplateId !== undefined) {
      if (notesCustomTemplateId === null || notesCustomTemplateId === "") {
        nextCustom = null;
      } else if (typeof notesCustomTemplateId === "string") {
        const tpl = await prisma.meetingNotesTemplate.findFirst({
          where: { id: notesCustomTemplateId, userId: meeting.ownerId },
        });
        if (!tpl) {
          return NextResponse.json(
            { error: "Modèle de compte rendu inconnu ou non autorisé" },
            { status: 400 },
          );
        }
        nextCustom = notesCustomTemplateId;
      }
    }

    const plainText =
      typeof text === "string" && text.trim() !== ""
        ? text
        : convertEditorContentToPlainText(rawNotesHtml);
    if (!plainText.trim()) {
      return NextResponse.json(
        { error: "Compte rendu vide : ajoutez du contenu avant d’analyser." },
        { status: 400 }
      );
    }
    const sanitizedText = sanitizeMeetingText(plainText);

    const oldPlain = convertEditorContentToPlainText(meeting.raw_notes);
    const notesChanged = oldPlain !== plainText;
    const templateChanged = nextPreset !== prevPreset || nextCustom !== prevCustom;

    await prisma.meeting.updateMany({
      where: { id: meetingId, ownerId: userId },
      data: {
        raw_notes: rawNotesHtml,
        notesTemplatePreset: nextPreset,
        notesCustomTemplateId: nextCustom,
      },
    });

    // Si les notes et le modèle n’ont pas changé et qu’une analyse existe, retourner le cache
    if (!notesChanged && !templateChanged && meeting.analysisJson && meeting.analyzedAt) {
      try {
        const cachedResult = JSON.parse(meeting.analysisJson);
        return NextResponse.json(cachedResult);
      } catch (error) {
        console.warn("Erreur parsing analysisJson en cache, nouvelle analyse nécessaire");
      }
    }

    const hints = await resolveMeetingTemplateHints(
      meeting.ownerId,
      nextPreset,
      nextCustom,
    );

    // Utiliser le LLM si configuré, sinon fallback sur extraction basique
    console.log("[meetings/analyze] Démarrage de l'analyse:", {
      meetingId,
      textLength: sanitizedText.length,
      textPreview: sanitizedText.substring(0, 100) + "...",
      templatePreset: nextPreset,
      templateCustom: nextCustom,
    });

    const { analyzeWithLLM } = await import("@/lib/meetings/llm-client");
    const analysisResult = await analyzeWithLLM(sanitizedText, analyzeMeetingText, {
      templateSystemAddendum: hints.systemAddendum || undefined,
    });

    console.log("[meetings/analyze] Résultat de l'analyse:", {
      decisionsCount: analysisResult.decisions?.length || 0,
      actionsCount: analysisResult.actions?.length || 0,
      clarifyCount: analysisResult.points_a_clarifier?.length || 0,
      nextCount: analysisResult.points_a_venir?.length || 0,
    });

    await prisma.meeting.updateMany({
      where: {
        id: meetingId,
        ownerId: userId,
      },
      data: {
        analysisJson: JSON.stringify(analysisResult),
        analyzedAt: new Date(),
      },
    });

    // Marquer automatiquement l'étape d'onboarding "analyze_meeting" comme complétée
    try {
      const { checkMeetingAnalysis } = await import("@/lib/onboarding/autoCompleteSteps");
      await checkMeetingAnalysis(userId);
    } catch (error) {
      // Ne pas bloquer l'analyse si l'onboarding échoue
      console.error("Erreur lors de la mise à jour de l'onboarding:", error);
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'analyse du compte rendu: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Analyse le texte d'un compte rendu de réunion (fallback basique)
 * Utilisée quand aucun LLM n'est configuré
 */
export async function analyzeMeetingText(text: string): Promise<{
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
  points_a_venir: string[];
}> {
  // V1: Extraction basique avec détection de sections
  // En production, utiliser un LLM avec un prompt structuré

  // 1) Normaliser le texte de manière robuste
  function normalizeText(input: string): string {
    // Remplacer tous les types de retours à la ligne par \n
    let normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    
    // Normaliser les espaces insécables et autres caractères d'espace Unicode
    normalized = normalized.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");
    
    // Remplacer les tabulations par des espaces
    normalized = normalized.replace(/\t/g, " ");
    
    // Remplacer les espaces multiples par un seul espace
    normalized = normalized.replace(/[ \t]+/g, " ");
    
    // Normaliser les retours à la ligne multiples (max 2 consécutifs)
    normalized = normalized.replace(/\n{3,}/g, "\n\n");
    
    // Supprimer les caractères de contrôle invisibles (sauf \n)
    normalized = normalized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
    
    // Nettoyer les espaces en début/fin de ligne
    normalized = normalized.split("\n").map(line => line.trim()).join("\n");
    
    // Supprimer les lignes vides en début/fin
    return normalized.trim();
  }

  const t = normalizeText(text);

  // 2) Utiliser extractSections pour améliorer la détection des sections
  // Cette fonction détecte les variantes de titres et extrait les sections correctement
  let sections;
  try {
    sections = extractSections(t);
  } catch (error) {
    console.error("Erreur lors de l'extraction des sections:", error);
    // Fallback : sections vides
    sections = { points: [], decisions: [], actions: [], next: [] };
  }
  
  // 3) Parser les listes structurées pour extraire les métadonnées associées
  const lines = t.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  
  // 3.5) Fonction pour chercher les responsables/échéances dans les sections précédentes (ex: "Points abordés")
  // Cette fonction améliore l'extraction en cherchant dans tout le texte, pas seulement dans la section Actions
  const findContextualMetadata = (actionText: string, allLines: string[]): { responsable?: string; echeance?: string } => {
    const actionLower = actionText.toLowerCase().trim();
    const result: { responsable?: string; echeance?: string } = {};
    
    // Chercher dans toutes les lignes pour trouver des mentions de cette action avec responsable/échéance
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].toLowerCase();
      
      // Si la ligne contient des mots-clés de l'action ET un nom propre ou une date
      const actionKeywords = actionText.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3);
      const hasActionKeywords = actionKeywords.some(keyword => line.includes(keyword));
      
      if (hasActionKeywords) {
        // Chercher un responsable dans cette ligne
        const responsibleMatch = line.match(/([a-z]+(?:\s+[a-z]+)?)\s+(?:va|vont|fera|feront|doit|doivent|interviendra|interviendront|s'occupe|s'occupent|a\s+proposé|interviendra)/i);
        if (responsibleMatch && !result.responsable) {
          const name = responsibleMatch[1];
          if (name && name.length > 2 && name.length < 30) {
            result.responsable = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          }
        }
        
        // Chercher une échéance dans cette ligne ou la suivante
        const dueDateMatch = line.match(/(?:à\s+partir\s+de|pour|avant|le|mardi|mercredi|jeudi|vendredi|lundi|samedi|dimanche|semaine|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\d{1,2})/i);
        if (dueDateMatch && !result.echeance) {
          // Extraire la partie pertinente
          const datePart = line.substring(Math.max(0, dueDateMatch.index! - 10), Math.min(line.length, dueDateMatch.index! + 50));
          if (datePart.length > 5) {
            result.echeance = datePart.trim();
          }
        }
      }
    }
    
    return result;
  };
  
  // Trouver les indices des sections (avec nettoyage des puces)
  const cleanLineForSearch = (line: string) => line.replace(/^[\s\u00A0]*[-•*◦▪▫→➜➤✓☐☑✓▸▹▻►▶▪▫\u2022\u2023\u2043\u204C\u204D\u2219\u25E6\u25AA\u25AB\u25CF\u25CB\u25A1\u25A0]+[\s\u00A0]*/u, "").trim();
  
  const decisionsStart = lines.findIndex(line => {
    const cleaned = cleanLineForSearch(line);
    // Accepte les numéros devant : "3. Décisions prises"
    return /^(?:\d+[\.\)]\s*)?(?:decisions?|décisions?)(?:\s+prises?)?\s*:?\s*$/i.test(cleaned);
  });
  const actionsStart = lines.findIndex(line => {
    const cleaned = cleanLineForSearch(line);
    // Accepte les numéros devant et "mener" : "4. Actions à mener"
    return /^(?:\d+[\.\)]\s*)?(?:actions?|action\s+items?)(?:\s+(?:à|a)\s*(?:réaliser|faire|suivre|effectuer|traiter|engager|mener))?\s*:?\s*$/i.test(cleaned);
  });
  const nextStart = lines.findIndex(line => {
    const cleaned = cleanLineForSearch(line);
    // Accepte les numéros devant : "6. Prochaine réunion"
    return /^(?:\d+[\.\)]\s*)?(?:(?:à|a)\s+venir|sujets?\s+(?:à|a)\s+venir|points?\s+(?:à|a)\s+venir|sujets?\s+(?:à|a)\s+traiter|points?\s+(?:à|a)\s+discuter|prochaines?\s+étapes?|prochaine\s+réunion)\s*:?\s*$/i.test(cleaned);
  });
  
  // Extraire les lignes de chaque section
  const decisionsLines: string[] = [];
  const actionsLines: string[] = [];
  
  if (decisionsStart !== -1) {
    const endIdx = actionsStart !== -1 ? actionsStart : (nextStart !== -1 ? nextStart : lines.length);
    decisionsLines.push(...lines.slice(decisionsStart + 1, endIdx));
  }
  
  if (actionsStart !== -1) {
    const endIdx = nextStart !== -1 ? nextStart : lines.length;
    actionsLines.push(...lines.slice(actionsStart + 1, endIdx));
  }
  
  // Parser les listes structurées
  const parsedDecisions = parseStructuredList(decisionsLines);
  const parsedActions = parseStructuredList(actionsLines);
  
  // Utiliser les sections extraites (décisions, actions, next -> points_a_clarifier)
  // Combiner "next" (À venir / Prochaines étapes) avec les points à clarifier
  let decisionsItems = (sections && Array.isArray(sections.decisions)) ? sections.decisions : [];
  let actionsItems = (sections && Array.isArray(sections.actions)) ? sections.actions : [];
  const clarifyItems = (sections && Array.isArray(sections.next)) ? [...sections.next] : [];
  
  // Enrichir avec les métadonnées parsées si disponibles
  // Prioriser les items parsés car ils ont les métadonnées associées
  if (parsedDecisions.length > 0) {
    const parsedTexts = parsedDecisions.map(item => item.text).filter(text => text && text.length >= 5 && filterValidItems([text]).length > 0);
    if (parsedTexts.length > 0) {
      decisionsItems = parsedTexts;
    }
  }
  if (parsedActions.length > 0) {
    const parsedTexts = parsedActions.map(item => item.text).filter(text => text && text.length >= 3 && filterValidItems([text]).length > 0);
    if (parsedTexts.length > 0) {
      actionsItems = parsedTexts;
    }
  }
  
  // Si aucune action n'a été trouvée mais qu'il y a une section "Actions", essayer d'extraire depuis les lignes brutes
  if (actionsItems.length === 0 && actionsStart !== -1 && actionsLines.length > 0) {
    try {
      const rawActionsLines = actionsLines.filter(line => {
        if (!line || typeof line !== "string") return false;
        const cleaned = line.trim();
        // Exclure les labels de métadonnées et headers
        if (isMetadataLabel(cleaned) || isMetadataValue(cleaned)) return false;
        if (/^(?:actions?|action\s+items?)(?:\s+(?:à|a)\s*(?:réaliser|faire|suivre|effectuer|traiter|engager))?\s*:?\s*$/i.test(cleaned)) return false;
        return cleaned.length >= 3;
      });
      if (rawActionsLines.length > 0) {
        actionsItems = rawActionsLines;
      }
    } catch (error) {
      console.warn("Erreur lors de l'extraction des actions depuis les lignes brutes:", error);
    }
  }

  // Fonction pour détecter si un item ressemble à une action plutôt qu'à une décision
  const looksLikeAction = (text: string, parsed?: ParsedItem): boolean => {
    const lowerText = text.toLowerCase().trim();
    
    // Si l'item a un responsable ou une échéance dans les métadonnées parsées, c'est probablement une action
    if (parsed && (parsed.responsible || parsed.dueDate)) {
      return true;
    }
    
    // Vérifier si le texte contient un responsable ou une échéance
    const hasResponsible = extractResponsible(text) !== "non précisé";
    const hasDueDate = extractDueDate(text) !== "non précisé";
    
    if (hasResponsible || hasDueDate) {
      return true;
    }
    
    // Vérifier les verbes d'action typiques (infinitif)
    const actionVerbs = [
      "faire", "préparer", "envoyer", "contacter", "réviser", "créer", "mettre",
      "organiser", "planifier", "développer", "implémenter", "finaliser", "compléter",
      "valider", "vérifier", "analyser", "présenter", "partager", "distribuer",
      "soumettre", "transmettre", "communiquer", "informer", "notifier", "alerter",
      "consulter", "examiner", "étudier", "évaluer", "tester", "déployer",
      "lancer", "démarrer", "initier", "commencer", "terminer", "finaliser",
      "mettre à jour", "actualiser", "modifier", "changer", "adapter", "ajuster",
      "résoudre", "corriger", "réparer", "améliorer", "optimiser", "renforcer"
    ];
    
    // Vérifier si le texte commence par un verbe d'action à l'infinitif
    for (const verb of actionVerbs) {
      if (lowerText.startsWith(verb + " ") || lowerText === verb) {
        return true;
      }
    }
    
    // Vérifier les patterns d'action avec "va", "doit", "devrait"
    const actionPatterns = [
      /^(?:[a-z]+\s+)?(?:va|doit|devrait|peut|pourrait)\s+(?:faire|préparer|envoyer|contacter|réviser|créer|mettre|organiser)/i,
      /^(?:[a-z]+\s+)?(?:va|doit|devrait|peut|pourrait)\s+[a-zéèêëàâäôöùûüç]+er/i,
      /^[A-Z][a-z]+\s+(?:va|doit|devrait|peut|pourrait)\s+/i, // "Jean va faire..."
    ];
    
    for (const pattern of actionPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    
    return false;
  };

  // 6) Déduplication avec Set sur la string normalisée
  const normalizeString = (s: string) => s.toLowerCase().trim();
  
  const uniqueDecisionsSet = new Set<string>();
  const decisions: Array<{
    decision: string;
    contexte: string;
    impact_potentiel: string;
  }> = [];
  
  // Associer les métadonnées parsées aux décisions
  const decisionsMap = new Map<string, ParsedItem>();
  parsedDecisions.forEach(parsed => {
    if (parsed.text && parsed.text.length >= 5) {
      decisionsMap.set(normalizeString(parsed.text), parsed);
    }
  });

  // Filtrer les items qui ressemblent à des actions dans la section Décisions
  const filteredDecisionsItems: string[] = [];
  for (const item of decisionsItems) {
    const normalized = normalizeString(item);
    const parsed = decisionsMap.get(normalized);
    
    // Exclure les items qui ressemblent à des actions
    if (!looksLikeAction(item, parsed)) {
      filteredDecisionsItems.push(item);
    }
  }

  // Fonction pour extraire le contexte proche pour les décisions
  const getDecisionContext = (item: string, itemIndex: number, itemsArray: string[]): string => {
    const contextLines: string[] = [];
    // Ajouter jusqu'à 2 lignes avant pour capturer le contexte
    for (let j = Math.max(0, itemIndex - 2); j < itemIndex; j++) {
      contextLines.push(itemsArray[j]);
    }
    contextLines.push(item);
    // Ajouter jusqu'à 2 lignes après
    for (let j = itemIndex + 1; j < Math.min(itemsArray.length, itemIndex + 3); j++) {
      contextLines.push(itemsArray[j]);
    }
    return contextLines.join(" ");
  };

  for (let i = 0; i < filteredDecisionsItems.length; i++) {
    const item = filteredDecisionsItems[i];
    const normalized = normalizeString(item);
    if (!uniqueDecisionsSet.has(normalized) && item.length >= 5 && filterValidItems([item]).length > 0) {
      uniqueDecisionsSet.add(normalized);
      
      // Chercher les métadonnées parsées
      const parsed = decisionsMap.get(normalized);
      
      // Extraire le contexte et l'impact depuis le texte avec contexte proche
      const contextText = getDecisionContext(item, i, filteredDecisionsItems);
      const contexte = parsed?.context || extractContext(contextText) || extractContext(item);
      const impact = parsed?.impact || extractImpact(contextText) || extractImpact(item);
      
      decisions.push({
        decision: item,
        contexte: contexte && contexte !== "non précisé" ? contexte : "non précisé",
        impact_potentiel: impact && impact !== "non précisé" ? impact : "non précisé",
      });
    }
  }

  const uniqueActionsSet = new Set<string>();
  const actions: Array<{
    action: string;
    responsable: string;
    echeance: string;
  }> = [];
  
  // Associer les métadonnées parsées aux actions
  const actionsMap = new Map<string, ParsedItem>();
  parsedActions.forEach(parsed => {
    if (parsed.text && parsed.text.length >= 3) {
      actionsMap.set(normalizeString(parsed.text), parsed);
    }
  });

  // Fonction pour extraire le contexte proche (lignes avant/après) pour une meilleure détection
  // Cherche aussi dans les lignes brutes du texte original pour capturer les responsables/échéances
  const getContextForItem = (item: string, itemIndex: number, itemsArray: string[], allLines: string[]): string => {
    const contextLines: string[] = [];
    
    // Trouver la position approximative de l'item dans les lignes originales
    const itemLower = item.toLowerCase().trim();
    let foundIndex = -1;
    for (let i = 0; i < allLines.length; i++) {
      if (allLines[i].toLowerCase().includes(itemLower.substring(0, Math.min(30, itemLower.length)))) {
        foundIndex = i;
        break;
      }
    }
    
    // Si trouvé, ajouter le contexte proche (3 lignes avant et après)
    if (foundIndex !== -1) {
      for (let j = Math.max(0, foundIndex - 3); j < Math.min(allLines.length, foundIndex + 4); j++) {
        contextLines.push(allLines[j]);
      }
    } else {
      // Fallback : utiliser les lignes de l'item
      if (itemIndex > 0) {
        contextLines.push(itemsArray[itemIndex - 1]);
      }
      contextLines.push(item);
      if (itemIndex < itemsArray.length - 1) {
        contextLines.push(itemsArray[itemIndex + 1]);
      }
    }
    
    return contextLines.join(" ");
  };

  for (let i = 0; i < actionsItems.length; i++) {
    const item = actionsItems[i];
    const normalized = normalizeString(item);
    if (!uniqueActionsSet.has(normalized) && item.length >= 3 && filterValidItems([item]).length > 0) {
      uniqueActionsSet.add(normalized);
      
      // Chercher les métadonnées parsées
      const parsed = actionsMap.get(normalized);
      
      // Extraire le responsable et l'échéance depuis le texte avec contexte proche
      const contextText = getContextForItem(item, i, actionsItems, lines);
      
      // Chercher aussi dans les sections précédentes (ex: "Points abordés")
      const contextualMetadata = findContextualMetadata(item, lines);
      
      const responsable = parsed?.responsible || 
                         contextualMetadata.responsable || 
                         extractResponsible(contextText) || 
                         extractResponsible(item);
      const echeance = parsed?.dueDate || 
                      contextualMetadata.echeance || 
                      extractDueDate(contextText) || 
                      extractDueDate(item);
      
      actions.push({
        action: item,
        responsable: responsable && responsable !== "non précisé" ? responsable : "non précisé",
        echeance: echeance && echeance !== "non précisé" ? echeance : "non précisé",
      });
    }
  }

  const uniqueClarifySet = new Set<string>();
  const points_a_clarifier: string[] = [];

  for (const item of clarifyItems) {
    const normalized = normalizeString(item);
    if (!uniqueClarifySet.has(normalized) && item.length >= 3 && filterValidItems([item]).length > 0) {
      uniqueClarifySet.add(normalized);
      points_a_clarifier.push(item);
    }
  }

  // Extraire les points à venir (section "À venir" / "Prochaines étapes")
  const points_a_venir: string[] = [];
  if (sections && sections.next && Array.isArray(sections.next)) {
    const nextItems = sections.next.filter((item) => {
      if (!item || typeof item !== "string") return false;
      const normalized = normalizeString(item);
      return item.length >= 5 && filterValidItems([item]).length > 0 && !isMetadataLabel(item) && !isMetadataValue(item);
    });
    const uniqueNextSet = new Set<string>();
    for (const item of nextItems) {
      const normalized = normalizeString(item);
      if (!uniqueNextSet.has(normalized)) {
        uniqueNextSet.add(normalized);
        points_a_venir.push(item);
      }
    }
  }

  // Note: extractSections gère déjà le fallback (met tout dans "points" si aucune section détectée)
  // Si aucune section explicite OU très peu d'éléments extraits, tenter une extraction heuristique
  // sur le texte brut (détection de décisions/actions implicites)
  const hasFewResults =
    decisions.length + actions.length + points_a_clarifier.length + points_a_venir.length < 2;

  if (hasFewResults && t.length > 50) {
    const unstructured = extractFromUnstructuredText(t);
    if (unstructured.decisions.length > 0 && decisions.length === 0) {
      for (const d of unstructured.decisions) {
        const norm = d.decision.toLowerCase().trim();
        if (!uniqueDecisionsSet.has(norm) && d.decision.length >= 5 && filterValidItems([d.decision]).length > 0) {
          uniqueDecisionsSet.add(norm);
          decisions.push(d);
        }
      }
    }
    if (unstructured.actions.length > 0 && actions.length === 0) {
      for (const a of unstructured.actions) {
        const norm = a.action.toLowerCase().trim();
        if (!uniqueActionsSet.has(norm) && a.action.length >= 3 && filterValidItems([a.action]).length > 0) {
          uniqueActionsSet.add(norm);
          actions.push(a);
        }
      }
    }
    if (unstructured.points_a_clarifier.length > 0 && points_a_clarifier.length === 0) {
      for (const p of unstructured.points_a_clarifier) {
        const norm = p.toLowerCase().trim();
        if (!uniqueClarifySet.has(norm) && p.length >= 3 && filterValidItems([p]).length > 0) {
          uniqueClarifySet.add(norm);
          points_a_clarifier.push(p);
        }
      }
    }
    if (unstructured.points_a_venir.length > 0 && points_a_venir.length === 0) {
      const uniqueNextSet = new Set<string>();
      for (const p of unstructured.points_a_venir) {
        const norm = p.toLowerCase().trim();
        if (!uniqueNextSet.has(norm) && p.length >= 5 && filterValidItems([p]).length > 0) {
          uniqueNextSet.add(norm);
          points_a_venir.push(p);
        }
      }
    }
  }

  const uniqueDecisions = decisions;
  const uniqueActions = actions;
  const uniquePoints = points_a_clarifier;

  return {
    decisions: uniqueDecisions.slice(0, 20), // Limiter à 20
    actions: uniqueActions.slice(0, 30), // Limiter à 30
    points_a_clarifier: uniquePoints.slice(0, 15), // Limiter à 15
    points_a_venir: points_a_venir.slice(0, 15), // Limiter à 15
  };
}

