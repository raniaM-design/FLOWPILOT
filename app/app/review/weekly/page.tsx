import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { AlertTriangle, Ban, AlertCircle, CheckSquare2, Calendar, FolderKanban, ArrowRight, TrendingUp, Scale, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { calculateDecisionRisk } from "@/lib/decision-risk";
import { DecisionRiskBadge } from "@/components/decision-risk-badge";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";
import { ExportPptAction } from "./export-ppt-action";
import { PageHeader } from "@/components/ui/page-header";
import { PrintActionButton } from "@/components/print-action-button";
import { SectionTitle } from "@/components/ui/section-title";

export default async function WeeklyReviewPage() {
  const userId = await getCurrentUserIdOrThrow();

  // Dates pour la semaine
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 1) Décisions à surveiller (risk RED, max 5)
  const allDecisions = await prisma.decision.findMany({
    where: {
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

  type DecisionWithActions = (typeof allDecisions)[0];
  const riskyDecisions = allDecisions
    .map((decision: DecisionWithActions) => {
      const risk = calculateDecisionRisk(decision.actions);
      return {
        ...decision,
        risk,
      };
    })
    .filter((decision: { risk: ReturnType<typeof calculateDecisionRisk> }) => decision.risk.level === "RED")
    .slice(0, 5);

  // 2) Actions bloquées (status BLOCKED, max 10)
  const blockedActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: "BLOCKED",
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
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // 3) Actions en retard (overdue, max 10)
  const overdueActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        lt: now,
      },
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
    orderBy: {
      dueDate: "asc",
    },
    take: 10,
  });

  // 4) Décisions prises cette semaine (DECIDED createdAt within last 7 days)
  const recentDecisions = await prisma.decision.findMany({
    where: {
      createdById: userId,
      status: "DECIDED",
      createdAt: {
        gte: sevenDaysAgo,
      },
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

  // 5) Actions terminées cette semaine (DONE, updatedAt within last 7 days)
  const doneActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: "DONE",
      updatedAt: {
        gte: sevenDaysAgo,
      },
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
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
  });

  // Helper pour format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  // Calculer les statistiques de la semaine
  const weekStats = {
    decisionsTaken: recentDecisions.length,
    actionsCompleted: doneActions.length,
    actionsBlocked: blockedActions.length,
    actionsOverdue: overdueActions.length,
    decisionsAtRisk: riskyDecisions.length,
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-7xl mx-auto px-6 py-10">
        <div className="space-y-10">
          {/* Header avec date de la semaine */}
          <PageHeader
            title="Weekly Review"
            subtitle={`Bilan de la semaine du ${formatShortDate(sevenDaysAgo)} au ${formatShortDate(now)}. Ce qui avance, ce qui bloque, ce qui nécessite une décision.`}
            badge={
              riskyDecisions.length > 0
                ? {
                    label: `${riskyDecisions.length} à surveiller`,
                    variant: "destructive",
                  }
                : undefined
            }
            actions={[
              {
                label: "Exporter PDF",
                component: <PrintActionButton href="/app/review/weekly/print" />,
              },
              {
                label: "Exporter PPT",
                component: <ExportPptAction />,
              },
            ]}
          />

          {/* Statistiques de la semaine - Bilan visuel */}
          <FlowCard variant="elevated">
            <FlowCardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight mb-1">
                    Bilan de la semaine
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Vue d'ensemble de votre progression
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-emerald-950/30 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{weekStats.decisionsTaken}</div>
                  <div className="text-xs text-muted-foreground font-medium">Décisions prises</div>
                </div>
                <div className="text-center p-4 bg-emerald-950/30 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{weekStats.actionsCompleted}</div>
                  <div className="text-xs text-muted-foreground font-medium">Actions terminées</div>
                </div>
                <div className="text-center p-4 bg-amber-950/30 dark:bg-amber-950/40 rounded-xl border border-amber-500/20 dark:border-amber-500/30">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">{weekStats.actionsBlocked}</div>
                  <div className="text-xs text-muted-foreground font-medium">Actions bloquées</div>
                </div>
                <div className="text-center p-4 bg-red-950/30 dark:bg-red-950/40 rounded-xl border border-red-500/20 dark:border-red-500/30">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{weekStats.actionsOverdue}</div>
                  <div className="text-xs text-muted-foreground font-medium">Actions en retard</div>
                </div>
                <div className="text-center p-4 bg-orange-950/30 dark:bg-orange-950/40 rounded-xl border border-orange-500/20 dark:border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{weekStats.decisionsAtRisk}</div>
                  <div className="text-xs text-muted-foreground font-medium">Décisions à surveiller</div>
                </div>
              </div>
            </FlowCardContent>
          </FlowCard>

          {/* Section 1: Ce qui avance - Positif et motivant */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-emerald-200/30">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Ce qui avance
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Décisions prises cette semaine */}
              <FlowCard variant="default" className="bg-gradient-to-br from-emerald-50/30 via-white to-white border-emerald-200/60 shadow-sm">
                <FlowCardHeader>
                  <SectionTitle
                    title="Décisions prises"
                    subtitle="Les engagements que vous avez pris cette semaine"
                    count={recentDecisions.length}
                    size="md"
                  />
                </FlowCardHeader>
                <FlowCardContent>
                  {recentDecisions.length === 0 ? (
                    <div className="py-12 text-center">
                      <Scale className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Aucune décision prise cette semaine
                      </p>
                      <p className="text-xs text-slate-600">
                        Prenez le temps de documenter vos décisions importantes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentDecisions.map((decision: DecisionWithActions) => {
                        const risk = calculateDecisionRisk(decision.actions);
                        return (
                          <Link
                            key={decision.id}
                            href={`/app/decisions/${decision.id}`}
                            className="block group"
                          >
                            <div className="bg-white rounded-xl border border-emerald-200/60 p-4 hover:bg-emerald-50/30 hover:shadow-sm transition-all duration-200">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Scale className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                    {decision.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mb-2">
                                    <DecisionRiskBadge risk={risk} />
                                    <Chip variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200/60">
                                      {decision.actions.length} action{decision.actions.length > 1 ? "s" : ""}
                                    </Chip>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <FolderKanban className="h-3 w-3" />
                                      {decision.project.name}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatShortDate(decision.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </FlowCardContent>
              </FlowCard>

              {/* Actions terminées cette semaine */}
              <FlowCard variant="default" className="bg-gradient-to-br from-emerald-50/30 via-white to-white border-emerald-200/60 shadow-sm">
                <FlowCardHeader>
                  <SectionTitle
                    title="Actions terminées"
                    subtitle="Ce que vous avez accompli cette semaine"
                    count={doneActions.length}
                    size="md"
                  />
                </FlowCardHeader>
                <FlowCardContent>
                  {doneActions.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckSquare2 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Aucune action terminée cette semaine
                      </p>
                      <p className="text-xs text-slate-600">
                        Marquez vos actions comme terminées pour suivre votre progression
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {doneActions.map((action: typeof doneActions[0]) => (
                        <Link
                          key={action.id}
                          href={action.decision ? `/app/decisions/${action.decision.id}` : `/app/projects/${action.project.id}`}
                          className="block group"
                        >
                          <div className="bg-white rounded-xl border border-emerald-200/60 p-4 hover:bg-emerald-50/30 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckSquare2 className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2 line-through text-slate-500 group-hover:text-emerald-600 transition-colors">
                                  {action.title}
                                </h4>
                                {action.decision && (
                                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 mb-2">
                                    <Scale className="h-3 w-3" />
                                    <span className="font-medium">{action.decision.title}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <FolderKanban className="h-3 w-3" />
                                    {action.project.name}
                                  </span>
                                </div>
                              </div>
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

          {/* Section 2: Ce qui bloque - Nécessite attention */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-amber-200/30">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Ban className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Ce qui bloque
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actions bloquées */}
              <FlowCard variant="default" className="bg-gradient-to-br from-amber-50/30 via-white to-white border-amber-200/60 shadow-sm">
                <FlowCardHeader>
                  <SectionTitle
                    title="Actions bloquées"
                    subtitle="Ces actions nécessitent une intervention pour être débloquées"
                    count={blockedActions.length}
                    size="md"
                  />
                </FlowCardHeader>
                <FlowCardContent>
                  {blockedActions.length === 0 ? (
                    <div className="py-12 text-center">
                      <Sparkles className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Aucune action bloquée
                      </p>
                      <p className="text-xs text-slate-600">
                        Tout avance sans interruption. Excellent !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blockedActions.map((action: typeof blockedActions[0]) => (
                        <Link
                          key={action.id}
                          href={action.decision ? `/app/decisions/${action.decision.id}` : `/app/projects/${action.project.id}`}
                          className="block group"
                        >
                          <div className="bg-white rounded-xl border border-amber-200/60 p-4 hover:bg-amber-50/30 hover:shadow-sm transition-all duration-200 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl" />
                            <div className="flex items-start gap-3 pl-4">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Ban className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                                  {action.title}
                                </h4>
                                {action.decision && (
                                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 mb-2">
                                    <Scale className="h-3 w-3" />
                                    <span className="font-medium">{action.decision.title}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <FolderKanban className="h-3 w-3" />
                                    {action.project.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </FlowCardContent>
              </FlowCard>

              {/* Actions en retard */}
              <FlowCard variant="default" className="bg-gradient-to-br from-red-50/30 via-white to-white border-red-200/60 shadow-sm">
                <FlowCardHeader>
                  <SectionTitle
                    title="Actions en retard"
                    subtitle="Ces actions ont dépassé leur échéance"
                    count={overdueActions.length}
                    size="md"
                  />
                </FlowCardHeader>
                <FlowCardContent>
                  {overdueActions.length === 0 ? (
                    <div className="py-12 text-center">
                      <Sparkles className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Aucune action en retard
                      </p>
                      <p className="text-xs text-slate-600">
                        Vous êtes dans les temps. Parfait !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overdueActions.map((action: typeof overdueActions[0]) => (
                        <Link
                          key={action.id}
                          href={action.decision ? `/app/decisions/${action.decision.id}` : `/app/projects/${action.project.id}`}
                          className="block group"
                        >
                          <div className="bg-white rounded-xl border border-red-200/60 p-4 hover:bg-red-50/30 hover:shadow-sm transition-all duration-200 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />
                            <div className="flex items-start gap-3 pl-4">
                              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                                  {action.title}
                                </h4>
                                {action.decision && (
                                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 mb-2">
                                    <Scale className="h-3 w-3" />
                                    <span className="font-medium">{action.decision.title}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <FolderKanban className="h-3 w-3" />
                                    {action.project.name}
                                  </span>
                                  {action.dueDate && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatShortDate(action.dueDate)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
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

          {/* Section 3: Ce qui nécessite une décision - Décisions à surveiller */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-orange-200/30 dark:border-orange-500/30">
              <div className="w-10 h-10 rounded-lg bg-orange-950/30 dark:bg-orange-950/40 flex items-center justify-center border border-orange-500/20 dark:border-orange-500/30">
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Ce qui nécessite une décision
              </h2>
            </div>

            <FlowCard variant="default">
              <FlowCardHeader>
                <SectionTitle
                  title="Décisions à surveiller"
                  subtitle="Ces décisions nécessitent votre attention pour éviter les blocages"
                  count={riskyDecisions.length}
                  size="md"
                />
              </FlowCardHeader>
              <FlowCardContent>
                {riskyDecisions.length === 0 ? (
                  <div className="py-12 text-center">
                    <Sparkles className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Aucune décision critique
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Toutes vos décisions sont bien suivies. Excellent travail !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riskyDecisions.map((decision: typeof riskyDecisions[0]) => (
                      <Link
                        key={decision.id}
                        href={`/app/decisions/${decision.id}`}
                        className="block group"
                      >
                        <div className="bg-white rounded-xl shadow-sm border border-transparent p-5 hover:shadow-md transition-all duration-200 relative dark:bg-card dark:border-border dark:shadow-none">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-xl" />
                          <div className="flex items-start gap-2 pl-4">
                            <Target className="mt-0.5 h-4 w-4 text-slate-700 dark:text-slate-300 flex-shrink-0" strokeWidth={1.75} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base text-foreground mb-3 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                {decision.title}
                              </h4>
                              <div className="flex items-center gap-2 mb-3">
                                <DecisionRiskBadge risk={decision.risk} />
                                <Chip variant="info" size="sm" className="">
                                  {decision.actions.length} action{decision.actions.length > 1 ? "s" : ""}
                                </Chip>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FolderKanban className="h-3 w-3" />
                                  {decision.project.name}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatShortDate(decision.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {riskyDecisions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href="/app/decisions/risk" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <span>Voir toutes les décisions à surveiller</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </FlowCardContent>
            </FlowCard>
          </div>
        </div>
      </div>
    </div>
  );
}
