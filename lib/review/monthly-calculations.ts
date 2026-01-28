import { Prisma } from "@prisma/client";

type ProjectWithStats = {
  id: string;
  name: string;
  status: string;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  progressPercentage: number;
  projectStatus: "on_track" | "at_risk" | "blocked";
};

type WeeklyActivity = {
  week: number;
  weekLabel: string;
  meetings: number;
  actionsCreated: number;
  decisionsTaken: number;
};

type ActionStatusDistribution = {
  status: string;
  count: number;
  percentage: number;
};

/**
 * Calcule les KPIs globaux pour le mois
 */
export function calculateMonthlyKPIs(data: {
  meetings: number;
  actionsCreated: number;
  actionsCompleted: number;
  actionsOverdue: number;
  decisionsTaken: number;
}) {
  return {
    meetings: data.meetings,
    actionsCompleted: data.actionsCompleted,
    actionsOverdue: data.actionsOverdue,
    decisions: data.decisionsTaken,
  };
}

/**
 * Calcule l'avancement d'un projet
 */
export function calculateProjectProgress(project: {
  totalActions: number;
  completedActions: number;
  overdueActions: number;
}): {
  progressPercentage: number;
  projectStatus: "on_track" | "at_risk" | "blocked";
} {
  const { totalActions, completedActions } = project;
  
  if (totalActions === 0) {
    return {
      progressPercentage: 0,
      projectStatus: "blocked",
    };
  }

  const progressPercentage = Math.round((completedActions / totalActions) * 100);

  let projectStatus: "on_track" | "at_risk" | "blocked";
  if (progressPercentage >= 70) {
    projectStatus = "on_track";
  } else if (progressPercentage >= 30) {
    projectStatus = "at_risk";
  } else {
    projectStatus = "blocked";
  }

  return {
    progressPercentage,
    projectStatus,
  };
}

/**
 * Calcule l'avancement de tous les projets
 */
export function calculateAllProjectsProgress(
  projects: Array<{
    id: string;
    name: string;
    status: string;
    totalActions: number;
    completedActions: number;
    overdueActions: number;
  }>
): ProjectWithStats[] {
  return projects.map((project) => {
    const { progressPercentage, projectStatus } = calculateProjectProgress({
      totalActions: project.totalActions,
      completedActions: project.completedActions,
      overdueActions: project.overdueActions,
    });

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      totalActions: project.totalActions,
      completedActions: project.completedActions,
      overdueActions: project.overdueActions,
      progressPercentage,
      projectStatus,
    };
  });
}

/**
 * Calcule l'activité par semaine du mois
 */
export function calculateWeeklyActivity(data: {
  meetings: Array<{ date: Date }>;
  actions: Array<{ createdAt: Date }>;
  decisions: Array<{ createdAt: Date }>;
  monthStart: Date;
  monthEnd: Date;
}): WeeklyActivity[] {
  const { meetings, actions, decisions, monthStart, monthEnd } = data;
  
  // Diviser le mois en semaines (4 semaines)
  const weeks: WeeklyActivity[] = [];
  const weekStart = new Date(monthStart);
  
  for (let week = 1; week <= 4; week++) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Limiter à la fin du mois
    if (weekEnd > monthEnd) {
      weekEnd.setTime(monthEnd.getTime());
    }

    const weekMeetings = meetings.filter((m) => {
      const meetingDate = new Date(m.date);
      return meetingDate >= weekStart && meetingDate <= weekEnd;
    }).length;

    const weekActions = actions.filter((a) => {
      const actionDate = new Date(a.createdAt);
      return actionDate >= weekStart && actionDate <= weekEnd;
    }).length;

    const weekDecisions = decisions.filter((d) => {
      const decisionDate = new Date(d.createdAt);
      return decisionDate >= weekStart && decisionDate <= weekEnd;
    }).length;

    weeks.push({
      week,
      weekLabel: `Semaine ${week}`,
      meetings: weekMeetings,
      actionsCreated: weekActions,
      decisionsTaken: weekDecisions,
    });

    // Passer à la semaine suivante
    weekStart.setDate(weekStart.getDate() + 7);
  }

  return weeks;
}

/**
 * Calcule la répartition des actions par statut
 */
export function calculateActionStatusDistribution(actions: Array<{ status: string }>): ActionStatusDistribution[] {
  const total = actions.length;
  if (total === 0) {
    return [];
  }

  const statusCounts: Record<string, number> = {};
  actions.forEach((action) => {
    statusCounts[action.status] = (statusCounts[action.status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

/**
 * Génère un résumé exécutif automatique
 */
export function generateExecutiveSummary(data: {
  totalProjects: number;
  activeProjects: number;
  totalMeetings: number;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  decisionsTaken: number;
  projects: ProjectWithStats[];
}): string {
  const { totalProjects, activeProjects, totalMeetings, totalActions, completedActions, overdueActions, decisionsTaken, projects } = data;

  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  
  // Trouver le projet le plus avancé
  const mostAdvancedProject = projects
    .filter((p) => p.totalActions > 0)
    .sort((a, b) => b.progressPercentage - a.progressPercentage)[0];

  // Trouver le projet le plus en difficulté
  const mostStrugglingProject = projects
    .filter((p) => p.totalActions > 0 && p.projectStatus !== "on_track")
    .sort((a, b) => a.progressPercentage - b.progressPercentage)[0];

  const parts: string[] = [];

  // Introduction
  parts.push(`Ce mois, ${activeProjects} projet${activeProjects > 1 ? "s" : ""} actif${activeProjects > 1 ? "s" : ""} sur ${totalProjects} au total.`);

  // Activité
  if (totalMeetings > 0) {
    parts.push(`${totalMeetings} réunion${totalMeetings > 1 ? "s" : ""} ont eu lieu.`);
  }

  // Actions
  if (totalActions > 0) {
    parts.push(`${totalActions} action${totalActions > 1 ? "s" : ""} ont été créée${totalActions > 1 ? "s" : ""}, dont ${completedActions} terminée${completedActions > 1 ? "s" : ""} (${completionRate}% de complétion).`);
  }

  // Retards
  if (overdueActions > 0) {
    parts.push(`${overdueActions} action${overdueActions > 1 ? "s" : ""} ${overdueActions > 1 ? "sont" : "est"} en retard.`);
  }

  // Décisions
  if (decisionsTaken > 0) {
    parts.push(`${decisionsTaken} décision${decisionsTaken > 1 ? "s" : ""} ${decisionsTaken > 1 ? "ont été prises" : "a été prise"}.`);
  }

  // Projet le plus avancé
  if (mostAdvancedProject) {
    parts.push(`Le projet "${mostAdvancedProject.name}" est le plus avancé avec ${mostAdvancedProject.progressPercentage}% de complétion.`);
  }

  // Projet en difficulté
  if (mostStrugglingProject) {
    parts.push(`Le projet "${mostStrugglingProject.name}" nécessite une attention particulière avec ${mostStrugglingProject.progressPercentage}% de complétion.`);
  }

  return parts.join(" ");
}

export type { ProjectWithStats, WeeklyActivity, ActionStatusDistribution };
