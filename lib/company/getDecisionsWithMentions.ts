import { prisma } from "@/lib/db";
import { getAccessibleProjectsWhere } from "./getCompanyProjects";

/**
 * Récupère les décisions accessibles à l'utilisateur :
 * - Décisions des projets accessibles (projets de l'utilisateur + projets des membres de l'entreprise)
 * - OU décisions où l'utilisateur est mentionné (même si le projet n'est pas accessible)
 */
export async function getDecisionsWithMentions(userId: string) {
  const projectsWhere = await getAccessibleProjectsWhere(userId);

  // Récupérer les IDs des décisions où l'utilisateur est mentionné
  const mentionedDecisionIds = await (prisma as any).decisionMention.findMany({
    where: {
      userId,
    },
    select: {
      decisionId: true,
    },
  }).then((mentions: any[]) => mentions.map((m) => m.decisionId));

  // Récupérer les décisions :
  // 1. Décisions des projets accessibles
  // 2. OU décisions où l'utilisateur est mentionné
  const decisions = await (prisma as any).decision.findMany({
    where: {
      OR: [
        {
          project: projectsWhere,
        },
        ...(mentionedDecisionIds.length > 0
          ? [
              {
                id: {
                  in: mentionedDecisionIds,
                },
              },
            ]
          : []),
      ],
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      actions: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return decisions;
}

