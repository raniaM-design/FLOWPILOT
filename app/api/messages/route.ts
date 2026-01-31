import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/messages
 * Liste paginée des messages de l'utilisateur
 * Query params: cursor (id du dernier message), limit (défaut: 20)
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

    const messages = await prisma.message.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      messages: items,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    console.error("[messages] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}

