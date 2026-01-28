import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";

/**
 * DELETE /api/actions/[id]
 * Supprime une action
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const { id } = await params;

    // Supprimer l'action uniquement si elle appartient à un projet de l'utilisateur
    const result = await prisma.actionItem.deleteMany({
      where: {
        id,
        project: {
          ownerId: userId,
        },
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Action non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'action:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

