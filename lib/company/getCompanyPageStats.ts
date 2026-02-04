import { prisma } from "@/lib/db";
import { getAccessibleProjectsWhere, getCompanyMemberIds } from "./getCompanyProjects";

/**
 * Récupère les statistiques détaillées pour la page Collaboration / Entreprise
 */
export async function getCompanyPageStats(userId: string) {
  try {
    const memberIds = await getCompanyMemberIds(userId);
    const projectsWhere = await getAccessibleProjectsWhere(userId);

    // 1. Compter les membres de l'entreprise
    const memberCount = memberIds.length;

    // 2. Compter les projets actifs accessibles
    const activeProjectsCount = await prisma.project.count({
      where: {
        ...projectsWhere,
        status: {
          in: ["ACTIVE", "IN_PROGRESS"],
        },
      },
    });

    // 3. Compter les réunions ce mois-ci
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const meetingsThisMonth = await prisma.meeting.count({
      where: {
        project: projectsWhere,
        date: {
          gte: startOfMonth,
        },
      },
    });

    // 4. Compter les actions en cours + en retard
    const now = new Date();
    const actionsInProgress = await prisma.actionItem.count({
      where: {
        project: projectsWhere,
        status: {
          in: ["TODO", "DOING", "BLOCKED"],
        },
      },
    });

    const overdueActions = await prisma.actionItem.count({
      where: {
        project: projectsWhere,
        status: {
          in: ["TODO", "DOING", "BLOCKED"],
        },
        dueDate: {
          lt: now,
        },
      },
    });

    // 5. Récupérer les projets avec leurs détails
    const projects = await (prisma as any).project.findMany({
      where: projectsWhere,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        actionItems: {
          where: {
            status: {
              in: ["TODO", "DOING", "BLOCKED"],
            },
          },
          select: {
            id: true,
            dueDate: true,
          },
          orderBy: {
            dueDate: "asc",
          },
        },
        decisions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    // Enrichir les projets avec les comptes et la prochaine échéance
    const enrichedProjects = projects.map((project: any) => {
      const actionsInProgress = project.actionItems?.length || 0;
      const nextDueDateRaw = project.actionItems?.find((a: any) => a.dueDate)?.dueDate || null;
      const nextDueDate = nextDueDateRaw ? new Date(nextDueDateRaw) : null;
      
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        actionsInProgress,
        decisionsCount: project.decisions?.length || 0,
        nextDueDate,
      };
    });

    return {
      memberCount,
      activeProjectsCount,
      meetingsThisMonth,
      actionsInProgress,
      overdueActions,
      projects: enrichedProjects,
    };
  } catch (error) {
    console.error("[getCompanyPageStats] Erreur:", error);
    return {
      memberCount: 0,
      activeProjectsCount: 0,
      meetingsThisMonth: 0,
      actionsInProgress: 0,
      overdueActions: 0,
      projects: [],
    };
  }
}

