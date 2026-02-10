import { NextRequest, NextResponse } from "next/server";
import { prisma, ensurePrismaConnection } from "@/lib/db";
import { getSession } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/stats
 * Récupère les statistiques de vues
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et les droits admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    await ensurePrismaConnection(3);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Droits administrateur requis." },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de la requête
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Statistiques globales
    const [
      totalViews,
      uniqueVisitors,
      viewsByPath,
      viewsByUser,
      viewsByDay,
      topPages,
    ] = await Promise.all([
      // Nombre total de vues
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Nombre de visiteurs uniques (utilisateurs distincts)
      prisma.pageView.groupBy({
        by: ["userId"],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      }),

      // Vues par chemin
      prisma.pageView.groupBy({
        by: ["path"],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            path: "desc",
          },
        },
        take: 20,
      }),

      // Vues par utilisateur
      prisma.pageView.groupBy({
        by: ["userId"],
        where: {
          createdAt: {
            gte: startDate,
          },
          userId: {
            not: null,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 20,
      }),

      // Vues par jour
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as count
        FROM "PageView"
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,

      // Pages les plus visitées
      prisma.pageView.groupBy({
        by: ["path"],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            path: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Récupérer les noms des utilisateurs pour les vues par utilisateur
    const userIds = viewsByUser.map((v) => v.userId).filter((id): id is string => id !== null);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const viewsByUserWithNames = viewsByUser.map((view) => {
      const user = users.find((u) => u.id === view.userId);
      return {
        userId: view.userId,
        userName: user?.name || user?.email || "Utilisateur inconnu",
        userEmail: user?.email || null,
        count: view._count,
      };
    });

    return NextResponse.json({
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      overview: {
        totalViews,
        uniqueVisitors: uniqueVisitors.length,
        anonymousViews: uniqueVisitors.filter((v) => v.userId === null).length,
      },
      viewsByPath: viewsByPath.map((v) => ({
        path: v.path,
        count: v._count,
      })),
      viewsByUser: viewsByUserWithNames,
      viewsByDay: viewsByDay.map((v) => ({
        date: v.date.toISOString().split("T")[0],
        count: Number(v.count),
      })),
      topPages: topPages.map((v) => ({
        path: v.path,
        count: v._count,
      })),
    });
  } catch (error: any) {
    console.error("[analytics/stats] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}

