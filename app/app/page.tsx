import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { SectionTitle } from "@/components/ui/section-title";
import { AlertCircle, Calendar, CheckSquare2, FolderKanban, ListTodo, AlertTriangle, ArrowRight, Ban, CheckSquare } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { DecisionCard } from "@/components/decisions/decision-card";
import { calculateDecisionMeta } from "@/lib/decisions/decision-meta";
import { Button } from "@/components/ui/button";
import { FocusToday } from "@/components/dashboard/focus-today";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { CreateMenu } from "@/components/dashboard/create-menu";
import { DecisionsList } from "@/components/dashboard/decisions-list";
import { PendingInvitations } from "@/components/collaboration/pending-invitations";

export default async function AppPage() {
  const userId = await getCurrentUserIdOrThrow();

  // Date du jour (début de journée)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Date dans 7 jours (fin de journée)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Actions en retard : assigneeId = userId, status != DONE, dueDate < aujourd'hui
  const overdueActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        lt: todayStart,
      },
      project: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      projectId: true,
      decisionId: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      decision: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Actions à venir cette semaine : assigneeId = userId, status != DONE, dueDate entre aujourd'hui et J+7
  const upcomingActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        gte: todayStart,
        lte: nextWeek,
      },
      project: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      projectId: true,
      decisionId: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      decision: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Actions bloquées : assigneeId = userId, status = BLOCKED
  const blockedActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: "BLOCKED",
      project: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      projectId: true,
      decisionId: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      decision: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Décisions à surveiller : toutes les décisions avec Risk Level = RED (max 5)
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
  });

  const riskyDecisions = allDecisions
    .map((decision: any) => ({
      decision,
      meta: calculateDecisionMeta(decision),
    }))
    .filter((item: any) => item.meta.risk.level === "RED");

  // Récupérer l'email de l'utilisateur pour le message personnalisé
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // Extraire le prénom de l'email (partie avant @)
  const getUserFirstName = (email: string | null | undefined): string => {
    if (!email) return "";
    const namePart = email.split("@")[0];
    // Capitaliser la première lettre
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).split(".")[0];
  };

  const firstName = getUserFirstName(user?.email || null);

  // Calculer les compteurs pour les stats
  const overdueCount = overdueActions.length;
  const blockedCount = blockedActions.length;
  const weekCount = upcomingActions.length;

  // Actions bloquées parmi les actions en retard
  const blockedOverdueActions = overdueActions.filter((action) => action.status === "BLOCKED");

  // Actions prioritaires pour "Focus du jour" (max 3)
  // Priorité: retard → bloqué → semaine
  const priorityActions = [
    ...overdueActions.slice(0, 3),
    ...(overdueActions.length < 3 ? blockedActions.slice(0, 3 - overdueActions.length) : []),
    ...(overdueActions.length + blockedActions.length < 3 ? upcomingActions.slice(0, 3 - overdueActions.length - blockedActions.length) : []),
  ].slice(0, 3);

  const getUrgencyLabel = (dueDate: Date | null, overdue: boolean): string | null => {
    if (!dueDate) return null;
    if (overdue) return "En retard";
    const dueMeta = getDueMeta(dueDate);
    switch (dueMeta.kind) {
      case "TODAY":
        return "Aujourd'hui";
      case "THIS_WEEK":
        return "Cette semaine";
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10">
      {/* Header Dashboard avec message personnalisé */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex-1">
            {firstName ? (
              <h1 className="text-3xl font-medium text-foreground leading-tight">
                Bonjour {firstName}
              </h1>
            ) : (
              <h1 className="text-3xl font-medium text-foreground leading-tight">
                Dashboard
              </h1>
            )}
            <p className="text-base text-text-secondary mt-2 leading-relaxed">
              Voici ce qui nécessite votre attention aujourd'hui
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateMenu />
          </div>
        </div>
        {overdueCount > 0 || blockedCount > 0 ? (
          <div className="pt-2">
            <DashboardStats
              overdueCount={overdueCount}
              blockedCount={blockedCount}
              weekCount={weekCount}
            />
          </div>
        ) : null}
      </div>

      {/* Action principale du jour */}
      <FocusToday actions={priorityActions} />

      {/* Invitations en attente */}
      <FlowCard variant="default">
        <FlowCardContent className="space-y-5">
          <PendingInvitations />
        </FlowCardContent>
      </FlowCard>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne gauche */}
        <div className="space-y-8">
          {/* Décisions à surveiller */}
          <FlowCard variant="default">
            <FlowCardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <SectionTitle
                  title="Décisions à surveiller"
                  subtitle="Ces décisions nécessitent votre attention pour rester sur la bonne voie"
                  count={riskyDecisions.length}
                  size="md"
                  accentColor="amber"
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
                {riskyDecisions.length > 0 && (
                  <Link href="/app/decisions/risk" className="text-sm text-text-secondary hover:text-primary transition-colors duration-150">
                    Voir tout
                  </Link>
                )}
              </div>
              <DecisionsList decisions={riskyDecisions} itemsPerPage={3} />
            </FlowCardContent>
          </FlowCard>
        </div>

        {/* Colonne droite */}
        <div className="space-y-8">
          {/* Actions en retard */}
          <FlowCard variant="default">
            <FlowCardContent className="space-y-5">
              <SectionTitle
                title="Actions en retard"
                subtitle="Ces actions ont dépassé leur échéance. Commencez par les plus anciennes."
                count={overdueActions.length}
                size="md"
                accentColor="red"
                icon={<AlertCircle className="h-4 w-4" />}
              />
              {overdueActions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-normal text-text-secondary leading-relaxed">
                    Aucune action en retard. Tout est à jour pour aujourd'hui.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueActions.map((action: {
                    id: string;
                    title: string;
                    status: string;
                    dueDate: Date | null;
                    projectId: string;
                    project: { id: string; name: string };
                    decisionId: string | null;
                    decision: { id: string } | null;
                  }) => {
                    const dueMeta = getDueMeta(action.dueDate);
                    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
                    const urgencyLabel = getUrgencyLabel(action.dueDate, overdue);
                    return (
                      <Link
                        key={action.id}
                        href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                        className="block group"
                      >
                        <div className="bg-section-bg/50 rounded-xl shadow-premium p-5 hover:bg-hover-bg transition-all duration-150 ease-out">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--danger-bg))' }}>
                                  <CheckSquare className="h-3.5 w-3.5" style={{ color: 'hsl(var(--danger))' }} strokeWidth={1.75} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-150 ease-out">
                                      {action.title}
                                    </h4>
                                    <Chip variant="danger" size="sm">
                                      {urgencyLabel || "En retard"}
                                    </Chip>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FolderKanban className="h-3 w-3" />
                                  {action.project.name}
                                </span>
                                {action.dueDate && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(action.dueDate).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ActionStatusWrapper>
                              <ActionStatusButtons
                                actionId={action.id}
                                currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                              />
                            </ActionStatusWrapper>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </FlowCardContent>
          </FlowCard>

          {/* Actions bloquées */}
          {blockedActions.length > 0 && (
            <FlowCard variant="default">
              <FlowCardContent className="space-y-5">
                <SectionTitle
                  title="Actions bloquées"
                  subtitle="Ces actions attendent une intervention. Identifiez ce qui les bloque pour avancer."
                  count={blockedActions.length}
                  size="md"
                  accentColor="red"
                  icon={<Ban className="h-4 w-4" />}
                />
                <div className="space-y-3">
                  {blockedActions.slice(0, 3).map((action: {
                    id: string;
                    title: string;
                    status: string;
                    dueDate: Date | null;
                    projectId: string;
                    project: { id: string; name: string };
                    decisionId: string | null;
                    decision: { id: string } | null;
                  }) => {
                    const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
                    return (
                      <Link
                        key={action.id}
                        href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                        className="block group"
                      >
                        <div className="bg-section-bg/40 rounded-xl shadow-premium p-5 hover:bg-hover-bg/80 transition-all duration-200 ease-out">
                          <div className="flex items-start justify-between gap-5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--warning-bg) / 0.6)' }}>
                                  <CheckSquare className="h-4 w-4" style={{ color: 'hsl(var(--warning) / 0.8)' }} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-base text-foreground group-hover:text-primary transition-colors duration-200 ease-out leading-relaxed mb-2">
                                    {action.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="font-normal">{action.project.name}</span>
                                    {overdue && (
                                      <>
                                        <span className="text-border">•</span>
                                        <Chip variant="danger" size="sm" className="font-normal">En retard</Chip>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ActionStatusWrapper>
                              <ActionStatusButtons
                                actionId={action.id}
                                currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                              />
                            </ActionStatusWrapper>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Actions de la semaine */}
          <FlowCard variant="default">
            <FlowCardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <SectionTitle
                  title="Actions de la semaine"
                  subtitle="Ces actions sont prévues dans les 7 prochains jours. Vous avez le temps de les planifier."
                  count={upcomingActions.length}
                  size="md"
                  accentColor="blue"
                  icon={<Calendar className="h-4 w-4" />}
                />
                {upcomingActions.length > 0 && (
                  <Link href="/app/actions?filter=week" className="text-sm text-text-secondary hover:text-primary transition-colors duration-150">
                    Voir tout
                  </Link>
                )}
              </div>
              {upcomingActions.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-normal text-text-secondary leading-relaxed">
                    Aucune action prévue cette semaine. Profitez-en pour vous concentrer sur vos priorités du jour.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingActions.slice(0, 5).map((action: {
                    id: string;
                    title: string;
                    status: string;
                    dueDate: Date | null;
                    projectId: string;
                    project: { id: string; name: string };
                    decisionId: string | null;
                    decision: { id: string } | null;
                  }) => {
                    const dueMeta = getDueMeta(action.dueDate);
                    const urgencyLabel = getUrgencyLabel(action.dueDate, false);
                    
                    return (
                      <Link
                        key={action.id}
                        href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                        className="block group"
                      >
                        <div className="bg-section-bg/40 rounded-xl shadow-premium p-5 hover:bg-hover-bg/80 transition-all duration-200 ease-out">
                          <div className="flex items-start justify-between gap-5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--accent) / 0.4)' }}>
                                  <CheckSquare className="h-4 w-4" style={{ color: 'hsl(var(--primary) / 0.9)' }} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-base text-foreground group-hover:text-primary transition-colors duration-200 ease-out leading-relaxed mb-2">
                                    {action.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="font-normal">{action.project.name}</span>
                                    {action.dueDate && (
                                      <>
                                        <span className="text-border">•</span>
                                        <span className="flex items-center gap-1.5 font-normal">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(action.dueDate).toLocaleDateString("fr-FR", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      </>
                                    )}
                                    {urgencyLabel && (
                                      <>
                                        <span className="text-border">•</span>
                                        <Chip variant="info" size="sm" className="font-normal">{urgencyLabel}</Chip>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ActionStatusWrapper>
                              <ActionStatusButtons
                                actionId={action.id}
                                currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                              />
                            </ActionStatusWrapper>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
