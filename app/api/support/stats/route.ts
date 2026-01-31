import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour obtenir les statistiques pour le support
 * Accessible aux SUPPORT et ADMIN
 * Contient des statistiques sur les utilisateurs (non confidentielles)
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les droits support/admin
    const user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || (user.role !== "SUPPORT" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Accès refusé. Droits support requis." },
        { status: 403 }
      );
    }

    // Statistiques pour le support
    const [
      totalUsers,
      activeUsersLast7Days,
      newUsersLast7Days,
      usersWithIssues,
      totalProjects,
      totalActions,
    ] = await Promise.all([
      // Total utilisateurs
      (prisma as any).user.count(),

      // Utilisateurs actifs (qui ont créé quelque chose) dans les 7 derniers jours
      (prisma as any).user.count({
        where: {
          OR: [
            { projects: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
            { createdDecisions: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
            { createdActions: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
            { meetings: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
          ],
        },
      }),

      // Nouveaux utilisateurs dans les 7 derniers jours
      (prisma as any).user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Utilisateurs sans projets ni actions (potentiels problèmes)
      (prisma as any).user.count({
        where: {
          projects: { none: {} },
          createdActions: { none: {} },
          meetings: { none: {} },
        },
      }),

      // Total projets
      (prisma as any).project.count(),

      // Total actions
      (prisma as any).actionItem.count(),
    ]);

    // Répartition par rôle
    const usersByRole = await (prisma as any).user.groupBy({
      by: ["role"],
      _count: true,
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsersLast7Days,
        newUsersLast7Days,
        usersWithIssues,
        totalProjects,
        totalActions,
      },
      usersByRole: usersByRole.map((item: any) => ({
        role: item.role,
        count: item._count,
      })),
    });
  } catch (error: any) {
    console.error("[support/stats] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}

