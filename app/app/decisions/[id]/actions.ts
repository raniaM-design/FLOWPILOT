"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canAccessProject, getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

/**
 * Résultat de la mise à jour du statut d'une décision
 * Decision Guardrail : retourne un warning si non exécutable mais autorise toujours le changement
 */
export type UpdateDecisionStatusResult = {
  ok: true;
  isExecutable: boolean;
  warning?: {
    code: "DECISION_NOT_EXECUTABLE";
    reasons: ("NO_ACTION" | "MISSING_DUE_DATE")[];
  };
};

/**
 * Mettre à jour le statut d'une décision
 * Decision Guardrail : autorise toujours DECIDED mais retourne un warning si non exécutable
 */
export async function updateDecisionStatus(
  decisionId: string,
  status: "DRAFT" | "DECIDED" | "ARCHIVED"
): Promise<UpdateDecisionStatusResult> {
  const userId = await getCurrentUserIdOrThrow();

  // Vérifier que la décision existe et que l'utilisateur y a accès
  const decision = await prisma.decision.findFirst({
    where: {
      id: decisionId,
    },
    include: {
      project: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!decision) {
    throw new Error("Décision non trouvée");
  }

  // Vérifier l'accès au projet
  const hasAccess = await canAccessProject(userId, decision.project.id);
  if (!hasAccess) {
    throw new Error("Accès non autorisé");
  }

  // Decision Guardrail : calculer isExecutable avant de passer en DECIDED
  let isExecutable = true;
  const warningReasons: ("NO_ACTION" | "MISSING_DUE_DATE")[] = [];

  if (status === "DECIDED") {
    // Récupérer toutes les actions liées à cette décision
    const actions = await prisma.actionItem.findMany({
      where: {
        decisionId: decisionId,
        projectId: decision.project.id,
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
      },
    });

    // Vérifier qu'il y a au moins une action
    if (actions.length === 0) {
      isExecutable = false;
      warningReasons.push("NO_ACTION");
    }

    // Vérifier que toutes les actions ont une dueDate
    const actionsWithoutDueDate = actions.filter((action: { id: string; title: string; dueDate: Date | null }) => !action.dueDate);
    if (actionsWithoutDueDate.length > 0) {
      isExecutable = false;
      warningReasons.push("MISSING_DUE_DATE");
    }
  }

  // Mettre à jour le statut (toujours autorisé, même si non exécutable)
  await prisma.decision.update({
    where: {
      id: decisionId,
    },
    data: {
      status,
    },
  });

  // Revalider les pages concernées
  revalidatePath(`/app/decisions/${decisionId}`);
  revalidatePath(`/app/projects/${decision.projectId}`);
  revalidatePath("/app");

  // Retourner le résultat avec warning si non exécutable
  const result: UpdateDecisionStatusResult = {
    ok: true,
    isExecutable,
  };

  if (!isExecutable && warningReasons.length > 0) {
    result.warning = {
      code: "DECISION_NOT_EXECUTABLE",
      reasons: warningReasons,
    };
  }

  return result;
}

/**
 * Résultat de la création d'une action pour une décision
 */
export type CreateActionForDecisionResult = {
  ok: true;
  warning?: "MISSING_DUE_DATE";
  actionLinked?: boolean; // true si une action existante a été reliée, false si une nouvelle action a été créée
};

/**
 * Créer une action depuis la page décision
 */
export async function createActionForDecision(formData: FormData): Promise<CreateActionForDecisionResult> {
  const userId = await getCurrentUserIdOrThrow();

  const decisionId = String(formData.get("decisionId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueDateStr = String(formData.get("dueDate") ?? "").trim();
  const mentionedUserIdsStr = String(formData.get("mentionedUserIds") ?? "").trim();
  const mentionedUserIds = mentionedUserIdsStr ? mentionedUserIdsStr.split(",").filter(Boolean) : [];
  
  // Fonction helper pour créer les mentions
  const createMentions = async (actionId: string, userIds: string[]) => {
    if (userIds.length === 0) return;
    
    // Créer les mentions (ignorer les doublons avec createMany + skipDuplicates)
    await prisma.actionMention.createMany({
      data: userIds.map((uid) => ({
        actionId,
        userId: uid,
      })),
      skipDuplicates: true,
    });
  };

  // Validation
  if (!decisionId) {
    throw new Error("ID de la décision manquant");
  }

  if (!title || title.length < 2) {
    throw new Error("Le titre doit contenir au moins 2 caractères");
  }

  // Vérifier que la décision existe et que l'utilisateur y a accès
  const decision = await prisma.decision.findFirst({
    where: {
      id: decisionId,
    },
    include: {
      project: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!decision) {
    throw new Error("Décision non trouvée");
  }

  // Vérifier l'accès au projet
  const hasAccess = await canAccessProject(userId, decision.project.id);
  if (!hasAccess) {
    throw new Error("Accès non autorisé");
  }

  // Parser la date si fournie
  let dueDate: Date | null = null;
  if (dueDateStr) {
    dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      throw new Error("Date invalide");
    }
  }

  // Normaliser le titre pour la comparaison (insensible à la casse, sans espaces en début/fin)
  const normalizedTitle = title.toLowerCase().trim();

  // Récupérer toutes les actions du projet pour vérifier les doublons
  const projectActions = await prisma.actionItem.findMany({
    where: {
      projectId: decision.project.id,
    },
    select: {
      id: true,
      title: true,
      decisionId: true,
      dueDate: true,
    },
  });

  // Chercher une action existante avec le même titre (comparaison insensible à la casse)
  const existingAction = projectActions.find(
    (action) => action.title.toLowerCase().trim() === normalizedTitle
  );

  let actionLinked = false;

  // Si une action existe déjà avec le même titre (comparaison insensible à la casse)
  if (existingAction) {
    // Si l'action n'est pas déjà liée à une décision, la relier à cette décision
    if (!existingAction.decisionId) {
      await prisma.actionItem.update({
        where: {
          id: existingAction.id,
        },
        data: {
          decisionId,
          // Mettre à jour la dueDate si elle n'existe pas encore et qu'une nouvelle est fournie
          dueDate: existingAction.dueDate || dueDate,
        },
      });
      
      // Ajouter les nouvelles mentions (les doublons seront ignorés grâce à skipDuplicates)
      await createMentions(existingAction.id, mentionedUserIds);
      actionLinked = true;
    } else if (existingAction.decisionId !== decisionId) {
      // L'action est déjà liée à une autre décision, créer une nouvelle action
      const newAction = await prisma.actionItem.create({
        data: {
          title,
          status: "TODO",
          projectId: decision.project.id,
          decisionId,
          createdById: userId,
          assigneeId: userId,
          dueDate,
        },
      });
      
      // Créer les mentions
      await createMentions(newAction.id, mentionedUserIds);
    }
    // Si l'action est déjà liée à cette décision, ne rien faire (éviter les doublons)
  } else {
    // Aucune action similaire trouvée, créer une nouvelle action
    const newAction = await prisma.actionItem.create({
      data: {
        title,
        status: "TODO",
        projectId: decision.project.id,
        decisionId,
        createdById: userId,
        assigneeId: userId, // V1: assigné au créateur
        dueDate,
      },
    });
    
    // Créer les mentions
    await createMentions(newAction.id, mentionedUserIds);
  }

  // Revalider les pages concernées
  revalidatePath(`/app/decisions/${decisionId}`);
  revalidatePath(`/app/projects/${decision.project.id}`);
  revalidatePath("/app");

  // Retourner le résultat avec warning si pas de dueDate
  const result: CreateActionForDecisionResult = {
    ok: true,
    actionLinked,
  };

  if (!dueDate) {
    result.warning = "MISSING_DUE_DATE";
  }

  return result;
}

/**
 * Mettre à jour le statut d'une action
 */
export async function updateActionStatus(actionId: string, newStatus: "TODO" | "DOING" | "DONE" | "BLOCKED") {
  const userId = await getCurrentUserIdOrThrow();

  // Vérifier que l'action existe et que l'utilisateur y a accès
  const action = await prisma.actionItem.findFirst({
    where: {
      id: actionId,
    },
    include: {
      decision: {
        select: {
          id: true,
        },
      },
      project: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!action) {
    throw new Error("Action non trouvée");
  }

  // Vérifier l'accès au projet
  const hasAccess = await canAccessProject(userId, action.project.id);
  if (!hasAccess) {
    throw new Error("Accès non autorisé");
  }

  // Mettre à jour le statut
  await prisma.actionItem.update({
    where: {
      id: actionId,
    },
    data: {
      status: newStatus,
    },
  });

  // Revalider les pages concernées
  if (action.decision) {
    revalidatePath(`/app/decisions/${action.decision.id}`);
  }
  revalidatePath(`/app/projects/${action.project.id}`);
  revalidatePath("/app");
}

