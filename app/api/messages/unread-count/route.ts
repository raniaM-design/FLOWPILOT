import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/messages/unread-count
 * Retourne le nombre de messages non lus
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const count = await prisma.message.count({
      where: {
        userId: session.userId,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("[messages/unread-count] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du comptage des messages" },
      { status: 500 }
    );
  }
}

