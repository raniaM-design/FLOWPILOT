"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createDecisionsAndActionsFromMeeting(
  meetingId: string,
  decisions: Array<{
    decision: string;
    contexte: string;
    impact_potentiel: string;
  }>,
  actions: Array<{
    action: string;
    responsable: string;
    echeance: string;
  }>
): Promise<{ deduplicated?: boolean }> {
  const userId = await getCurrentUserIdOrThrow();

  // Vérifier que le meeting appartient à l'utilisateur
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      ownerId: userId,
    },
    select: {
      id: true,
      projectId: true,
      context: true,
    },
  });

  if (!meeting) {
    throw new Error("Réunion non trouvée ou accès non autorisé");
  }

  // Récupérer le projet lié à la réunion, ou un projet par défaut
  let defaultProject = null;

  // Si la réunion a un projet associé, l'utiliser
  if (meeting.projectId) {
    defaultProject = await prisma.project.findFirst({
      where: {
        id: meeting.projectId,
        ownerId: userId,
      },
    });
  }

  // Sinon, utiliser le premier projet actif de l'utilisateur
  if (!defaultProject) {
    defaultProject = await prisma.project.findFirst({
      where: {
        ownerId: userId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Si aucun projet n'existe, créer un projet par défaut
  if (!defaultProject) {
    defaultProject = await prisma.project.create({
      data: {
        ownerId: userId,
        name: meeting.context || "Réunions",
        description: "Projet créé automatiquement depuis les réunions",
        status: "ACTIVE",
      },
    });
  }

  // Protection contre les doublons : vérifier si des décisions similaires existent déjà pour ce projet
  // Récupérer toutes les décisions du projet (pas seulement celles créées par l'utilisateur)
  const existingDecisionsForProject = await prisma.decision.findMany({
    where: {
      projectId: defaultProject.id,
    },
    select: {
      id: true,
      title: true,
    },
  });

  // Créer un map pour retrouver rapidement les décisions par titre normalisé
  const existingDecisionsMap = new Map<string, typeof existingDecisionsForProject[0]>();
  existingDecisionsForProject.forEach(decision => {
    const normalizedTitle = decision.title.toLowerCase().trim();
    if (!existingDecisionsMap.has(normalizedTitle)) {
      existingDecisionsMap.set(normalizedTitle, decision);
    }
  });

  // Créer les décisions (en évitant les doublons) et garder trace des décisions utilisées
  const createdDecisions = [];
  const usedDecisions: Array<{ id: string; title: string }> = [];
  
  for (const d of decisions) {
    const decisionTitleNormalized = d.decision.toLowerCase().trim();
    const existingDecision = existingDecisionsMap.get(decisionTitleNormalized);
    
    // Vérifier si une décision similaire existe déjà
    if (existingDecision) {
      // Décision déjà existante, l'ajouter à la liste des décisions utilisées pour relier les actions
      usedDecisions.push(existingDecision);
      continue;
    }

    // Créer une nouvelle décision
    const newDecision = await prisma.decision.create({
      data: {
        projectId: defaultProject.id,
        createdById: userId,
        title: d.decision,
        context: d.contexte !== "Extrait du compte rendu" ? d.contexte : null,
        decision: d.decision,
        status: "DECIDED",
      },
    });

    createdDecisions.push(newDecision);
    usedDecisions.push({ id: newDecision.id, title: newDecision.title });
    // Ajouter à l'ensemble pour éviter les doublons dans la même transaction
    existingDecisionsMap.set(decisionTitleNormalized, { id: newDecision.id, title: newDecision.title });
  }

  // Créer les actions (liées au meeting et optionnellement à une décision)
  // Protection contre les doublons : vérifier si des actions similaires existent déjà pour ce projet
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  
  // Récupérer toutes les actions existantes du projet (pas seulement du meeting)
  const existingProjectActions = await prisma.actionItem.findMany({
    where: {
      projectId: defaultProject.id,
    },
    select: {
      id: true,
      title: true,
      decisionId: true,
      meetingId: true,
      dueDate: true,
      createdAt: true,
    },
  });
  
  // Combiner les décisions existantes avec les décisions créées pour le matching
  // Utiliser usedDecisions qui contient à la fois les existantes et les créées
  // Éviter les doublons en utilisant un Set basé sur les IDs
  const allDecisionsForMatchingMap = new Map<string, { id: string; title: string }>();
  existingDecisionsForProject.forEach(d => allDecisionsForMatchingMap.set(d.id, d));
  usedDecisions.forEach(d => allDecisionsForMatchingMap.set(d.id, d));
  const allDecisionsForMatching = Array.from(allDecisionsForMatchingMap.values());

  // Créer un map pour retrouver rapidement les actions par titre normalisé
  const existingActionsMap = new Map<string, typeof existingProjectActions[0]>();
  existingProjectActions.forEach(action => {
    const normalizedTitle = action.title.toLowerCase().trim();
    if (!existingActionsMap.has(normalizedTitle)) {
      existingActionsMap.set(normalizedTitle, action);
    }
  });

  // Vérifier s'il y a des actions créées récemment (dans les 5 dernières secondes)
  // pour détecter les cas de double-clic
  const recentActionTitles = new Set(
    existingProjectActions
      .filter(action => action.createdAt && action.createdAt >= fiveSecondsAgo)
      .map(a => a.title.toLowerCase().trim())
  );

  let deduplicated = false;

  for (const action of actions) {
    const actionTitleNormalized = action.action.toLowerCase().trim();
    const existingAction = existingActionsMap.get(actionTitleNormalized);
    
    // Si une action similaire existe déjà pour le projet
    if (existingAction) {
      // Si c'était une action récente (double-clic probable), marquer comme dédupliquée
      if (recentActionTitles.has(actionTitleNormalized)) {
        deduplicated = true;
      }
      
      // Si l'action n'est pas déjà liée à ce meeting, la relier
      if (existingAction.meetingId !== meetingId) {
        // Essayer de trouver une décision correspondante parmi toutes les décisions du projet
        let relatedDecisionId = existingAction.decisionId || undefined;
        
        // Si pas de décision liée, chercher parmi toutes les décisions
        if (!relatedDecisionId) {
          const matchingDecision = allDecisionsForMatching.find((d) =>
            action.action.toLowerCase().includes(
              d.title.toLowerCase().substring(0, 10)
            )
          );
          if (matchingDecision) {
            relatedDecisionId = matchingDecision.id;
          }
        }
        
        // Mettre à jour l'action existante pour la relier au meeting et à la décision si trouvée
        await prisma.actionItem.update({
          where: {
            id: existingAction.id,
          },
          data: {
            meetingId: meetingId,
            decisionId: relatedDecisionId || existingAction.decisionId,
            // Mettre à jour la dueDate si elle n'existe pas encore et qu'une nouvelle est fournie
            dueDate: existingAction.dueDate || (action.echeance && action.echeance !== "non précisé" 
              ? (() => {
                  const dateMatch = action.echeance.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
                  if (dateMatch) {
                    const [day, month, year] = dateMatch[0].split("/").map(Number);
                    return new Date(year, month - 1, day);
                  }
                  return null;
                })()
              : null),
          },
        });
      }
      // Si l'action est déjà liée à ce meeting, ne rien faire (éviter les doublons)
      continue;
    }

    // Aucune action similaire trouvée, créer une nouvelle action
    // Essayer de trouver une décision correspondante parmi toutes les décisions du projet
    const matchingDecision = allDecisionsForMatching.find((d) =>
      action.action.toLowerCase().includes(
        d.title.toLowerCase().substring(0, 10)
      )
    );
    const relatedDecisionId = matchingDecision?.id;

    // Parser l'échéance si présente
    let dueDate: Date | null = null;
    if (action.echeance && action.echeance !== "non précisé") {
      // Tentative de parsing simple (à améliorer)
      const dateMatch = action.echeance.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[0].split("/").map(Number);
        dueDate = new Date(year, month - 1, day);
      }
    }

    const newAction = await prisma.actionItem.create({
      data: {
        projectId: defaultProject.id,
        decisionId: relatedDecisionId,
        meetingId: meetingId,
        createdById: userId,
        assigneeId: userId, // V1: assigner à l'utilisateur courant
        title: action.action,
        description: action.responsable !== "non précisé" 
          ? `Responsable: ${action.responsable}` 
          : null,
        status: "TODO",
        dueDate,
      },
    });

    // Ajouter à l'ensemble pour éviter les doublons dans la même transaction
    existingActionsMap.set(actionTitleNormalized, {
      id: newAction.id,
      title: newAction.title,
      decisionId: newAction.decisionId,
      meetingId: newAction.meetingId,
      dueDate: newAction.dueDate,
      createdAt: newAction.createdAt,
    });
  }

  revalidatePath("/app/meetings");
  revalidatePath("/app/decisions");
  revalidatePath("/app/actions");
  revalidatePath("/app");

  // Retourner un indicateur de déduplication si des doublons ont été évités
  return deduplicated ? { deduplicated: true } : {};
}

