import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { FlowCard, FlowCardContent, FlowCardHeader } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { AlertTriangle, Ban, AlertCircle, CheckSquare2, Calendar, FolderKanban, ArrowRight, TrendingUp, Scale, Sparkles, Target, CheckSquare } from "lucide-react";
import Link from "next/link";
import { calculateDecisionRisk } from "@/lib/decision-risk";
import { DecisionRiskBadge } from "@/components/decision-risk-badge";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";
import { SectionTitle } from "@/components/ui/section-title";

export async function WeeklyReview() {
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
    <div className="space-y-10">
      {/* Statistiques de la semaine - Bilan visuel */}
      <FlowCard variant="default" className="bg-white border border-[#E5E7EB] shadow-sm">
        <FlowCardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#111111] tracking-tight mb-1">
                Bilan de la semaine
              </h3>
              <p className="text-sm text-[#667085]">
                Vue d'ensemble de votre progression
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-5 bg-[#F0FDF4] rounded-xl border border-[#D1FAE5] shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-[#059669]" />
              </div>
              <div className="text-2xl font-bold text-[#059669] mb-1">{weekStats.decisionsTaken}</div>
              <div className="text-xs text-[#059669] font-medium">Décisions prises</div>
            </div>
            <div className="text-center p-5 bg-[#F0FDF4] rounded-xl border border-[#D1FAE5] shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <CheckSquare className="h-5 w-5 text-[#059669]" />
              </div>
              <div className="text-2xl font-bold text-[#059669] mb-1">{weekStats.actionsCompleted}</div>
              <div className="text-xs text-[#059669] font-medium">Actions terminées</div>
            </div>
            <div className="text-center p-5 bg-[#FFFBEB] rounded-xl border border-[#FEF3C7] shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Ban className="h-5 w-5 text-[#D97706]" />
              </div>
              <div className="text-2xl font-bold text-[#D97706] mb-1">{weekStats.actionsBlocked}</div>
              <div className="text-xs text-[#D97706] font-medium">Actions bloquées</div>
            </div>
            <div className="text-center p-5 bg-[#FEF2F2] rounded-xl border border-[#FEE2E2] shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-5 w-5 text-[#DC2626]" />
              </div>
              <div className="text-2xl font-bold text-[#DC2626] mb-1">{weekStats.actionsOverdue}</div>
              <div className="text-xs text-[#DC2626] font-medium">Actions en retard</div>
            </div>
            <div className="text-center p-5 bg-[#FFFBEB] rounded-xl border border-[#FEF3C7] shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-[#D97706]" />
              </div>
              <div className="text-2xl font-bold text-[#D97706] mb-1">{weekStats.decisionsAtRisk}</div>
              <div className="text-xs text-[#D97706] font-medium">Décisions à surveiller</div>
            </div>
          </div>
        </FlowCardContent>
      </FlowCard>

      {/* Section 1: Ce qui avance */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-[#E5E7EB]">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] flex items-center justify-center border border-[#D1FAE5]">
            <TrendingUp className="h-5 w-5 text-[#059669]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Ce qui avance
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Décisions prises cette semaine */}
          <FlowCard variant="default" className="bg-white border border-[#E5E7EB] shadow-sm">
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
                  <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#D1FAE5] flex items-center justify-center mx-auto mb-3">
                    <Scale className="h-8 w-8 text-[#059669]" />
                  </div>
                  <p className="text-sm font-medium text-[#111111] mb-1">
                    Aucune décision prise cette semaine
                  </p>
                  <p className="text-xs text-[#667085]">
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
                        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-4 hover:border-[#059669]/30 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#D1FAE5]">
                              <Target className="h-4 w-4 text-[#059669]" strokeWidth={1.75} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-[#111111] mb-2 line-clamp-2 group-hover:text-[#059669] transition-colors">
                                {decision.title}
                              </h4>
                              <div className="flex items-center gap-2 mb-2">
                                <DecisionRiskBadge risk={risk} />
                                <Chip variant="success" size="sm" className="bg-[#F0FDF4] text-[#059669] border-[#D1FAE5]">
                                  {decision.actions.length} action{decision.actions.length > 1 ? "s" : ""}
                                </Chip>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#667085]">
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
          <FlowCard variant="default" className="bg-white border border-[#E5E7EB] shadow-sm">
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
                  <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#D1FAE5] flex items-center justify-center mx-auto mb-3">
                    <CheckSquare2 className="h-8 w-8 text-[#059669]" />
                  </div>
                  <p className="text-sm font-medium text-[#111111] mb-1">
                    Aucune action terminée cette semaine
                  </p>
                  <p className="text-xs text-[#667085]">
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
                      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-4 hover:border-[#059669]/30 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#D1FAE5]">
                            <CheckSquare className="h-4 w-4 text-[#059669]" strokeWidth={1.75} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-[#111111] mb-2 line-clamp-2 line-through text-[#667085] group-hover:text-[#059669] transition-colors">
                              {action.title}
                            </h4>
                            {action.decision && (
                              <div className="flex items-center gap-1.5 text-xs text-[#2563EB] mb-2">
                                <Scale className="h-3 w-3" />
                                <span className="font-medium">{action.decision.title}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-[#667085]">
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

      {/* Section 2: Ce qui bloque */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-[#E5E7EB]">
          <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center border border-[#FEF3C7]">
            <Ban className="h-5 w-5 text-[#D97706]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Ce qui bloque
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions bloquées */}
          <FlowCard variant="default" className="bg-white border border-[#E5E7EB] shadow-sm">
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
                  <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#D1FAE5] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-8 w-8 text-[#059669]" />
                  </div>
                  <p className="text-sm font-medium text-[#111111] mb-1">
                    Aucune action bloquée
                  </p>
                  <p className="text-xs text-[#667085]">
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
                      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-4 hover:border-[#D97706]/30 hover:shadow-md transition-all duration-200 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B] rounded-l-xl" />
                        <div className="flex items-start gap-3 pl-4">
                          <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#FEF3C7]">
                            <Ban className="h-4 w-4 text-[#D97706]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-[#111111] mb-2 line-clamp-2 group-hover:text-[#D97706] transition-colors">
                              {action.title}
                            </h4>
                            {action.decision && (
                              <div className="flex items-center gap-1.5 text-xs text-[#2563EB] mb-2">
                                <Scale className="h-3 w-3" />
                                <span className="font-medium">{action.decision.title}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-[#667085]">
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
          <FlowCard variant="default" className="bg-white border border-[#E5E7EB] shadow-sm">
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
                  <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#D1FAE5] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-8 w-8 text-[#059669]" />
                  </div>
                  <p className="text-sm font-medium text-[#111111] mb-1">
                    Aucune action en retard
                  </p>
                  <p className="text-xs text-[#667085]">
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
                      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-4 hover:border-[#DC2626]/30 hover:shadow-md transition-all duration-200 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#EF4444] rounded-l-xl" />
                        <div className="flex items-start gap-3 pl-4">
                          <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#FEE2E2]">
                              <AlertCircle className="h-4 w-4 text-[#DC2626]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-[#111111] mb-2 line-clamp-2 group-hover:text-[#DC2626] transition-colors">
                              {action.title}
                            </h4>
                            {action.decision && (
                              <div className="flex items-center gap-1.5 text-xs text-[#2563EB] mb-2">
                                <Scale className="h-3 w-3" />
                                <span className="font-medium">{action.decision.title}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-[#667085]">
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

      {/* Section 3: Ce qui nécessite une décision */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-[#E5E7EB]">
          <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center border border-[#FEF3C7]">
            <Target className="h-5 w-5 text-[#D97706]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Ce qui nécessite une décision
          </h2>
        </div>

        <FlowCard variant="default" className="bg-white border border-[#E5E7EB] shadow-sm">
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
                <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#D1FAE5] flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-8 w-8 text-[#059669]" />
                </div>
                <p className="text-sm font-medium text-[#111111] mb-1">
                  Aucune décision critique
                </p>
                <p className="text-xs text-[#667085]">
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
                    <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-5 hover:border-[#D97706]/30 hover:shadow-md transition-all duration-200 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B] rounded-l-xl" />
                      <div className="flex items-start gap-3 pl-4">
                        <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center flex-shrink-0 border border-[#FEF3C7]">
                          <Scale className="h-5 w-5 text-[#D97706]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-[#111111] mb-3 line-clamp-2 group-hover:text-[#D97706] transition-colors">
                            {decision.title}
                          </h4>
                          <div className="flex items-center gap-2 mb-3">
                            <DecisionRiskBadge risk={decision.risk} />
                            <Chip variant="info" size="sm" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                              {decision.actions.length} action{decision.actions.length > 1 ? "s" : ""}
                            </Chip>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#667085]">
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
              <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                <Link href="/app/decisions/risk" className="flex items-center justify-center gap-2 text-sm text-[#667085] hover:text-[#2563EB] transition-colors">
                  <span>Voir toutes les décisions à surveiller</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </FlowCardContent>
        </FlowCard>
      </div>
    </div>
  );
}

