"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getNextStepForAction } from "@/lib/next-step";

/**
 * Mettre à jour le statut d'une action (utilisable depuis n'importe quelle page)
 */
export async function updateActionStatus(actionId: string, newStatus: "TODO" | "DOING" | "DONE" | "BLOCKED") {
  const userId = await getCurrentUserIdOrThrow();

  // Validation du statut reçu
  const validStatuses = ["TODO", "DOING", "DONE", "BLOCKED"] as const;
  if (!validStatuses.includes(newStatus)) {
    console.error(`[API] updateActionStatus: Statut invalide reçu: "${newStatus}"`);
    throw new Error(`Statut invalide: ${newStatus}. Statuts acceptés: ${validStatuses.join(", ")}`);
  }

  console.log(`[API] updateActionStatus: Mise à jour de l'action ${actionId} vers "${newStatus}"`);

  // Vérifier que l'action appartient à un projet de l'utilisateur
  const action = await prisma.actionItem.findFirst({
    where: {
      id: actionId,
      project: {
        ownerId: userId,
      },
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
    throw new Error("Action non trouvée ou accès non autorisé");
  }

  const wasDone = action.status === "DONE";
  const isNowDone = newStatus === "DONE";

  // Mettre à jour le statut
  // La sécurité est assurée par la vérification findFirst ci-dessus
  const updated = await prisma.actionItem.updateMany({
    where: {
      id: actionId,
      project: {
        ownerId: userId,
      },
    },
    data: {
      status: newStatus,
    },
  });

  console.log(`[API] updateActionStatus: Action ${actionId} mise à jour avec succès. Ancien statut: "${action.status}", Nouveau statut: "${newStatus}"`);

  // Revalider les pages concernées
  if (action.decision) {
    revalidatePath(`/app/decisions/${action.decision.id}`);
  }
  revalidatePath(`/app/projects/${action.project.id}`);
  revalidatePath("/app");

  // Si l'action vient de passer en DONE, calculer la prochaine étape
  let nextStep: string | undefined;
  let hasNoOverdueActions = false;
  if (!wasDone && isNowDone) {
    try {
      nextStep = await getNextStepForAction(actionId, userId);
    } catch (error) {
      // Ignorer les erreurs de calcul de nextStep
      console.error("Erreur calcul nextStep:", error);
    }

    // Vérifier si l'utilisateur n'a plus d'actions en retard après cette mise à jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueCount = await prisma.actionItem.count({
      where: {
        assigneeId: userId,
        status: {
          not: "DONE",
        },
        dueDate: {
          lt: today,
        },
        project: {
          ownerId: userId,
        },
      },
    });
    
    hasNoOverdueActions = overdueCount === 0;
  }

  return { 
    ok: true, 
    justCompleted: !wasDone && isNowDone, 
    nextStep,
    hasNoOverdueActions,
  };
}

/**
 * Avancer le statut d'une action dans le cycle TODO -> DOING -> DONE
 */
export async function advanceActionStatus(actionId: string) {
  const userId = await getCurrentUserIdOrThrow();

  // Vérifier que l'action appartient à un projet de l'utilisateur
  const action = await prisma.actionItem.findFirst({
    where: {
      id: actionId,
      project: {
        ownerId: userId,
      },
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
    throw new Error("Action non trouvée ou accès non autorisé");
  }

  // Déterminer le nouveau statut selon le cycle TODO -> DOING -> DONE
  let newStatus: "TODO" | "DOING" | "DONE";
  if (action.status === "TODO") {
    newStatus = "DOING";
  } else if (action.status === "DOING") {
    newStatus = "DONE";
  } else {
    // Si déjà DONE ou autre, ne rien faire ou remettre à TODO
    newStatus = "TODO";
  }

  const wasDone = action.status === "DONE";
  const isNowDone = newStatus === "DONE";

  // Mettre à jour le statut
  // La sécurité est assurée par la vérification findFirst ci-dessus
  await prisma.actionItem.updateMany({
    where: {
      id: actionId,
      project: {
        ownerId: userId,
      },
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

  // Si l'action vient de passer en DONE, calculer la prochaine étape
  let nextStep: string | undefined;
  let hasNoOverdueActions = false;
  if (!wasDone && isNowDone) {
    try {
      nextStep = await getNextStepForAction(actionId, userId);
    } catch (error) {
      // Ignorer les erreurs de calcul de nextStep
      console.error("Erreur calcul nextStep:", error);
    }

    // Vérifier si l'utilisateur n'a plus d'actions en retard après cette mise à jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueCount = await prisma.actionItem.count({
      where: {
        assigneeId: userId,
        status: {
          not: "DONE",
        },
        dueDate: {
          lt: today,
        },
        project: {
          ownerId: userId,
        },
      },
    });
    
    hasNoOverdueActions = overdueCount === 0;
  }

  return { 
    ok: true, 
    justCompleted: !wasDone && isNowDone, 
    nextStep,
    hasNoOverdueActions,
  };
}

/**
 * Mettre à jour le titre et la date d'échéance d'une action
 */
export async function updateAction(
  actionId: string,
  data: {
    title: string;
    dueDate?: string | null;
  }
) {
  const userId = await getCurrentUserIdOrThrow();

  // Validation
  const title = data.title.trim();
  if (!title || title.length < 2) {
    throw new Error("Le titre doit contenir au moins 2 caractères");
  }

  // Vérifier que l'action appartient à un projet de l'utilisateur
  const action = await prisma.actionItem.findFirst({
    where: {
      id: actionId,
      project: {
        ownerId: userId,
      },
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
      meeting: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!action) {
    throw new Error("Action non trouvée ou accès non autorisé");
  }

  // Parser la date si fournie
  let dueDate: Date | null = null;
  if (data.dueDate && data.dueDate.trim()) {
    dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error("Date invalide");
    }
  }

  // Mettre à jour l'action uniquement si elle appartient à un projet de l'utilisateur
  const updated = await prisma.actionItem.updateMany({
    where: {
      id: actionId,
      project: {
        ownerId: userId,
      },
    },
    data: {
      title,
      dueDate,
    },
  });

  if (updated.count === 0) {
    throw new Error("Action non trouvée ou accès non autorisé");
  }

  console.log(`[API] updateAction: Action ${actionId} mise à jour avec succès. Titre: "${title}", DueDate: ${dueDate ? dueDate.toISOString() : "null"}`);

  // Revalider les pages concernées pour garantir la synchronisation partout
  if (action.decision) {
    revalidatePath(`/app/decisions/${action.decision.id}`);
  }
  if (action.meeting) {
    revalidatePath(`/app/meetings/${action.meeting.id}`);
    revalidatePath(`/app/meetings/${action.meeting.id}/analyze`);
    revalidatePath(`/app/meetings/${action.meeting.id}/kanban`);
  }
  revalidatePath(`/app/projects/${action.project.id}`);
  revalidatePath(`/app/projects/${action.project.id}/kanban`);
  revalidatePath("/app");
  revalidatePath("/app/actions");
  revalidatePath("/app/calendar");
  revalidatePath("/app/decisions");

  return { ok: true };
}
