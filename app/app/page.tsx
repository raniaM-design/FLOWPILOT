import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { SectionTitle } from "@/components/ui/section-title";
import { AlertCircle, Calendar, AlertTriangle, Ban } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";
import { getPlanContext } from "@/lib/billing/getPlanContext";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { calculateDecisionMeta } from "@/lib/decisions/decision-meta";
import { FocusToday } from "@/components/dashboard/focus-today";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { CreateMenu } from "@/components/dashboard/create-menu";
import { DecisionsList } from "@/components/dashboard/decisions-list";
import { DashboardActionsList } from "@/components/dashboard/dashboard-actions-list";
import { PendingInvitations } from "@/components/collaboration/pending-invitations";

export default async function AppPage() {
  // Le layout vérifie déjà l'authentification, donc on peut utiliser getCurrentUserId directement
  const userId = await getCurrentUserId();
  
  // Sécurité supplémentaire : si pas d'userId (ne devrait jamais arriver grâce au layout)
  if (!userId) {
    return null; // Le layout redirigera déjà vers /login
  }

  // Récupérer le plan d'abonnement
  let isEnterprise = false;
  try {
    const planContext = await getPlanContext();
    isEnterprise = planContext.isEnterprise;
  } catch (error) {
    console.error("[app/page] Erreur lors de la récupération du plan:", error);
    // En cas d'erreur, considérer comme non-enterprise
    isEnterprise = false;
  }

  // Récupérer les informations de l'entreprise de l'utilisateur
  let userCompany: any = null;
  let hasCompany = false;
  let isCompanyAdmin = false;
  
  try {
    // Essayer d'abord avec isCompanyAdmin (si la colonne existe)
    userCompany = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        companyId: true,
        isCompanyAdmin: true,
        company: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                id: true,
                email: true,
                isCompanyAdmin: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });
    hasCompany = !!userCompany?.companyId;
    isCompanyAdmin = userCompany?.isCompanyAdmin ?? false;
  } catch (error: any) {
    // Si la colonne isCompanyAdmin n'existe pas, réessayer sans
    if (error?.code === 'P2022' || error?.message?.includes('isCompanyAdmin')) {
      console.log("[app/page] Colonne isCompanyAdmin non trouvée, réessai sans cette colonne");
      try {
        userCompany = await (prisma as any).user.findUnique({
          where: { id: userId },
          select: {
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                members: {
                  select: {
                    id: true,
                    email: true,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        });
        hasCompany = !!userCompany?.companyId;
        isCompanyAdmin = false; // Par défaut si la colonne n'existe pas
      } catch (retryError) {
        console.error("[app/page] Erreur lors de la récupération de l'entreprise (retry):", retryError);
        userCompany = null;
        hasCompany = false;
        isCompanyAdmin = false;
      }
    } else {
      console.error("[app/page] Erreur lors de la récupération de l'entreprise:", error);
      userCompany = null;
      hasCompany = false;
      isCompanyAdmin = false;
    }
  }

  // Récupérer les projets accessibles (propriétaires + membres entreprise)
  const projectsWhere = await getAccessibleProjectsWhere(userId);

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
  let overdueActions: any[] = [];
  try {
    overdueActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        lt: todayStart,
      },
      project: projectsWhere,
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
  } catch (error) {
    console.error("[app/page] Erreur lors de la récupération des actions en retard:", error);
    overdueActions = [];
  }

  // Actions à venir cette semaine : assigneeId = userId, status != DONE, dueDate entre aujourd'hui et J+7
  let upcomingActions: any[] = [];
  try {
    upcomingActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        gte: todayStart,
        lte: nextWeek,
      },
      project: projectsWhere,
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
  } catch (error) {
    console.error("[app/page] Erreur lors de la récupération des actions à venir:", error);
    upcomingActions = [];
  }

  // Actions bloquées : assigneeId = userId, status = BLOCKED
  let blockedActions: any[] = [];
  try {
    blockedActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: "BLOCKED",
      project: projectsWhere,
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
  } catch (error) {
    console.error("[app/page] Erreur lors de la récupération des actions bloquées:", error);
    blockedActions = [];
  }

  // Décisions à surveiller : toutes les décisions avec Risk Level = RED (max 5)
  let allDecisions: any[] = [];
  try {
    allDecisions = await prisma.decision.findMany({
    where: {
      project: projectsWhere,
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
  } catch (error) {
    console.error("[app/page] Erreur lors de la récupération des décisions:", error);
    allDecisions = [];
  }

  const riskyDecisionsWithNulls = allDecisions.map((decision: any) => {
    try {
      return {
        decision,
        meta: calculateDecisionMeta(decision),
      };
    } catch (error) {
      console.error("[app/page] Erreur lors du calcul de meta pour décision:", error);
      return null;
    }
  });

  const riskyDecisions = riskyDecisionsWithNulls
    .filter((item): item is NonNullable<typeof item> => item !== null && item !== undefined)
    .filter((item) => item.meta?.risk?.level === "RED");

  // Récupérer l'email de l'utilisateur pour le message personnalisé
  let user: { email: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
  } catch (error) {
    console.error("[app/page] Erreur lors de la récupération de l'utilisateur:", error);
    user = null;
  }

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
    <div className="space-y-6 sm:space-y-10">
      {/* Header Dashboard avec message personnalisé */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">
          <div className="flex-1">
            {firstName ? (
              <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">
                Bonjour {firstName}
              </h1>
            ) : (
              <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">
                Dashboard
              </h1>
            )}
            <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed">
              Voici ce qui nécessite votre attention aujourd'hui
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Colonne gauche */}
        <div className="space-y-6 sm:space-y-8">
          {/* Décisions à surveiller */}
          <FlowCard variant="default" className="border-l-4 border-amber-500 bg-gradient-to-r from-amber-50/50 via-transparent to-transparent">
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
                  <Link href="/app/decisions/risk" className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors duration-150">
                    Voir tout
                  </Link>
                )}
              </div>
              <DecisionsList decisions={riskyDecisions} itemsPerPage={3} />
            </FlowCardContent>
          </FlowCard>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6 sm:space-y-8">
          {/* Actions en retard */}
          <FlowCard variant="default" className="border-l-4 border-red-500 bg-gradient-to-r from-red-50/50 via-transparent to-transparent">
            <FlowCardContent className="space-y-5">
              <SectionTitle
                title="Actions en retard"
                subtitle="Ces actions ont dépassé leur échéance. Commencez par les plus anciennes."
                count={overdueActions.length}
                size="md"
                accentColor="red"
                icon={<AlertCircle className="h-4 w-4" />}
              />
              <DashboardActionsList actions={overdueActions} type="overdue" />
            </FlowCardContent>
          </FlowCard>

          {/* Actions bloquées */}
          {blockedActions.length > 0 && (
            <FlowCard variant="default" className="border-l-4 border-orange-500 bg-gradient-to-r from-orange-50/50 via-transparent to-transparent">
              <FlowCardContent className="space-y-5">
                <SectionTitle
                  title="Actions bloquées"
                  subtitle="Ces actions attendent une intervention. Identifiez ce qui les bloque pour avancer."
                  count={blockedActions.length}
                  size="md"
                  accentColor="amber"
                  icon={<Ban className="h-4 w-4" />}
                />
                <DashboardActionsList actions={blockedActions.slice(0, 3)} type="blocked" />
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Actions de la semaine */}
          <FlowCard variant="default" className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/50 via-transparent to-transparent">
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
                  <Link href="/app/actions?filter=week" className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors duration-150">
                    Voir tout
                  </Link>
                )}
              </div>
              <DashboardActionsList actions={upcomingActions.slice(0, 5)} type="upcoming" />
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
