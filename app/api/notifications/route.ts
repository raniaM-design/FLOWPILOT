import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Liste paginée des notifications de l'utilisateur
 * Query params: cursor (id de la dernière notification), limit (défaut: 20)
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const filter = searchParams.get("filter"); // "all" | "unread"

    const where: any = {
      userId: session.userId,
    };

    if (filter === "unread") {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limit + 1, // Prendre un de plus pour savoir s'il y a une page suivante
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      notifications: items,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    console.error("[notifications] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

