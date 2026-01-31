import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isAdmin } from "@/lib/flowpilot-auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour obtenir les statistiques d'utilisation du site
 * Accessible uniquement aux administrateurs
 * Ne contient PAS de données personnelles des utilisateurs
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les droits admin
    const userIsAdmin = await isAdmin(session.userId);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Accès refusé. Droits administrateur requis." },
        { status: 403 }
      );
    }

    // Statistiques générales (sans données personnelles)
    const [
      totalUsers,
      totalProjects,
      totalDecisions,
      totalActions,
      totalMeetings,
      activeUsersLast30Days,
      projectsCreatedLast30Days,
      actionsCompletedLast30Days,
      usersByLanguage,
      projectsByStatus,
      actionsByStatus,
    ] = await Promise.all([
      // Nombre total d'utilisateurs
      prisma.user.count(),

      // Nombre total de projets
      prisma.project.count(),

      // Nombre total de décisions
      prisma.decision.count(),

      // Nombre total d'actions
      prisma.actionItem.count(),

      // Nombre total de réunions
      prisma.meeting.count(),

      // Utilisateurs actifs (qui ont créé quelque chose) dans les 30 derniers jours
      prisma.user.count({
        where: {
          OR: [
            { projects: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { createdDecisions: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { createdActions: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { meetings: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
          ],
        },
      }),

      // Projets créés dans les 30 derniers jours
      prisma.project.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Actions complétées dans les 30 derniers jours
      prisma.actionItem.count({
        where: {
          status: "DONE",
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Répartition des utilisateurs par langue
      prisma.user.groupBy({
        by: ["preferredLanguage"],
        _count: true,
      }),

      // Répartition des projets par statut
      prisma.project.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Répartition des actions par statut
      prisma.actionItem.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    // Statistiques d'inscription (par mois, anonymisées)
    const registrationsByMonth = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: true,
    });

    // Grouper par mois
    const registrationsByMonthFormatted = registrationsByMonth.reduce((acc, item) => {
      const month = new Date(item.createdAt).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + item._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      overview: {
        totalUsers,
        totalProjects,
        totalDecisions,
        totalActions,
        totalMeetings,
      },
      activity: {
        activeUsersLast30Days,
        projectsCreatedLast30Days,
        actionsCompletedLast30Days,
      },
      distributions: {
        usersByLanguage: usersByLanguage.map((item) => ({
          language: item.preferredLanguage || "non défini",
          count: item._count,
        })),
        projectsByStatus: projectsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        actionsByStatus: actionsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
      },
      registrations: {
        byMonth: registrationsByMonthFormatted,
      },
    });
  } catch (error: any) {
    console.error("[admin/stats] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}

