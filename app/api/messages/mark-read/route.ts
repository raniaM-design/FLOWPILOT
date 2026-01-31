import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/messages/mark-read
 * Marque un message comme lu
 * Body: { id: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de message requis" },
        { status: 400 }
      );
    }

    // Vérifier que le message appartient à l'utilisateur
    const message = await prisma.message.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    if (message.userId !== session.userId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[messages/mark-read] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage du message" },
      { status: 500 }
    );
  }
}

