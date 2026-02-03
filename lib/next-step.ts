/**
 * Calcul de la "prochaine étape" pour une action ou une décision
 * (Server-only)
 */

import { prisma } from "@/lib/db";
import { calculateDecisionRisk } from "@/lib/decision-risk";
import { isOverdue } from "@/lib/timeUrgency";
import { getLocaleFromRequest, getTranslations } from "@/i18n/request";

/**
 * Calcule la prochaine étape pour une action après qu'elle soit passée en DONE
 */
export async function getNextStepForAction(
  actionId: string,
  userId: string
): Promise<string> {
  const locale = await getLocaleFromRequest();
  const t = await getTranslations("dashboard.nextSteps");
  // Récupérer l'action avec son projet et décision
  const action = await prisma.actionItem.findFirst({
    where: {
      id: actionId,
      project: {
        ownerId: userId,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      decision: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!action) {
    return t("chooseNextAction");
  }

  // Si l'action est liée à une décision, calculer la prochaine étape de la décision
  if (action.decision) {
    const decisionActions = await prisma.actionItem.findMany({
      where: {
        decisionId: action.decision.id,
        project: {
          ownerId: userId,
        },
      },
      select: {
        id: true,
        status: true,
        dueDate: true,
      },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const openActions = decisionActions.filter((a) => a.status !== "DONE");
    const blockedActions = decisionActions.filter((a) => a.status === "BLOCKED");
    const overdueCount = decisionActions.filter((a) =>
      isOverdue(a.dueDate, a.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now)
    ).length;
    const doingCount = decisionActions.filter((a) => a.status === "DOING").length;
    const isExecutable =
      decisionActions.length > 0 &&
      decisionActions.every((a) => a.dueDate !== null);

    // Utiliser les mêmes règles que la roadmap
    if (!isExecutable) {
      return t("addActionWithDueDate");
    } else if (blockedActions.length > 0) {
      return t("unblockAction");
    } else if (overdueCount > 0) {
      return t("rescheduleOverdue");
    } else if (openActions.length > 0 && doingCount === 0) {
      return t("startAction");
    } else if (openActions.length > 0) {
      return t("continueExecution");
    } else {
      return t("allActionsDone");
    }
  }

  // Sinon, vérifier s'il y a d'autres actions dans le projet
  const projectActions = await prisma.actionItem.findMany({
    where: {
      projectId: action.project.id,
      project: {
        ownerId: userId,
      },
      status: {
        not: "DONE",
      },
    },
    select: {
      id: true,
      status: true,
      dueDate: true,
    },
    take: 1,
  });

  if (projectActions.length > 0) {
    return t("continueWithOtherActions");
  }

  return t("chooseNextAction");
}

/**
 * Calcule la prochaine étape pour un projet après qu'il soit passé en DONE
 */
export async function getNextStepForProject(
  projectId: string,
  userId: string
): Promise<string> {
  const locale = await getLocaleFromRequest();
  const t = await getTranslations("dashboard.nextSteps");
  
  // Vérifier s'il y a d'autres projets actifs
  const otherProjects = await prisma.project.findMany({
    where: {
      ownerId: userId,
      status: {
        not: "DONE",
      },
      id: {
        not: projectId,
      },
    },
    select: {
      id: true,
      name: true,
    },
    take: 1,
  });

  if (otherProjects.length > 0) {
    return `${t("continueWithProject")} "${otherProjects[0].name}"`;
  }

  return t("createNewProject");
}

