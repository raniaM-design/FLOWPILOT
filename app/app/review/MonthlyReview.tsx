import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { FlowCard, FlowCardContent, FlowCardHeader } from "@/components/ui/flow-card";
import { SectionTitle } from "@/components/ui/section-title";
import { Chip } from "@/components/ui/chip";
import { getTranslations } from "@/i18n/request";
import { 
  calculateMonthlyKPIs, 
  calculateAllProjectsProgress, 
  calculateWeeklyActivity,
  calculateActionStatusDistribution,
  generateExecutiveSummary,
  type ProjectWithStats,
  type WeeklyActivity,
  type ActionStatusDistribution,
} from "@/lib/review/monthly-calculations";
import { MonthlyKPICards } from "@/components/review/monthly-kpi-cards";
import { ProjectProgressChart } from "@/components/review/project-progress-chart";
import { WeeklyActivityChart } from "@/components/review/weekly-activity-chart";
import { ActionStatusChart } from "@/components/review/action-status-chart";
import Link from "next/link";
import { FolderKanban, Calendar, ArrowRight, Target, AlertTriangle, CheckSquare2 } from "lucide-react";
import { isOverdue } from "@/lib/timeUrgency";

export async function MonthlyReview() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations("review.monthly");

  // Dates pour le mois courant
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  // Charger tous les projets actifs
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

  // Charger les meetings du mois
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

  // Charger toutes les actions liées aux projets
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
    },
  });

  // Charger toutes les décisions liées aux projets
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
    take: 5,
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

  // Calculer l'avancement des projets
  const projectsProgress = calculateAllProjectsProgress(projectsWithStats);

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

  // Calculer l'activité par semaine
  const weeklyActivity = calculateWeeklyActivity({
    meetings,
    actions: allActions,
    decisions: allDecisions,
    monthStart,
    monthEnd,
  });

  // Calculer la répartition des actions par statut
  const actionStatusDistribution = calculateActionStatusDistribution(allActions);

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

  // Actions pour le mois prochain
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  nextMonthEnd.setHours(23, 59, 59, 999);

  const nextMonthActions = allActions.filter((a) => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate >= nextMonthStart && dueDate <= nextMonthEnd && a.status !== "DONE";
  });

  const projectsAtRisk = projectsProgress.filter((p) => 
    p.projectStatus === "at_risk" || p.projectStatus === "blocked"
  );

  return (
    <div className="space-y-8">
      {/* A. Executive Summary */}
      <FlowCard variant="elevated">
        <FlowCardHeader>
          <SectionTitle
            title={t("executiveSummary.title")}
            subtitle={t("executiveSummary.subtitle")}
            size="lg"
          />
        </FlowCardHeader>
        <FlowCardContent>
          <p className="text-base text-foreground leading-relaxed">
            {executiveSummary}
          </p>
        </FlowCardContent>
      </FlowCard>

      {/* B. KPI Cards */}
      <div className="space-y-4">
        <SectionTitle
          title={t("kpis.title")}
          subtitle={t("kpis.subtitle")}
          size="md"
        />
        <MonthlyKPICards
          meetings={kpis.meetings}
          actionsCompleted={kpis.actionsCompleted}
          actionsOverdue={kpis.actionsOverdue}
          decisions={kpis.decisions}
        />
      </div>

      {/* C. Avancement des projets */}
      <div className="space-y-4">
        <SectionTitle
          title={t("projectsProgress.title")}
          subtitle={t("projectsProgress.subtitle")}
          size="md"
        />
        <FlowCard variant="default">
          <FlowCardContent className="p-6">
            {projectsProgress.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {t("projectsProgress.empty")}
                </p>
              </div>
            ) : (
              <>
                <ProjectProgressChart projects={projectsProgress} />
                
                {/* Cards projets détaillées */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectsProgress.map((project) => {
                    const statusColors = {
                      on_track: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                      at_risk: "bg-amber-50 text-amber-700 border-amber-200/60",
                      blocked: "bg-red-50 text-red-700 border-red-200/60",
                    };

                    const statusLabels = {
                      on_track: t("projectsProgress.status.onTrack"),
                      at_risk: t("projectsProgress.status.atRisk"),
                      blocked: t("projectsProgress.status.blocked"),
                    };

                    return (
                      <Link
                        key={project.id}
                        href={`/app/projects/${project.id}`}
                        className="block group"
                      >
                        <FlowCard
                          variant="default"
                          interactive
                          className="hover:shadow-md transition-all"
                        >
                          <FlowCardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-base text-foreground line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {project.name}
                              </h4>
                              <Chip
                                variant={project.projectStatus === "on_track" ? "success" : project.projectStatus === "at_risk" ? "warning" : "danger"}
                                size="sm"
                                className={statusColors[project.projectStatus]}
                              >
                                {statusLabels[project.projectStatus]}
                              </Chip>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                <span>{t("projectsProgress.progress")}</span>
                                <span className="font-semibold">{project.progressPercentage}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    project.projectStatus === "on_track"
                                      ? "bg-emerald-500"
                                      : project.projectStatus === "at_risk"
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${project.progressPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {project.completedActions} / {project.totalActions} {t("projectsProgress.actions")}
                              </span>
                              {project.overdueActions > 0 && (
                                <span className="text-red-600 font-medium">
                                  {project.overdueActions} {t("projectsProgress.overdue")}
                                </span>
                              )}
                            </div>
                          </FlowCardContent>
                        </FlowCard>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </FlowCardContent>
        </FlowCard>
      </div>

      {/* D. Graphiques d'activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité par semaine */}
        <FlowCard variant="default">
          <FlowCardHeader>
            <SectionTitle
              title={t("charts.weeklyActivity.title")}
              subtitle={t("charts.weeklyActivity.subtitle")}
              size="md"
            />
          </FlowCardHeader>
          <FlowCardContent>
            {weeklyActivity.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("charts.weeklyActivity.empty")}</p>
              </div>
            ) : (
              <WeeklyActivityChart data={weeklyActivity} />
            )}
          </FlowCardContent>
        </FlowCard>

        {/* Répartition des actions par statut */}
        <FlowCard variant="default">
          <FlowCardHeader>
            <SectionTitle
              title={t("charts.actionStatus.title")}
              subtitle={t("charts.actionStatus.subtitle")}
              size="md"
            />
          </FlowCardHeader>
          <FlowCardContent>
            {actionStatusDistribution.length === 0 ? (
              <div className="py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("charts.actionStatus.empty")}</p>
              </div>
            ) : (
              <ActionStatusChart data={actionStatusDistribution} />
            )}
          </FlowCardContent>
        </FlowCard>
      </div>

      {/* E. Décisions clés du mois */}
      {allDecisions.length > 0 && (
        <div className="space-y-4">
          <SectionTitle
            title={t("keyDecisions.title")}
            subtitle={t("keyDecisions.subtitle")}
            size="md"
          />
          <FlowCard variant="default">
            <FlowCardContent className="p-6">
              <div className="space-y-3">
                {allDecisions.map((decision) => (
                  <Link
                    key={decision.id}
                    href={`/app/decisions/${decision.id}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-transparent p-4 hover:shadow-md transition-all duration-200 dark:bg-card dark:border-border dark:shadow-none">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Target className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {decision.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <FolderKanban className="h-3 w-3" />
                              {decision.project.name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(decision.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </FlowCardContent>
          </FlowCard>
        </div>
      )}

      {/* F. Focus mois prochain */}
      <div className="space-y-4">
        <SectionTitle
          title={t("nextMonth.title")}
          subtitle={t("nextMonth.subtitle")}
          size="md"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions avec échéance le mois prochain */}
          <FlowCard variant="default">
            <FlowCardHeader>
              <SectionTitle
                title={t("nextMonth.upcomingActions.title")}
                subtitle={t("nextMonth.upcomingActions.subtitle")}
                count={nextMonthActions.length}
                size="sm"
              />
            </FlowCardHeader>
            <FlowCardContent>
              {nextMonthActions.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckSquare2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("nextMonth.upcomingActions.empty")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {nextMonthActions.slice(0, 5).map((action) => {
                    const actionData = allActions.find((a) => a.id === action.id);
                    return (
                      <Link
                        key={action.id}
                        href={`/app/projects/${action.projectId}`}
                        className="block group"
                      >
                        <div className="text-sm text-foreground p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <CheckSquare2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 line-clamp-1">
                              {actionData?.title || `Action #${action.id.substring(0, 8)}`}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(action.dueDate!).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {nextMonthActions.length > 5 && (
                    <p className="text-xs text-slate-500 text-center mt-2">
                      +{nextMonthActions.length - 5} {t("nextMonth.upcomingActions.more")}
                    </p>
                  )}
                </div>
              )}
            </FlowCardContent>
          </FlowCard>

          {/* Projets à risque */}
          <FlowCard variant="default">
            <FlowCardHeader>
              <SectionTitle
                title={t("nextMonth.projectsAtRisk.title")}
                subtitle={t("nextMonth.projectsAtRisk.subtitle")}
                count={projectsAtRisk.length}
                size="sm"
              />
            </FlowCardHeader>
            <FlowCardContent>
              {projectsAtRisk.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("nextMonth.projectsAtRisk.empty")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectsAtRisk.map((project) => (
                    <Link
                      key={project.id}
                      href={`/app/projects/${project.id}`}
                      className="block group"
                    >
                      <div className="bg-white rounded-xl shadow-sm border border-transparent p-4 hover:shadow-md transition-all duration-200 dark:bg-card dark:border-border dark:shadow-none">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-amber-600 transition-colors">
                              {project.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{project.progressPercentage}% {t("nextMonth.projectsAtRisk.completed")}</span>
                              {project.overdueActions > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-600">{project.overdueActions} {t("nextMonth.projectsAtRisk.overdue")}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
