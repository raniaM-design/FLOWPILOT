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
import { CreateMenu } from "@/components/dashboard/create-menu";
import { CompactStatistics } from "@/components/dashboard/compact-statistics";
import { PrioritiesList } from "@/components/dashboard/priorities-list";
import { UpcomingSection } from "@/components/dashboard/upcoming-section";
import { DecisionsSection } from "@/components/dashboard/decisions-section";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { VisualOnboarding } from "@/components/onboarding/visual-onboarding";
import { getOnboardingSteps, isNewUser } from "@/lib/onboarding/getOnboardingSteps";

export default async function AppPage() {
  // Le layout vérifie déjà l'authentification, donc on peut utiliser getCurrentUserId directement
  const userId = await getCurrentUserId();
  
  // Sécurité supplémentaire : si pas d'userId (ne devrait jamais arriver grâce au layout)
  if (!userId) {
    return null; // Le layout redirigera déjà vers /login
  }

  // Récupérer les étapes d'onboarding complétées
  const completedOnboardingSteps = await getOnboardingSteps(userId);
  // Ne plus afficher l'onboarding si toutes les étapes sont complétées (6 étapes) ou si l'utilisateur a déjà complété l'onboarding
  // L'onboarding ne s'affiche que pour les nouveaux utilisateurs et seulement si pas toutes les étapes sont complétées
  const isNew = await isNewUser(userId);
  const allStepsCompleted = completedOnboardingSteps.length >= 6;
  // Ne pas afficher l'onboarding si toutes les étapes sont complétées OU si l'utilisateur n'est plus nouveau
  const showOnboarding = isNew && completedOnboardingSteps.length === 0;

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
  // Inclure les décisions des projets accessibles + celles où l'utilisateur est mentionné
  let allDecisions: any[] = [];
  try {
    // Récupérer les IDs des décisions où l'utilisateur est mentionné
    const mentionedDecisionIds = await (prisma as any).decisionMention.findMany({
      where: {
        userId,
      },
      select: {
        decisionId: true,
      },
    }).then((mentions: any[]) => mentions.map((m: any) => m.decisionId));

    allDecisions = await (prisma as any).decision.findMany({
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

  // Actions d'aujourd'hui
  const todayActions = await prisma.actionItem.findMany({
    where: {
      assigneeId: userId,
      status: {
        not: "DONE",
      },
      dueDate: {
        gte: todayStart,
        lte: todayEnd,
      },
      project: projectsWhere,
    },
    select: {
      id: true,
    },
  });
  const todayCount = todayActions.length;

  // Total des actions (non terminées)
  const totalActions = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      project: projectsWhere,
    },
  });

  // Actions terminées
  const completedActions = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      status: "DONE",
      project: projectsWhere,
    },
  });

  // Projets actifs
  const activeProjects = await prisma.project.count({
    where: {
      ...projectsWhere,
      status: {
        in: ["ACTIVE", "IN_PROGRESS"],
      },
    },
  });

  // Tâches en cours (non terminées)
  const tasksInProgress = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      status: {
        in: ["TODO", "DOING", "BLOCKED"],
      },
      project: projectsWhere,
    },
  });

  // Calculer la progression moyenne (actions terminées / total actions)
  const totalActionsForProgress = await prisma.actionItem.count({
    where: {
      assigneeId: userId,
      project: projectsWhere,
    },
  });
  const averageProgress = totalActionsForProgress > 0 
    ? Math.round((completedActions / totalActionsForProgress) * 100)
    : 0;

  // Liste intelligente des priorités : retard → bloqué → semaine/aujourd'hui
  // Exclure les actions bloquées qui sont déjà en retard pour éviter les doublons
  const blockedNotOverdue = blockedActions.filter(
    (action) => !isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED")
  );
  
  // Actions de cette semaine (exclure celles déjà en retard ou bloquées)
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  
  const upcomingNotPriority = upcomingActions.filter((action) => {
    const isOverdueAction = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    const isBlockedAction = action.status === "BLOCKED";
    return !isOverdueAction && !isBlockedAction;
  });

  // Liste finale des priorités : retard → bloqué → semaine
  const prioritiesList = [
    ...overdueActions,
    ...blockedNotOverdue,
    ...upcomingNotPriority,
  ].slice(0, 7); // Maximum 7 items

  // Actions à venir (7 jours) - pour la section secondaire
  const upcomingForSection = upcomingActions.filter((action) => {
    const isOverdueAction = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    const isBlockedAction = action.status === "BLOCKED";
    return !isOverdueAction && !isBlockedAction && action.dueDate && 
           new Date(action.dueDate) >= weekStart && 
           new Date(action.dueDate) <= weekEnd;
  });

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
    <div className="space-y-6 sm:space-y-10" data-onboarding="dashboard">
      {/* Onboarding visuel pour les nouveaux utilisateurs */}
      {showOnboarding && (
        <VisualOnboarding
          completedSteps={completedOnboardingSteps}
          userId={userId}
        />
      )}

      {/* Onboarding wizard (fallback si l'onboarding visuel n'est pas disponible) */}
      {showOnboarding && completedOnboardingSteps.length > 0 && (
        <OnboardingWizard
          completedSteps={completedOnboardingSteps}
          userId={userId}
        />
      )}

      {/* Header Dashboard */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            {firstName ? (
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2">
                Bonjour {firstName}
              </h1>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2">
                Dashboard
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <CreateMenu />
          </div>
        </div>
      </div>

      {/* Statistiques compactes - En haut */}
      <CompactStatistics
        activeProjects={activeProjects}
        tasksInProgress={tasksInProgress}
        overdueCount={overdueCount}
        completionRate={averageProgress}
      />

      {/* Section principale - Mes priorités */}
      <PrioritiesList actions={prioritiesList} />

      {/* Grille secondaire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Colonne gauche - À venir */}
        <UpcomingSection actions={upcomingForSection} />

        {/* Colonne droite - Décisions */}
        <DecisionsSection decisions={riskyDecisions.map((d) => ({ id: d.decision.id, title: d.decision.title, riskLevel: d.meta?.risk?.level }))} />
      </div>
    </div>
  );
}
