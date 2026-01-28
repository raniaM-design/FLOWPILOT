import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import {
  calculateMonthlyKPIs,
  calculateAllProjectsProgress,
  calculateWeeklyActivity,
  calculateActionStatusDistribution,
  generateExecutiveSummary,
} from "@/lib/review/monthly-calculations";
import { isOverdue } from "@/lib/timeUrgency";
import type { MonthlyReviewExportData } from "./types";

/**
 * Builder de données pour la Monthly Review
 * Source de vérité unique pour UI + export
 */
export async function buildMonthlyReviewData(params: {
  year: number;
  month: number;
  locale: string;
  userId: string;
}): Promise<MonthlyReviewExportData> {
  const { year, month, locale, userId } = params;
  const t = await getTranslations({ locale, namespace: "review.monthly" });
  const tStatus = await getTranslations({ locale, namespace: "status" });

  // Dates pour le mois spécifié
  const now = new Date(year, month - 1, 1);
  now.setHours(0, 0, 0, 0);

  const monthStart = new Date(year, month - 1, 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(year, month, 0);
  monthEnd.setHours(23, 59, 59, 999);

  // Charger les données
  const allProjects = await prisma.project.findMany({
    where: {
      ownerId: userId,
      status: {
        in: ["ACTIVE", "PAUSED"],
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  const meetings = await prisma.meeting.findMany({
    where: {
      ownerId: userId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      id: true,
      date: true,
    },
  });

  const allActions = await prisma.actionItem.findMany({
    where: {
      project: {
        ownerId: userId,
      },
      createdAt: {
        lte: monthEnd,
      },
    },
    select: {
      id: true,
      projectId: true,
      title: true,
      status: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      assigneeId: true,
    },
  });

  const allDecisions = await prisma.decision.findMany({
    where: {
      project: {
        ownerId: userId,
      },
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      id: true,
      projectId: true,
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
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  // Calculer les stats par projet
  const projectsWithStats = allProjects.map((project) => {
    const projectActions = allActions.filter((a) => a.projectId === project.id);
    const totalActions = projectActions.length;
    const completedActions = projectActions.filter((a) => a.status === "DONE").length;
    const overdueActions = projectActions.filter((a) =>
      a.status !== "DONE" && a.dueDate && isOverdue(a.dueDate, a.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now)
    ).length;

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      totalActions,
      completedActions,
      overdueActions,
    };
  });

  const projectsProgress = calculateAllProjectsProgress(projectsWithStats);

  // S'assurer qu'il y a au moins un projet (même vide)
  if (projectsProgress.length === 0) {
    projectsProgress.push({
      id: "empty",
      name: "No projects",
      status: "ACTIVE",
      progressPercentage: 0,
      completedActions: 0,
      totalActions: 0,
      overdueActions: 0,
      projectStatus: "on_track",
    });
  }

  // Calculer les KPIs
  const actionsCreated = allActions.filter((a) =>
    a.createdAt >= monthStart && a.createdAt <= monthEnd
  ).length;
  const actionsCompleted = allActions.filter((a) =>
    a.status === "DONE" && a.updatedAt >= monthStart && a.updatedAt <= monthEnd
  ).length;
  const actionsOverdue = allActions.filter((a) =>
    a.status !== "DONE" && a.dueDate && isOverdue(a.dueDate, a.status as "TODO" | "DOING" | "DONE" | "BLOCKED", now)
  ).length;
  const decisionsTaken = allDecisions.filter((d) => d.status === "DECIDED").length;

  const kpis = calculateMonthlyKPIs({
    meetings: meetings.length,
    actionsCreated,
    actionsCompleted,
    actionsOverdue,
    decisionsTaken,
  });

  const completionRate = allActions.length > 0
    ? Math.round((actionsCompleted / allActions.length) * 100)
    : 0;

  // Calculer l'activité par semaine
  const weeklyActivity = calculateWeeklyActivity({
    meetings,
    actions: allActions,
    decisions: allDecisions,
    monthStart,
    monthEnd,
  });

  // S'assurer qu'il y a au moins une semaine de données
  if (weeklyActivity.length === 0) {
    const firstWeekStart = new Date(monthStart);
    weeklyActivity.push({
      week: 1,
      weekLabel: firstWeekStart.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "short",
      }),
      meetings: 0,
      actionsCreated: 0,
      decisionsTaken: 0,
    });
  }

  // Calculer la répartition des actions
  const actionStatusDistribution = calculateActionStatusDistribution(allActions);

  // S'assurer qu'il y a au moins un statut
  if (actionStatusDistribution.length === 0) {
    actionStatusDistribution.push({
      status: "TODO",
      count: 0,
      percentage: 0,
    });
  }

  // Générer le résumé exécutif
  const executiveSummary = generateExecutiveSummary({
    totalProjects: allProjects.length,
    activeProjects: allProjects.filter((p) => p.status === "ACTIVE").length,
    totalMeetings: meetings.length,
    totalActions: allActions.length,
    completedActions: actionsCompleted,
    overdueActions: actionsOverdue,
    decisionsTaken,
    projects: projectsProgress,
  });

  // Formater la période
  const periodLabel = now.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    month: "long",
    year: "numeric",
  });

  // Actions pour le mois prochain
  const nextMonthStart = new Date(year, month, 1);
  const nextMonthEnd = new Date(year, month + 1, 0);
  nextMonthEnd.setHours(23, 59, 59, 999);

  const nextMonthActions = allActions.filter((a) => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate >= nextMonthStart && dueDate <= nextMonthEnd && a.status !== "DONE";
  }).slice(0, 6);

  // Construire les données d'export
  const exportData: MonthlyReviewExportData = {
    period: {
      year,
      month,
      label: periodLabel,
    },
    summary: executiveSummary,
    kpis: {
      meetings: kpis.meetings,
      actionsTotal: allActions.length,
      actionsDone: kpis.actionsCompleted,
      actionsOverdue: kpis.actionsOverdue,
      decisions: kpis.decisions,
      completionRate,
    },
    charts: {
      activityByWeek: weeklyActivity.map((w) => ({
        weekLabel: w.weekLabel,
        meetings: w.meetings,
        actions: w.actionsCreated,
        decisions: w.decisionsTaken,
      })),
      actionStatus: actionStatusDistribution.map((item) => {
        const statusMap: Record<string, "done" | "in_progress" | "blocked" | "overdue" | "todo"> = {
          DONE: "done",
          DOING: "in_progress",
          BLOCKED: "blocked",
          TODO: "todo",
        };
        return {
          status: statusMap[item.status] || "todo",
          label: tStatus(item.status.toLowerCase()) || item.status,
          value: item.count,
          percentage: item.percentage,
        };
      }),
      projectProgress: projectsProgress.map((p) => ({
        projectId: p.id,
        name: p.name,
        completionRate: p.progressPercentage,
        done: p.completedActions,
        total: p.totalActions,
        overdue: p.overdueActions,
        status: p.projectStatus,
      })),
    },
    highlights: {
      keyDecisions: allDecisions.map((d) => ({
        id: d.id,
        title: d.title,
        date: new Date(d.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
          day: "numeric",
          month: "short",
        }),
        projectName: d.project.name,
        status: d.status,
      })),
      nextMonthFocus: nextMonthActions.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate
          ? new Date(a.dueDate).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
              day: "numeric",
              month: "short",
            })
          : undefined,
        projectName: allProjects.find((p) => p.id === a.projectId)?.name,
        status: a.status,
      })),
    },
  };

  return exportData;
}

