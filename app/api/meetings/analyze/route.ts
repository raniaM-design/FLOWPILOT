import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { sanitizeMeetingText } from "@/lib/meetings/sanitize-text";
import { convertEditorContentToPlainText } from "@/lib/meetings/convert-editor-content";
import { extractSections } from "@/lib/meetings/extract-sections";

/**
 * API Route pour analyser un compte rendu de réunion
 * POST /api/meetings/analyze
 * Body: { meetingId: string, text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const body = await request.json();
    const { meetingId, text } = body;

    if (!meetingId || !text) {
      return NextResponse.json(
        { error: "meetingId et text sont requis" },
        { status: 400 }
      );
    }

    // Convertir le HTML en texte brut si nécessaire, puis sanitiser
    // Le texte peut déjà être du texte brut (venant du client) ou du HTML (venant de la DB)
    // convertEditorContentToPlainText gère les deux cas
    const plainText = convertEditorContentToPlainText(text);
    const sanitizedText = sanitizeMeetingText(plainText);

    // Vérifier que le meeting appartient à l'utilisateur
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

    // Vérifier si raw_notes a changé depuis la dernière analyse
    // Comparer avec le texte brut pour détecter les changements réels
    const notesChanged = convertEditorContentToPlainText(meeting.raw_notes) !== plainText;
    
    // Si les notes n'ont pas changé et qu'une analyse existe, retourner le résultat en cache
    if (!notesChanged && meeting.analysisJson && meeting.analyzedAt) {
      try {
        const cachedResult = JSON.parse(meeting.analysisJson);
        return NextResponse.json(cachedResult);
      } catch (error) {
        console.warn("Erreur parsing analysisJson en cache, nouvelle analyse nécessaire");
      }
    }

    // Utiliser le LLM si configuré, sinon fallback sur extraction basique
    // Note: sanitizedText est utilisé pour l'analyse (texte propre sans HTML)
    const { analyzeWithLLM } = await import("@/lib/meetings/llm-client");
    const analysisResult = await analyzeWithLLM(sanitizedText, analyzeMeetingText);

    // Sauvegarder le résultat dans la DB
    await prisma.meeting.updateMany({
      where: {
        id: meetingId,
        ownerId: userId,
      },
      data: {
        analysisJson: JSON.stringify(analysisResult),
        analyzedAt: new Date(),
        // Ne pas mettre à jour raw_notes ici car text peut être du texte brut
        // raw_notes reste le HTML original stocké en DB
      },
    });

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du compte rendu" },
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
  const sections = extractSections(t);
  
  // Utiliser les sections extraites (décisions, actions, next -> points_a_clarifier)
  // Combiner "next" et les points à clarifier existants pour une meilleure couverture
  const decisionsItems = sections.decisions;
  const actionsItems = sections.actions;
  // Combiner "next" (À venir) avec les points à clarifier pour une meilleure extraction
  const clarifyItems = [...sections.next];

  // 6) Déduplication avec Set sur la string normalisée
  const normalizeString = (s: string) => s.toLowerCase().trim();
  
  const uniqueDecisionsSet = new Set<string>();
  const decisions: Array<{
    decision: string;
    contexte: string;
    impact_potentiel: string;
  }> = [];
  
  for (const item of decisionsItems) {
    const normalized = normalizeString(item);
    if (!uniqueDecisionsSet.has(normalized) && item.length >= 5) {
      uniqueDecisionsSet.add(normalized);
      decisions.push({
        decision: item,
        contexte: "non précisé",
        impact_potentiel: "non précisé",
      });
    }
  }

  const uniqueActionsSet = new Set<string>();
  const actions: Array<{
    action: string;
    responsable: string;
    echeance: string;
  }> = [];
  
  for (const item of actionsItems) {
    const normalized = normalizeString(item);
    if (!uniqueActionsSet.has(normalized) && item.length >= 3) {
      uniqueActionsSet.add(normalized);
      actions.push({
        action: item,
        responsable: "non précisé",
        echeance: "non précisé",
      });
    }
  }

  const uniqueClarifySet = new Set<string>();
  const points_a_clarifier: string[] = [];
  
  for (const item of clarifyItems) {
    const normalized = normalizeString(item);
    if (!uniqueClarifySet.has(normalized) && item.length >= 3) {
      uniqueClarifySet.add(normalized);
      points_a_clarifier.push(item);
    }
  }

  // Note: extractSections gère déjà le fallback (met tout dans "points" si aucune section détectée)
  // Si aucune section n'a été trouvée, les items sont déjà dans sections.points
  // On peut utiliser sections.points pour améliorer l'extraction si nécessaire

  const uniqueDecisions = decisions;
  const uniqueActions = actions;
  const uniquePoints = points_a_clarifier;

  return {
    decisions: uniqueDecisions.slice(0, 20), // Limiter à 20
    actions: uniqueActions.slice(0, 30), // Limiter à 30
    points_a_clarifier: uniquePoints.slice(0, 15), // Limiter à 15
  };
}

