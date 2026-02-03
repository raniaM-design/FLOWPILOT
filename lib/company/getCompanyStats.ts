import { prisma } from "@/lib/db";
import { getAccessibleProjectsWhere } from "./getCompanyProjects";

/**
 * Récupère les statistiques de l'entreprise pour le tableau de bord équipe
 */
export async function getCompanyStats(userId: string) {
  try {
    const projectsWhere = await getAccessibleProjectsWhere(userId);

    // Récupérer les projets accessibles
    const projects = await prisma.project.findMany({
      where: projectsWhere,
      select: {
        id: true,
        name: true,
        status: true,
      },
      take: 10,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Récupérer les actions des projets accessibles (tous les membres de l'entreprise)
    const actions = await prisma.actionItem.findMany({
      where: {
        project: projectsWhere,
        status: {
          in: ["TODO", "DOING", "BLOCKED", "DONE"],
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        assigneeId: true,
        assignee: {
          select: {
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 20,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Récupérer les décisions des projets accessibles
    const decisions = await prisma.decision.findMany({
      where: {
        project: projectsWhere,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Récupérer les réunions des projets accessibles
    const meetings = await prisma.meeting.findMany({
      where: {
        project: projectsWhere,
      },
      select: {
        id: true,
        title: true,
        date: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        date: "desc",
      },
    });

    // Compter les actions par statut
    const actionsByStatus = {
      todo: actions.filter((a) => a.status === "TODO").length,
      doing: actions.filter((a) => a.status === "DOING").length,
      blocked: actions.filter((a) => a.status === "BLOCKED").length,
      done: actions.filter((a) => a.status === "DONE").length,
    };

    return {
      projects: projects.length,
      actions: actionsByStatus,
      decisions: decisions.length,
      meetings: meetings.length,
      recentActions: actions.slice(0, 10).map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        assigneeEmail: a.assignee?.email || "",
        projectName: a.project.name,
      })),
      recentDecisions: decisions.slice(0, 5).map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        projectName: d.project.name,
      })),
      recentMeetings: meetings.slice(0, 5).map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        projectName: m.project?.name || "Sans projet",
      })),
    };
  } catch (error) {
    console.error("[getCompanyStats] Erreur:", error);
    return {
      projects: 0,
      actions: { todo: 0, doing: 0, blocked: 0, done: 0 },
      decisions: 0,
      meetings: 0,
      recentActions: [],
      recentDecisions: [],
      recentMeetings: [],
    };
  }
}

