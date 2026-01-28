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
  const existingDecisions = await prisma.decision.findMany({
    where: {
      projectId: defaultProject.id,
      createdById: userId,
    },
    select: {
      title: true,
    },
  });

  const existingDecisionTitles = new Set(
    existingDecisions.map(d => d.title.toLowerCase().trim())
  );

  // Créer les décisions (en évitant les doublons)
  const createdDecisions = [];
  for (const d of decisions) {
    const decisionTitleNormalized = d.decision.toLowerCase().trim();
    
    // Vérifier si une décision similaire existe déjà (protection idempotente)
    if (existingDecisionTitles.has(decisionTitleNormalized)) {
      // Décision déjà créée, ignorer pour éviter les doublons
      continue;
    }

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
    // Ajouter à l'ensemble pour éviter les doublons dans la même transaction
    existingDecisionTitles.add(decisionTitleNormalized);
  }

  // Créer les actions (liées au meeting et optionnellement à une décision)
  // Protection contre les doublons : vérifier si des actions similaires existent déjà pour ce meeting
  // Vérifier les actions existantes ET celles créées récemment (fenêtre de 5 secondes pour double-clic)
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  
  const existingActions = await prisma.actionItem.findMany({
    where: {
      meetingId: meetingId,
      projectId: defaultProject.id,
    },
    select: {
      title: true,
      createdAt: true,
    },
  });

  const existingActionTitles = new Set(
    existingActions.map(a => a.title.toLowerCase().trim())
  );

  // Vérifier s'il y a des actions créées récemment (dans les 5 dernières secondes)
  // pour détecter les cas de double-clic
  const recentActionTitles = new Set(
    existingActions
      .filter(action => action.createdAt && action.createdAt >= fiveSecondsAgo)
      .map(a => a.title.toLowerCase().trim())
  );

  let deduplicated = false;

  for (const action of actions) {
    // Vérifier si une action similaire existe déjà (protection idempotente)
    const actionTitleNormalized = action.action.toLowerCase().trim();
    
    // Vérifier si l'action existe déjà OU a été créée récemment (dans les 5 dernières secondes)
    if (existingActionTitles.has(actionTitleNormalized)) {
      // Action déjà créée, ignorer pour éviter les doublons
      // Marquer comme dédupliquée si c'était une action récente (double-clic probable)
      if (recentActionTitles.has(actionTitleNormalized)) {
        deduplicated = true;
      }
      continue;
    }

    // Essayer de trouver une décision correspondante (simple matching par mots-clés)
    let relatedDecisionId: string | undefined;
    if (createdDecisions.length > 0) {
      const matchingDecision = createdDecisions.find((d) =>
        action.action.toLowerCase().includes(
          d.title.toLowerCase().substring(0, 10)
        )
      );
      if (matchingDecision) {
        relatedDecisionId = matchingDecision.id;
      }
    }

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
    existingActionTitles.add(actionTitleNormalized);
  }

  revalidatePath("/app/meetings");
  revalidatePath("/app/decisions");
  revalidatePath("/app/actions");
  revalidatePath("/app");

  // Retourner un indicateur de déduplication si des doublons ont été évités
  return deduplicated ? { deduplicated: true } : {};
}

