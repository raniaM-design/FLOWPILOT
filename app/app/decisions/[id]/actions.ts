"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

  // Vérifier que la décision appartient à un projet de l'utilisateur
  const decision = await prisma.decision.findFirst({
    where: {
      id: decisionId,
      project: {
        ownerId: userId,
      },
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
    throw new Error("Décision non trouvée ou accès non autorisé");
  }

  // Decision Guardrail : calculer isExecutable avant de passer en DECIDED
  let isExecutable = true;
  const warningReasons: ("NO_ACTION" | "MISSING_DUE_DATE")[] = [];

  if (status === "DECIDED") {
    // Récupérer toutes les actions liées à cette décision (filtrées par ownership)
    const actions = await prisma.actionItem.findMany({
      where: {
        decisionId: decisionId,
        project: {
          ownerId: userId, // Sécurité : filtrer par ownerId
        },
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
  await prisma.decision.updateMany({
    where: {
      id: decisionId,
      project: {
        ownerId: userId,
      },
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
};

/**
 * Créer une action depuis la page décision
 */
export async function createActionForDecision(formData: FormData): Promise<CreateActionForDecisionResult> {
  const userId = await getCurrentUserIdOrThrow();

  const decisionId = String(formData.get("decisionId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueDateStr = String(formData.get("dueDate") ?? "").trim();

  // Validation
  if (!decisionId) {
    throw new Error("ID de la décision manquant");
  }

  if (!title || title.length < 2) {
    throw new Error("Le titre doit contenir au moins 2 caractères");
  }

  // Vérifier que la décision appartient à un projet de l'utilisateur
  const decision = await prisma.decision.findFirst({
    where: {
      id: decisionId,
      project: {
        ownerId: userId,
      },
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
    throw new Error("Décision non trouvée ou accès non autorisé");
  }

  // Parser la date si fournie
  let dueDate: Date | null = null;
  if (dueDateStr) {
    dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      throw new Error("Date invalide");
    }
  }

  // Créer l'action avec status TODO par défaut
  await prisma.actionItem.create({
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

  // Revalider les pages concernées
  revalidatePath(`/app/decisions/${decisionId}`);
  revalidatePath(`/app/projects/${decision.project.id}`);
  revalidatePath("/app");

  // Retourner un warning si pas de dueDate
  const result: CreateActionForDecisionResult = {
    ok: true,
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

  // Mettre à jour le statut
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
}

